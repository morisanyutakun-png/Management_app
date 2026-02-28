import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, DateTime, ForeignKey, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


# ── Enums ──
class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"


class SessionStatus(str, enum.Enum):
    scheduled = "scheduled"       # 予定
    completed = "completed"       # 実施
    absent_student = "absent_student"  # 生徒欠席
    absent_teacher = "absent_teacher"  # 講師欠席
    substitute = "substitute"     # 代講


class ProgressStatus(str, enum.Enum):
    not_started = "not_started"   # 未
    in_progress = "in_progress"   # 進行中
    completed = "completed"       # 完了


# ── Models ──
class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="organization")
    students: Mapped[list["Student"]] = relationship(back_populates="organization")
    materials: Mapped[list["Material"]] = relationship(back_populates="organization")
    sessions: Mapped[list["Session"]] = relationship(back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.teacher)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="users")
    sessions_as_teacher: Mapped[list["Session"]] = relationship(
        back_populates="teacher", foreign_keys="Session.teacher_id"
    )
    sessions_as_substitute: Mapped[list["Session"]] = relationship(
        back_populates="substitute_teacher", foreign_keys="Session.substitute_teacher_id"
    )


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="students")
    sessions: Mapped[list["Session"]] = relationship(back_populates="student")
    progress_records: Mapped[list["Progress"]] = relationship(back_populates="student")


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    chapter: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="materials")
    progress_records: Mapped[list["Progress"]] = relationship(back_populates="material")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    substitute_teacher_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus), nullable=False, default=SessionStatus.scheduled
    )
    material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("materials.id"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="sessions")
    student: Mapped["Student"] = relationship(back_populates="sessions")
    teacher: Mapped["User"] = relationship(
        back_populates="sessions_as_teacher", foreign_keys=[teacher_id]
    )
    substitute_teacher: Mapped["User | None"] = relationship(
        back_populates="sessions_as_substitute", foreign_keys=[substitute_teacher_id]
    )
    handover: Mapped["Handover | None"] = relationship(back_populates="session", uselist=False)
    material: Mapped["Material | None"] = relationship()


class Handover(Base):
    __tablename__ = "handovers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), unique=True, nullable=False
    )
    covered_range: Mapped[str | None] = mapped_column(Text, nullable=True)      # 前回やった範囲
    comprehension: Mapped[int | None] = mapped_column(Integer, nullable=True)    # 理解度 1-5
    homework: Mapped[str | None] = mapped_column(Text, nullable=True)            # 宿題
    next_plan: Mapped[str | None] = mapped_column(Text, nullable=True)           # 次回やること
    stumbling_points: Mapped[str | None] = mapped_column(Text, nullable=True)    # つまずきポイント
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)               # その他メモ
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="handover")


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint("student_id", "material_id", name="uq_student_material"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    material_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=False)
    status: Mapped[ProgressStatus] = mapped_column(
        SAEnum(ProgressStatus), nullable=False, default=ProgressStatus.not_started
    )
    last_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student: Mapped["Student"] = relationship(back_populates="progress_records")
    material: Mapped["Material"] = relationship(back_populates="progress_records")
    last_session: Mapped["Session | None"] = relationship()
