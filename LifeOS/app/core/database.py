from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy import text
from typing import AsyncGenerator

from app.core.config import get_settings

settings = get_settings()

# ══════════════════════════════════════════════════════════════════════════════
# ENGINE — PostgreSQL async connection pool
# ══════════════════════════════════════════════════════════════════════════════
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,     # DEBUG=True হলে প্রতিটা SQL print হবে
    pool_size=10,            # সর্বোচ্চ ১০টা persistent connection
    max_overflow=20,         # peak load এ আরো ২০টা extra নিতে পারবে
    pool_pre_ping=True,      # connection dead হলে auto-reconnect করবে
    pool_recycle=3600,       # ১ ঘণ্টা পর connection refresh — stale connection এড়াবে
    pool_timeout=30,         # ৩০ সেকেন্ডে connection না পেলে error throw করবে
)

# ══════════════════════════════════════════════════════════════════════════════
# SESSION FACTORY
# ══════════════════════════════════════════════════════════════════════════════
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # commit এর পরেও object access করা যাবে
    autocommit=False,
    autoflush=False,
)

# ══════════════════════════════════════════════════════════════════════════════
# DEPENDENCY — FastAPI route এ inject করার জন্য
# ══════════════════════════════════════════════════════════════════════════════
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    প্রতিটা HTTP request এ নতুন session তৈরি হবে।
    Request শেষে:
      - সফল হলে → commit
      - Error হলে → rollback
      - সবশেষে  → close

    Route এ use করার নিয়ম:
        from sqlalchemy.ext.asyncio import AsyncSession
        from fastapi import Depends
        from app.core.database import get_db

        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ══════════════════════════════════════════════════════════════════════════════
# CONNECTION TEST
# ══════════════════════════════════════════════════════════════════════════════
async def check_db_connection() -> bool:
    """
    Database connected কিনা check করে।
    App startup এবং /health endpoint এ use হবে।
    True = connected, False = failed
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"❌ DB connection failed: {e}")
        return False


# ══════════════════════════════════════════════════════════════════════════════
# TABLE INIT — Migration ছাড়া সরাসরি models থেকে tables তৈরি
# ══════════════════════════════════════════════════════════════════════════════
async def init_db() -> None:
    """
    App startup এ একবার run হবে।
    সব SQLAlchemy model থেকে PostgreSQL tables তৈরি করবে।
    Table আগে থেকে থাকলে skip করবে — migration দরকার নেই।
    """
    from app.models.base import Base

    # সব model import করতে হবে যাতে Base.metadata তে register হয়
    from app.models.user import User, UserSettings                        # noqa
    from app.models.daily_state import DailyState                        # noqa
    from app.models.life_area import LifeArea, LifeAreaStatus            # noqa
    from app.models.distraction import Distraction, DailyDistractionLog  # noqa
    from app.models.excuse import Excuse, DailyExcuseLog                 # noqa
    from app.models.habit import Habit, HabitLog                         # noqa
    from app.models.productivity import ProductivityFeeling              # noqa
    from app.models.weekly_summary import WeeklySummary                  # noqa
    from app.models.streak import Streak                                 # noqa

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS why TEXT"))
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS cue VARCHAR(200)"))
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS routine VARCHAR(200)"))
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS reward VARCHAR(200)"))
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS start_date DATE"))
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS end_date DATE"))
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS duration_days INTEGER"))
        await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS phases JSONB"))

    print("✅ All database tables ready!")
