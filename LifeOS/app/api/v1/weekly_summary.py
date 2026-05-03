from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.weekly_summary import WeeklySummary
from app.schemas.weekly_summary import WeeklySummaryResponse

router = APIRouter()


@router.get("/", response_model=List[WeeklySummaryResponse])
async def get_my_summaries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WeeklySummary)
        .where(WeeklySummary.user_id == current_user.id)
        .order_by(WeeklySummary.week_start.desc())
    )
    return result.scalars().all()