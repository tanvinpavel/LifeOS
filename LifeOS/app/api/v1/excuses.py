from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import date

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.distraction import Distraction, DailyDistractionLog
from app.schemas.distraction import DistractionResponse, DailyDistractionLogCreate, DailyDistractionLogResponse

router = APIRouter()


@router.get("/", response_model=List[DistractionResponse])
async def get_distractions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Distraction))
    return result.scalars().all()


@router.post("/log", response_model=DailyDistractionLogResponse, status_code=201)
async def log_distraction(
    data: DailyDistractionLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = DailyDistractionLog(user_id=current_user.id, **data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    await db.refresh(log, ["distraction"])
    return log


@router.get("/log", response_model=List[DailyDistractionLogResponse])
async def get_my_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DailyDistractionLog)
        .where(DailyDistractionLog.user_id == current_user.id)
        .options(selectinload(DailyDistractionLog.distraction))
        .order_by(DailyDistractionLog.date.desc())
    )
    return result.scalars().all()