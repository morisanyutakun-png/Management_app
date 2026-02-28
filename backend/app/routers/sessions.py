from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, Session, Student, Material
from app.schemas.schemas import SessionCreate, SessionUpdate, SessionOut, TeacherOut

router = APIRouter(prefix="/sessions", tags=["授業枠"])


# ── Teachers listing (for dropdowns) — must be before /{session_id} routes ──
@router.get("/meta/teachers", response_model=list[TeacherOut])
async def list_teachers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.org_id == current_user.org_id).order_by(User.name)
    )
    return result.scalars().all()


def _session_to_out(s: Session) -> SessionOut:
    return SessionOut(
        id=s.id,
        student_id=s.student_id,
        teacher_id=s.teacher_id,
        substitute_teacher_id=s.substitute_teacher_id,
        subject=s.subject,
        start_at=s.start_at,
        end_at=s.end_at,
        status=s.status,
        material_id=s.material_id,
        notes=s.notes,
        org_id=s.org_id,
        created_at=s.created_at,
        student_name=s.student.name if s.student else None,
        teacher_name=s.teacher.name if s.teacher else None,
        substitute_teacher_name=s.substitute_teacher.name if s.substitute_teacher else None,
        material_title=s.material.title if s.material else None,
        handover=s.handover,
    )


@router.get("", response_model=list[SessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    student_id: UUID | None = Query(None),
):
    q = (
        select(Session)
        .options(
            selectinload(Session.student),
            selectinload(Session.teacher),
            selectinload(Session.substitute_teacher),
            selectinload(Session.material),
            selectinload(Session.handover),
        )
        .where(Session.org_id == current_user.org_id)
    )
    if student_id:
        q = q.where(Session.student_id == student_id)
    q = q.order_by(Session.start_at.desc())
    result = await db.execute(q)
    sessions = result.scalars().all()
    return [_session_to_out(s) for s in sessions]


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.student),
            selectinload(Session.teacher),
            selectinload(Session.substitute_teacher),
            selectinload(Session.material),
            selectinload(Session.handover),
        )
        .where(Session.id == session_id, Session.org_id == current_user.org_id)
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="授業枠が見つかりません")
    return _session_to_out(s)


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = Session(org_id=current_user.org_id, **body.model_dump())
    db.add(session)
    await db.flush()
    # Reload with relationships
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.student),
            selectinload(Session.teacher),
            selectinload(Session.substitute_teacher),
            selectinload(Session.material),
            selectinload(Session.handover),
        )
        .where(Session.id == session.id)
    )
    s = result.scalar_one()
    return _session_to_out(s)


@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: UUID,
    body: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.org_id == current_user.org_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="授業枠が見つかりません")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(session, key, value)
    await db.flush()
    # Reload
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.student),
            selectinload(Session.teacher),
            selectinload(Session.substitute_teacher),
            selectinload(Session.material),
            selectinload(Session.handover),
        )
        .where(Session.id == session_id)
    )
    s = result.scalar_one()
    return _session_to_out(s)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.org_id == current_user.org_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="授業枠が見つかりません")
    await db.delete(session)
