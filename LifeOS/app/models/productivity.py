import uuid
from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base
from .enums import ProductivityLevel


class ProductivityFeeling(Base):
    __tablename__ = "productivity_feeling"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_productivity_user_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    level = Column(Enum(ProductivityLevel), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="productivity_feelings")