from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select
from datetime import date, timedelta
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.habit import Habit, HabitLog
from app.schemas.habit import (
    HabitAnalyticsPhase,
    HabitAnalyticsResponse,
    HabitCreate,
    HabitUpdate,
    HabitResponse,
    HabitLogCreate,
    HabitLogResponse,
)

router = APIRouter()


def build_habit_phases(duration: int) -> list[dict]:
    if duration <= 30:
        return [
            {"title": "Design", "start_day": 1, "end_day": 3, "focus": "Make the habit tiny, obvious, and easy to start."},
            {"title": "Install", "start_day": 4, "end_day": 14, "focus": "Repeat the same cue and protect the first small win."},
            {"title": "Stabilize", "start_day": 15, "end_day": duration, "focus": "Reduce friction and keep the log honest."},
        ]
    if duration <= 66:
        return [
            {"title": "Design", "start_day": 1, "end_day": 7, "focus": "Define the cue, minimum action, and reward."},
            {"title": "Install", "start_day": 8, "end_day": 21, "focus": "Make repetition boring, visible, and low effort."},
            {"title": "Stabilize", "start_day": 22, "end_day": 45, "focus": "Handle missed days without restarting the identity."},
            {"title": "Identity", "start_day": 46, "end_day": duration, "focus": "Turn the action into the kind of person you are becoming."},
        ]
    return [
        {"title": "Design", "start_day": 1, "end_day": 10, "focus": "Shape a clean environment and clear trigger."},
        {"title": "Install", "start_day": 11, "end_day": 30, "focus": "Repeat the minimum version until it feels automatic."},
        {"title": "Stabilize", "start_day": 31, "end_day": 60, "focus": "Increase reliability before increasing ambition."},
        {"title": "Identity", "start_day": 61, "end_day": duration, "focus": "Review, deepen, and make the habit part of your operating system."},
    ]


def percent(part: int, total: int) -> int:
    return round((part / total) * 100) if total else 0


def habit_start(habit: Habit) -> date:
    return habit.start_date or habit.created_at.date()


def habit_duration(habit: Habit) -> int:
    return habit.duration_days or 66


def habit_end(habit: Habit) -> date:
    return habit.end_date or habit_start(habit) + timedelta(days=habit_duration(habit) - 1)


def habit_phases(habit: Habit) -> list[dict]:
    return habit.phases or build_habit_phases(habit_duration(habit))


@router.post("/", response_model=HabitResponse, status_code=201)
async def create_habit(
    data: HabitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = data.model_dump()
    duration = payload.get("duration_days") or 66
    start = payload.get("start_date") or date.today()
    payload["duration_days"] = duration
    payload["start_date"] = start
    payload["end_date"] = payload.get("end_date") or start + timedelta(days=duration - 1)
    payload["phases"] = payload.get("phases") or build_habit_phases(duration)
    habit = Habit(user_id=current_user.id, **payload)
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.get("/", response_model=List[HabitResponse])
async def get_habits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Habit).where(Habit.user_id == current_user.id, Habit.is_active == True))
    return result.scalars().all()


@router.get("/logs", response_model=List[HabitLogResponse])
async def get_habit_logs(
    entry_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(HabitLog)
        .join(Habit, Habit.id == HabitLog.habit_id)
        .where(Habit.user_id == current_user.id, HabitLog.date == entry_date)
    )
    return result.scalars().all()


@router.get("/analytics", response_model=List[HabitAnalyticsResponse])
async def get_habit_analytics(
    as_of: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_date = as_of or date.today()
    result = await db.execute(select(Habit).where(Habit.user_id == current_user.id, Habit.is_active == True))
    habits = result.scalars().all()
    analytics: list[HabitAnalyticsResponse] = []

    for habit in habits:
        start = habit_start(habit)
        duration = habit_duration(habit)
        end = habit_end(habit)
        day = min(max((current_date - start).days + 1, 0), duration)
        elapsed = max(day, 0)

        log_result = await db.execute(
            select(HabitLog).where(HabitLog.habit_id == habit.id, HabitLog.date >= start, HabitLog.date <= end)
        )
        logs = {log.date: log.status for log in log_result.scalars().all()}
        checked = sum(1 for log_date, status in logs.items() if status and log_date <= current_date)
        phases = habit_phases(habit)
        analytics_phases: list[HabitAnalyticsPhase] = []
        current_phase = phases[-1]["title"] if phases else "Habit"

        for phase in phases:
            phase_start = start + timedelta(days=phase["start_day"] - 1)
            phase_end = start + timedelta(days=phase["end_day"] - 1)
            phase_total = max((phase_end - phase_start).days + 1, 0)
            phase_elapsed_end = min(phase_end, current_date)
            phase_elapsed = max((phase_elapsed_end - phase_start).days + 1, 0) if current_date >= phase_start else 0
            phase_completed = sum(
                1
                for log_date, status in logs.items()
                if status and phase_start <= log_date <= phase_end and log_date <= current_date
            )
            if phase["start_day"] <= max(day, 1) <= phase["end_day"]:
                current_phase = phase["title"]
            analytics_phases.append(
                HabitAnalyticsPhase(
                    name=phase["title"],
                    title=phase["title"],
                    start_day=phase["start_day"],
                    end_day=phase["end_day"],
                    focus=phase["focus"],
                    completed=phase_completed,
                    total=phase_total,
                    elapsed=phase_elapsed,
                    percent=percent(phase_completed, phase_elapsed or phase_total),
                )
            )

        heatmap = "".join(
            "1" if logs.get(start + timedelta(days=index)) is True else "0"
            for index in range(duration)
        )
        adherence = percent(checked, elapsed)
        insight = (
            "Strong consistency. Keep protecting the cue."
            if adherence >= 80
            else "Good progress, but one phase needs attention."
            if adherence >= 65
            else "The habit is at risk. Shrink the routine and recover the streak."
        )

        analytics.append(
            HabitAnalyticsResponse(
                habit_id=habit.id,
                name=habit.title,
                area=habit.category,
                start=start,
                end=end,
                day=day,
                duration=duration,
                checked=checked,
                elapsed=elapsed,
                adherence=adherence,
                currentPhase=current_phase,
                insight=insight,
                heatmap=heatmap,
                phases=analytics_phases,
            )
        )

    return analytics


@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: UUID,
    data: HabitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    habit = await db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(habit, field, value)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.put("/{habit_id}/log/{entry_date}", response_model=HabitLogResponse)
async def upsert_habit_log(
    habit_id: UUID,
    entry_date: date,
    data: HabitLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.habit_id != habit_id or data.date != entry_date:
        raise HTTPException(status_code=400, detail="Habit log path and body do not match")

    habit = await db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    log = await db.scalar(select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.date == entry_date))
    if log:
        log.status = data.status
    else:
        log = HabitLog(**data.model_dump())
        db.add(log)

    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(
    habit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    habit = await db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit_end(habit) >= date.today():
        raise HTTPException(status_code=400, detail="Habit cannot be deleted until the contract period ends")
    await db.execute(delete(HabitLog).where(HabitLog.habit_id == habit_id))
    await db.delete(habit)
    await db.commit()


@router.post("/log", response_model=HabitLogResponse, status_code=201)
async def log_habit(
    data: HabitLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    habit = await db.scalar(select(Habit).where(Habit.id == data.habit_id, Habit.user_id == current_user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    existing = await db.scalar(select(HabitLog).where(HabitLog.habit_id == data.habit_id, HabitLog.date == data.date))
    if existing:
        raise HTTPException(status_code=400, detail="Already logged for this date")
    log = HabitLog(**data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
