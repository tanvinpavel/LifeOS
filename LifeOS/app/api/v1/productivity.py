from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.productivity import ProductivityFeeling
from app.schemas.productivity import ProductivityFeelingCreate, ProductivityFeelingResponse

router = APIRouter()


@router.post("/", response_model=ProductivityFeelingResponse, status_code=201)
async def log_productivity(
    data: ProductivityFeelingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.scalar(
        select(ProductivityFeeling).where(
            ProductivityFeeling.user_id == current_user.id,
            ProductivityFeeling.date == data.date,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Productivity already logged for this date")
    log = ProductivityFeeling(user_id=current_user.id, **data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/", response_model=List[ProductivityFeelingResponse])
async def get_my_productivity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProductivityFeeling)
        .where(ProductivityFeeling.user_id == current_user.id)
        .order_by(ProductivityFeeling.date.desc())
    )
    return result.scalars().all()