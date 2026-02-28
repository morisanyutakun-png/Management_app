from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.models.models import UserRole, SessionStatus, ProgressStatus


# ── Auth ──
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    org_id: UUID
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ── Student ──
class StudentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    grade: Optional[str] = None
    notes: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    grade: Optional[str] = None
    notes: Optional[str] = None


class StudentOut(BaseModel):
    id: UUID
    name: str
    grade: Optional[str] = None
    notes: Optional[str] = None
    org_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ── Material ──
class MaterialCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    chapter: Optional[str] = None
    notes: Optional[str] = None


class MaterialUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    chapter: Optional[str] = None
    notes: Optional[str] = None


class MaterialOut(BaseModel):
    id: UUID
    subject: str
    title: str
    chapter: Optional[str] = None
    notes: Optional[str] = None
    org_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ── Session ──
class SessionCreate(BaseModel):
    student_id: UUID
    teacher_id: UUID
    subject: str = Field(..., min_length=1)
    start_at: datetime
    end_at: datetime
    status: SessionStatus = SessionStatus.scheduled
    material_id: Optional[UUID] = None
    substitute_teacher_id: Optional[UUID] = None
    notes: Optional[str] = None


class SessionUpdate(BaseModel):
    student_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    subject: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[SessionStatus] = None
    material_id: Optional[UUID] = None
    substitute_teacher_id: Optional[UUID] = None
    notes: Optional[str] = None


class HandoverOut(BaseModel):
    id: UUID
    session_id: UUID
    covered_range: Optional[str] = None
    comprehension: Optional[int] = None
    homework: Optional[str] = None
    next_plan: Optional[str] = None
    stumbling_points: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id: UUID
    student_id: UUID
    teacher_id: UUID
    substitute_teacher_id: Optional[UUID] = None
    subject: str
    start_at: datetime
    end_at: datetime
    status: SessionStatus
    material_id: Optional[UUID] = None
    notes: Optional[str] = None
    org_id: UUID
    created_at: datetime
    # Nested
    student_name: Optional[str] = None
    teacher_name: Optional[str] = None
    substitute_teacher_name: Optional[str] = None
    material_title: Optional[str] = None
    handover: Optional[HandoverOut] = None

    class Config:
        from_attributes = True


# ── Handover ──
class HandoverCreate(BaseModel):
    covered_range: Optional[str] = None
    comprehension: Optional[int] = Field(None, ge=1, le=5)
    homework: Optional[str] = None
    next_plan: Optional[str] = None
    stumbling_points: Optional[str] = None
    notes: Optional[str] = None


class HandoverUpdate(HandoverCreate):
    pass


# ── Progress ──
class ProgressCreate(BaseModel):
    student_id: UUID
    material_id: UUID
    status: ProgressStatus = ProgressStatus.not_started
    last_session_id: Optional[UUID] = None
    notes: Optional[str] = None


class ProgressUpdate(BaseModel):
    status: Optional[ProgressStatus] = None
    last_session_id: Optional[UUID] = None
    notes: Optional[str] = None


class ProgressOut(BaseModel):
    id: UUID
    student_id: UUID
    material_id: UUID
    status: ProgressStatus
    last_session_id: Optional[UUID] = None
    notes: Optional[str] = None
    updated_at: datetime
    material_title: Optional[str] = None
    material_subject: Optional[str] = None

    class Config:
        from_attributes = True


# ── Teacher (for listings) ──
class TeacherOut(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    notes: Optional[str] = None

    class Config:
        from_attributes = True
