from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, Session, Handover
from app.schemas.schemas import HandoverCreate, HandoverUpdate, HandoverOut

router = APIRouter(prefix="/sessions/{session_id}/handover", tags=["引き継ぎ"])


@router.get("", response_model=HandoverOut | None)
async def get_handover(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Handover).where(Handover.session_id == session_id)
    )
    handover = result.scalar_one_or_none()
    return handover


@router.put("", response_model=HandoverOut)
async def upsert_handover(
    session_id: UUID,
    body: HandoverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify session exists and belongs to org
    sess_result = await db.execute(
        select(Session).where(Session.id == session_id, Session.org_id == current_user.org_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="授業枠が見つかりません")

    result = await db.execute(
        select(Handover).where(Handover.session_id == session_id)
    )
    handover = result.scalar_one_or_none()

    if handover:
        for key, value in body.model_dump(exclude_unset=True).items():
            setattr(handover, key, value)
    else:
        handover = Handover(session_id=session_id, **body.model_dump())
        db.add(handover)

    await db.flush()
    await db.refresh(handover)
    return handover
