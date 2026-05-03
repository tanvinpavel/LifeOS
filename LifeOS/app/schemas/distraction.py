from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from app.models.enums import Intensity


class DistractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class DailyDistractionLogCreate(BaseModel):
    distraction_id: UUID
    date: date
    intensity: Intensity


class DailyDistractionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    distraction_id: UUID
    date: date
    intensity: Intensity
    created_at: datetime
    distraction: DistractionResponse