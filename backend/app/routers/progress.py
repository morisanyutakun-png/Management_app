from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, Progress, Material
from app.schemas.schemas import ProgressCreate, ProgressUpdate, ProgressOut

router = APIRouter(prefix="/progress", tags=["進捗"])


def _progress_to_out(p: Progress) -> ProgressOut:
    return ProgressOut(
        id=p.id,
        student_id=p.student_id,
        material_id=p.material_id,
        status=p.status,
        last_session_id=p.last_session_id,
        notes=p.notes,
        updated_at=p.updated_at,
        material_title=p.material.title if p.material else None,
        material_subject=p.material.subject if p.material else None,
    )


@router.get("/student/{student_id}", response_model=list[ProgressOut])
async def list_student_progress(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Progress)
        .options(selectinload(Progress.material))
        .where(Progress.student_id == student_id)
        .order_by(Progress.updated_at.desc())
    )
    records = result.scalars().all()
    return [_progress_to_out(p) for p in records]


@router.post("", response_model=ProgressOut, status_code=status.HTTP_201_CREATED)
async def create_progress(
    body: ProgressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if already exists
    existing = await db.execute(
        select(Progress).where(
            Progress.student_id == body.student_id,
            Progress.material_id == body.material_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="この生徒と教材の進捗は既に存在します")

    progress = Progress(**body.model_dump())
    db.add(progress)
    await db.flush()
    # Reload with material
    result = await db.execute(
        select(Progress)
        .options(selectinload(Progress.material))
        .where(Progress.id == progress.id)
    )
    p = result.scalar_one()
    return _progress_to_out(p)


@router.patch("/{progress_id}", response_model=ProgressOut)
async def update_progress(
    progress_id: UUID,
    body: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Progress).where(Progress.id == progress_id))
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="進捗が見つかりません")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(progress, key, value)
    await db.flush()
    # Reload with material
    result = await db.execute(
        select(Progress)
        .options(selectinload(Progress.material))
        .where(Progress.id == progress_id)
    )
    p = result.scalar_one()
    return _progress_to_out(p)


@router.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_progress(
    progress_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Progress).where(Progress.id == progress_id))
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="進捗が見つかりません")
    await db.delete(progress)
