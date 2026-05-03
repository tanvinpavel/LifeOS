from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional


class HabitPhase(BaseModel):
    title: str
    start_day: int
    end_day: int
    focus: str


class HabitCreate(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    category: str  # health / skill / mind
    why: Optional[str] = None
    cue: Optional[str] = None
    routine: Optional[str] = None
    reward: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = None
    phases: Optional[List[HabitPhase]] = None


class HabitUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=100)
    category: Optional[str] = None
    why: Optional[str] = None
    cue: Optional[str] = None
    routine: Optional[str] = None
    reward: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = None
    phases: Optional[List[HabitPhase]] = None
    is_active: Optional[bool] = None


class HabitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    category: str
    why: Optional[str] = None
    cue: Optional[str] = None
    routine: Optional[str] = None
    reward: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = None
    phases: Optional[List[HabitPhase]] = None
    is_active: bool
    created_at: datetime


class HabitLogCreate(BaseModel):
    habit_id: UUID
    date: date
    status: bool


class HabitLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    habit_id: UUID
    date: date
    status: bool
    created_at: datetime


class HabitAnalyticsPhase(BaseModel):
    name: str
    title: str
    start_day: int
    end_day: int
    focus: str
    completed: int
    total: int
    elapsed: int
    percent: int


class HabitAnalyticsResponse(BaseModel):
    habit_id: UUID
    name: str
    area: str
    start: date
    end: date
    day: int
    duration: int
    checked: int
    elapsed: int
    adherence: int
    currentPhase: str
    insight: str
    heatmap: str
    phases: List[HabitAnalyticsPhase]
