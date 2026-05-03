from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.life_area import LifeArea
from app.models.distraction import Distraction
from app.models.excuse import Excuse


# ─── Default Seed Data ─────────────────────────────────────────────────────────
DEFAULT_LIFE_AREAS = ["Work", "Health", "Mind", "Personal"]

DEFAULT_DISTRACTIONS = [
    "Social Media",
    "YouTube",
    "Phone Scrolling",
    "TV / Netflix",
    "Gaming",
    "Unnecessary Browsing",
    "Gossip",
]

DEFAULT_EXCUSES = [
    "Too tired",
    "No time",
    "Not motivated",
    "Too stressed",
    "Will do it tomorrow",
    "Not feeling well",
    "Too busy",
]


async def seed_life_areas(db: AsyncSession) -> None:
    for name in DEFAULT_LIFE_AREAS:
        exists = await db.scalar(select(LifeArea).where(LifeArea.name == name))
        if not exists:
            db.add(LifeArea(name=name))
    await db.commit()
    print("✅ Life areas seeded.")


async def seed_distractions(db: AsyncSession) -> None:
    for name in DEFAULT_DISTRACTIONS:
        exists = await db.scalar(select(Distraction).where(Distraction.name == name))
        if not exists:
            db.add(Distraction(name=name))
    await db.commit()
    print("✅ Distractions seeded.")


async def seed_excuses(db: AsyncSession) -> None:
    for reason in DEFAULT_EXCUSES:
        exists = await db.scalar(select(Excuse).where(Excuse.reason == reason))
        if not exists:
            db.add(Excuse(reason=reason))
    await db.commit()
    print("✅ Excuses seeded.")


async def run_all_seeds(db: AsyncSession) -> None:
    await seed_life_areas(db)
    await seed_distractions(db)
    await seed_excuses(db)
    print("✅ All seeds completed!")