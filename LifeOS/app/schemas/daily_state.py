from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from app.models.enums import EnergyLevel, Mood


class DailyStateCreate(BaseModel):
    date: date
    energy_level: Optional[EnergyLevel] = None
    mood: Optional[Mood] = None
    self_rating: Optional[int] = Field(default=None, ge=1, le=5)
    note: Optional[str] = Field(default=None, max_length=1000)


class DailyStateUpdate(BaseModel):
    energy_level: Optional[EnergyLevel] = None
    mood: Optional[Mood] = None
    self_rating: Optional[int] = Field(default=None, ge=1, le=5)
    note: Optional[str] = Field(default=None, max_length=1000)


class DailyStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    date: date
    energy_level: Optional[EnergyLevel] = None
    mood: Optional[Mood] = None
    self_rating: Optional[int] = None
    note: Optional[str] = None
    created_at: datetime