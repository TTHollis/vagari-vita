import os
import re
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase


def _normalize_db_url(url: str) -> str:
    """
    Make a connection string safe for SQLAlchemy + asyncpg.

    Managed Postgres providers (Neon, Supabase, Render) hand out libpq-style
    URLs like `postgres://user:pass@host/db?sslmode=require`. We need:
      - the async driver scheme `postgresql+asyncpg://`
      - libpq-only query params (sslmode, channel_binding) removed, since
        asyncpg rejects them; SSL is enabled via connect_args instead.
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Strip params asyncpg doesn't understand
    url = re.sub(r"[?&](sslmode|channel_binding)=[^&]+", "", url)
    # Tidy any dangling separators left behind
    url = url.replace("?&", "?").rstrip("?&")
    return url


RAW_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./urban_nomad.db")
DATABASE_URL = _normalize_db_url(RAW_URL)
IS_POSTGRES = DATABASE_URL.startswith("postgresql")

# Neon and other managed Postgres require SSL; asyncpg takes it via connect_args
connect_args = {"ssl": True} if IS_POSTGRES else {}

engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    from sqlalchemy import text

    # create_all builds any missing tables with their full current schema.
    # On a fresh Postgres (Neon) database this creates local_tips complete
    # with every column, so no further migration is needed there.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Lightweight, SQLite-only column migrations for pre-existing local .db
    # files that predate newer columns. (Postgres aborts a whole transaction
    # on a failed statement, so we never run these against Postgres —
    # create_all above already handled a fresh Postgres schema.)
    if DATABASE_URL.startswith("sqlite"):
        async with engine.begin() as conn:
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
