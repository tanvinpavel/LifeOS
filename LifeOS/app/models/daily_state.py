import uuid
from sqlalchemy import Column, String, Date, DateTime, Enum, Text, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base
from .enums import EnergyLevel, Mood


class DailyState(Base):
    __tablename__ = "daily_state"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_state_user_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    energy_level = Column(Enum(EnergyLevel), nullable=True)
    mood = Column(Enum(Mood), nullable=True)
    self_rating = Column(Integer, nullable=True)  # 1–5
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="daily_states")