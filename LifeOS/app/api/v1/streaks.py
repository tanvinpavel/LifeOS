from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.streak import Streak
from app.schemas.streak import StreakResponse

router = APIRouter()


@router.get("/", response_model=List[StreakResponse])
async def get_my_streaks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Streak).where(Streak.user_id == current_user.id))
    return result.scalars().all()