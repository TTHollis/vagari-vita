import os
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import LocalTip
from ..services.openai_service import generate_briefing, moderate_content
from ..services.geocoding import canonicalize_location

router = APIRouter(tags=["nomad"])


async def require_admin(x_admin_token: str | None = Header(default=None)):
    """
    Shared-secret gate for admin endpoints. Set ADMIN_TOKEN in the environment;
    callers must send a matching X-Admin-Token header. Fails closed: if no token
    is configured on the server, admin access is denied entirely.
    """
    expected = os.getenv("ADMIN_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="Admin access is not configured.")
    if not x_admin_token or x_admin_token != expected:
        raise HTTPException(status_code=401, detail="Invalid admin token.")
    return True


class TipCreate(BaseModel):
    city: str = Field(..., min_length=1, max_length=120)
    category: str = Field("general", max_length=60)
    content: str = Field(..., min_length=10, max_length=1000)
    author_handle: str = Field("anonymous", max_length=60)


@router.get("/briefing")
async def get_briefing(city: str = Query(..., min_length=1, max_length=100)):
    try:
        briefing = await generate_briefing(city)
        return {"city": city, "briefing": briefing}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/tips")
async def get_tips(
    city: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    # Normalize zip → "City, State" so tips show up across both search modes
    canonical = await canonicalize_location(city)
    # Only return approved tips to the public, most-upvoted first
    result = await db.execute(
        select(LocalTip)
        .where(LocalTip.city == canonical, LocalTip.status == "approved")
        .order_by(LocalTip.upvotes.desc(), LocalTip.created_at.desc())
        .limit(50)
    )
    tips = result.scalars().all()
    return {
        "city": canonical,
        "tips": [
            {
                "id": t.id,
                "category": t.category,
                "content": t.content,
                "author_handle": t.author_handle,
                "upvotes": t.upvotes or 0,
                "created_at": t.created_at.isoformat(),
            }
            for t in tips
        ],
    }


# Community-report threshold: at this many reports, a tip auto-hides pending review
REPORT_THRESHOLD = 3


@router.post("/tips/{tip_id}/upvote")
async def upvote_tip(tip_id: int, db: AsyncSession = Depends(get_db)):
    tip = await db.get(LocalTip, tip_id)
    if not tip or tip.status != "approved":
        raise HTTPException(status_code=404, detail="Tip not found")
    tip.upvotes = (tip.upvotes or 0) + 1
    await db.commit()
    return {"id": tip.id, "upvotes": tip.upvotes}


@router.post("/tips/{tip_id}/report")
async def report_tip(tip_id: int, db: AsyncSession = Depends(get_db)):
    tip = await db.get(LocalTip, tip_id)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    tip.report_count = (tip.report_count or 0) + 1
    # Auto-hide once enough people flag it; lands in the admin review queue
    if tip.report_count >= REPORT_THRESHOLD and tip.status == "approved":
        tip.status = "flagged"
    await db.commit()
    return {"id": tip.id, "reported": True}


@router.post("/tips", status_code=201)
async def post_tip(body: TipCreate, db: AsyncSession = Depends(get_db)):
    # Normalize city so a tip submitted from a zip search shows up in
    # city searches too (and vice versa)
    canonical_city = await canonicalize_location(body.city)

    # Run AI moderation first
    try:
        moderation = await moderate_content(body.content)
    except Exception:
        # If moderation API fails, fall back to permissive (better to allow than to lock users out)
        moderation = {"flagged": False, "categories": []}

    payload = body.model_dump()
    payload["city"] = canonical_city
    tip = LocalTip(
        **payload,
        status="rejected" if moderation["flagged"] else "approved",
        rejection_categories=",".join(moderation["categories"]) if moderation["flagged"] else None,
    )
    db.add(tip)
    await db.commit()
    await db.refresh(tip)

    if moderation["flagged"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Your tip didn't pass our community standards check. Please rephrase and try again.",
                "categories": moderation["categories"],
            },
        )
    return {"id": tip.id, "created_at": tip.created_at.isoformat(), "status": "approved"}


def _serialize_admin_tip(t: LocalTip) -> dict:
    return {
        "id": t.id,
        "city": t.city,
        "category": t.category,
        "content": t.content,
        "author_handle": t.author_handle,
        "status": t.status,
        "upvotes": t.upvotes or 0,
        "report_count": t.report_count or 0,
        "rejection_categories": (t.rejection_categories or "").split(",") if t.rejection_categories else [],
        "created_at": t.created_at.isoformat(),
    }


@router.get("/admin/tips")
async def admin_list_tips(
    status: str = Query("flagged", pattern="^(flagged|rejected|approved)$"),
    _: bool = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List tips by status for moderation review. Requires admin token."""
    result = await db.execute(
        select(LocalTip)
        .where(LocalTip.status == status)
        .order_by(LocalTip.report_count.desc(), LocalTip.created_at.desc())
        .limit(500)
    )
    tips = result.scalars().all()
    return {"status": status, "count": len(tips), "tips": [_serialize_admin_tip(t) for t in tips]}


@router.get("/admin/summary")
async def admin_summary(
    _: bool = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Counts per status, for the admin dashboard header."""
    out = {}
    for s in ("approved", "flagged", "rejected"):
        result = await db.execute(select(LocalTip).where(LocalTip.status == s))
        out[s] = len(result.scalars().all())
    return out


@router.post("/admin/tips/{tip_id}/restore")
async def admin_restore_tip(
    tip_id: int,
    _: bool = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve a flagged/rejected tip and reset its report counter."""
    tip = await db.get(LocalTip, tip_id)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    tip.status = "approved"
    tip.report_count = 0
    await db.commit()
    return {"id": tip.id, "status": tip.status}


@router.delete("/admin/tips/{tip_id}")
async def admin_delete_tip(
    tip_id: int,
    _: bool = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a tip."""
    tip = await db.get(LocalTip, tip_id)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    await db.delete(tip)
    await db.commit()
    return {"id": tip_id, "deleted": True}
