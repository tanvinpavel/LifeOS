import uuid
from sqlalchemy import Column, String, Date, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base
from .enums import Intensity


class Distraction(Base):
    """Predefined distractions (e.g. Social Media, Phone, TV)."""
    __tablename__ = "distractions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)

    logs = relationship("DailyDistractionLog", back_populates="distraction")


class DailyDistractionLog(Base):
    __tablename__ = "daily_distraction_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    distraction_id = Column(UUID(as_uuid=True), ForeignKey("distractions.id"), nullable=False)
    date = Column(Date, nullable=False)
    intensity = Column(Enum(Intensity), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="distraction_logs")
    distraction = relationship("Distraction", back_populates="logs")