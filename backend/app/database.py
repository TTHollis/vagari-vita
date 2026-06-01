import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./urban_nomad.db")

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight migrations for SQLite — add columns if they don't exist
        # (create_all only creates new tables; existing tables don't gain columns)
        for stmt in [
            "ALTER TABLE local_tips ADD COLUMN status VARCHAR(20) DEFAULT 'approved'",
            "ALTER TABLE local_tips ADD COLUMN rejection_categories VARCHAR(255)",
            "ALTER TABLE local_tips ADD COLUMN upvotes INTEGER DEFAULT 0",
            "ALTER TABLE local_tips ADD COLUMN report_count INTEGER DEFAULT 0",
        ]:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass  # column already exists


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
