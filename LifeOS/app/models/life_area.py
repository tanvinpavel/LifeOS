import uuid
from sqlalchemy import Column, String, Date, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base
from .enums import AreaStatus


class LifeArea(Base):
    """
    Predefined life areas — Work, Health, Mind, Personal.
    Seeded once at app startup.
    """
    __tablename__ = "life_areas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)

    statuses = relationship("LifeAreaStatus", back_populates="life_area")


class LifeAreaStatus(Base):
    __tablename__ = "life_area_status"
    __table_args__ = (
        UniqueConstraint("user_id", "life_area_id", "date", name="uq_life_area_status_user_area_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    life_area_id = Column(UUID(as_uuid=True), ForeignKey("life_areas.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AreaStatus), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="life_area_statuses")
    life_area = relationship("LifeArea", back_populates="statuses")