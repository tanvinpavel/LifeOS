from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.daily_state import DailyState
from app.schemas.daily_state import DailyStateCreate, DailyStateUpdate, DailyStateResponse

router = APIRouter()


@router.post("/", response_model=DailyStateResponse, status_code=201)
async def create_daily_state(
    data: DailyStateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.scalar(
        select(DailyState).where(DailyState.user_id == current_user.id, DailyState.date == data.date)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Daily state for this date already exists")
    state = DailyState(user_id=current_user.id, **data.model_dump())
    db.add(state)
    await db.commit()
    await db.refresh(state)
    return state


@router.get("/today", response_model=DailyStateResponse)
async def get_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = await db.scalar(
        select(DailyState).where(DailyState.user_id == current_user.id, DailyState.date == date.today())
    )
    if not state:
        raise HTTPException(status_code=404, detail="No entry for today")
    return state


@router.get("/{entry_date}", response_model=DailyStateResponse)
async def get_by_date(
    entry_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = await db.scalar(
        select(DailyState).where(DailyState.user_id == current_user.id, DailyState.date == entry_date)
    )
    if not state:
        raise HTTPException(status_code=404, detail="No entry for this date")
    return state


@router.patch("/{entry_date}", response_model=DailyStateResponse)
async def update_daily_state(
    entry_date: date,
    data: DailyStateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = await db.scalar(
        select(DailyState).where(DailyState.user_id == current_user.id, DailyState.date == entry_date)
    )
    if not state:
        raise HTTPException(status_code=404, detail="No entry for this date")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(state, field, value)
    await db.commit()
    await db.refresh(state)
    return state