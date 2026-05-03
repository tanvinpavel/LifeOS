from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from app.models.enums import ProductivityLevel


class ProductivityFeelingCreate(BaseModel):
    date: date
    level: ProductivityLevel


class ProductivityFeelingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    date: date
    level: ProductivityLevel
    created_at: datetime