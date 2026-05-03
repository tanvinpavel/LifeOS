from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.life_area import LifeArea, LifeAreaStatus
from app.schemas.life_area import LifeAreaResponse, LifeAreaStatusCreate, LifeAreaStatusResponse

router = APIRouter()


@router.get("/", response_model=List[LifeAreaResponse])
async def get_life_areas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LifeArea))
    return result.scalars().all()


@router.post("/status", response_model=LifeAreaStatusResponse, status_code=201)
async def set_status(
    data: LifeAreaStatusCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.scalar(
        select(LifeAreaStatus).where(
            LifeAreaStatus.user_id == current_user.id,
            LifeAreaStatus.life_area_id == data.life_area_id,
            LifeAreaStatus.date == data.date,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Status for this area and date already exists")
    status = LifeAreaStatus(user_id=current_user.id, **data.model_dump())
    db.add(status)
    await db.commit()
    await db.refresh(status)
    await db.refresh(status, ["life_area"])
    return status


@router.get("/status", response_model=List[LifeAreaStatusResponse])
async def get_my_statuses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(LifeAreaStatus)
        .where(LifeAreaStatus.user_id == current_user.id)
        .options(selectinload(LifeAreaStatus.life_area))
        .order_by(LifeAreaStatus.date.desc())
    )
    return result.scalars().all()