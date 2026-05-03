import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base


class Excuse(Base):
    """Predefined excuses (e.g. Too tired, No time, Not motivated)."""
    __tablename__ = "excuses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reason = Column(String(150), unique=True, nullable=False)

    logs = relationship("DailyExcuseLog", back_populates="excuse")


class DailyExcuseLog(Base):
    __tablename__ = "daily_excuse_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    excuse_id = Column(UUID(as_uuid=True), ForeignKey("excuses.id"), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="excuse_logs")
    excuse = relationship("Excuse", back_populates="logs")