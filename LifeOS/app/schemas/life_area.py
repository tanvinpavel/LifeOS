from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from app.models.enums import AreaStatus


class LifeAreaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class LifeAreaStatusCreate(BaseModel):
    life_area_id: UUID
    date: date
    status: AreaStatus


class LifeAreaStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    life_area_id: UUID
    date: date
    status: AreaStatus
    created_at: datetime
    life_area: LifeAreaResponse