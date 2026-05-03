import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    daily_states = relationship("DailyState", back_populates="user")
    life_area_statuses = relationship("LifeAreaStatus", back_populates="user")
    distraction_logs = relationship("DailyDistractionLog", back_populates="user")
    excuse_logs = relationship("DailyExcuseLog", back_populates="user")
    habits = relationship("Habit", back_populates="user")
    productivity_feelings = relationship("ProductivityFeeling", back_populates="user")
    weekly_summaries = relationship("WeeklySummary", back_populates="user")
    streaks = relationship("Streak", back_populates="user")


class UserSettings(Base):
    __tablename__ = "user_settings"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_settings_user"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    daily_reminder = Column(Boolean, default=True)
    privacy_mode = Column(String(20), default="normal")
    week_start_day = Column(String(10), default="monday")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="settings")