from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime


class ExcuseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reason: str


class DailyExcuseLogCreate(BaseModel):
    excuse_id: UUID
    date: date


class DailyExcuseLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    excuse_id: UUID
    date: date
    created_at: datetime
    excuse: ExcuseResponse