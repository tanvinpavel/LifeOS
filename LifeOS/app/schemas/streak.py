from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class StreakResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: str
    current_count: int
    max_count: int
    updated_at: datetime