from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class LocalTip(Base):
    __tablename__ = "local_tips"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    city: Mapped[str] = mapped_column(String(120), index=True)
    category: Mapped[str] = mapped_column(String(60), default="general")
    content: Mapped[str] = mapped_column(Text)
    author_handle: Mapped[str] = mapped_column(String(60), default="anonymous")
    # Moderation: approved | rejected | flagged (community-reported, pending review)
    status: Mapped[str] = mapped_column(String(20), default="approved", index=True)
    # Comma-separated list of moderation categories that flagged the content
    rejection_categories: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Community engagement & safety
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    report_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
