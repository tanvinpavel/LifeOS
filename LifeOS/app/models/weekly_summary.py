import uuid
from sqlalchemy import Column, String, Date, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base
from .enums import WeeklyStatus


class WeeklySummary(Base):
    __tablename__ = "weekly_summary"
    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_weekly_summary_user_week"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    overall_status = Column(Enum(WeeklyStatus), nullable=True)
    dominant_mood = Column(String(50), nullable=True)
    top_distraction = Column(String(100), nullable=True)
    top_excuse = Column(String(100), nullable=True)
    average_energy = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="weekly_summaries")