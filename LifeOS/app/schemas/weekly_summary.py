from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from app.models.enums import WeeklyStatus


class WeeklySummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    week_start: date
    week_end: date
    overall_status: Optional[WeeklyStatus] = None
    dominant_mood: Optional[str] = None
    top_distraction: Optional[str] = None
    top_excuse: Optional[str] = None
    average_energy: Optional[str] = None
    created_at: datetime