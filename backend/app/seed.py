"""
シードデータ投入スクリプト
Usage: cd backend && python -m app.seed
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import engine, async_session
from app.database import Base
from app.models.models import (
    Organization, User, Student, Material, Session, Handover, Progress,
    UserRole, SessionStatus, ProgressStatus,
)
from app.auth import hash_password

# Fixed UUIDs for reproducible seed
ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")
TEACHER_ID = uuid.UUID("00000000-0000-0000-0000-000000000020")
STUDENT1_ID = uuid.UUID("00000000-0000-0000-0000-000000000030")
STUDENT2_ID = uuid.UUID("00000000-0000-0000-0000-000000000031")
MAT1_ID = uuid.UUID("00000000-0000-0000-0000-000000000040")
MAT2_ID = uuid.UUID("00000000-0000-0000-0000-000000000041")
MAT3_ID = uuid.UUID("00000000-0000-0000-0000-000000000042")
SESSION1_ID = uuid.UUID("00000000-0000-0000-0000-000000000050")
SESSION2_ID = uuid.UUID("00000000-0000-0000-0000-000000000051")
SESSION3_ID = uuid.UUID("00000000-0000-0000-0000-000000000052")
HANDOVER1_ID = uuid.UUID("00000000-0000-0000-0000-000000000060")


async def seed():
    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(text("SELECT count(*) FROM organizations"))
        count = result.scalar()
        if count and count > 0:
            print("⚠️  データは既に存在します。シードをスキップします。")
            return

        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Organization
        org = Organization(id=ORG_ID, name="サンプル学習塾")
        db.add(org)

        # Users
        admin = User(
            id=ADMIN_ID,
            org_id=ORG_ID,
            email="admin@example.com",
            password_hash=hash_password("admin123"),
            name="管理者 太郎",
            role=UserRole.admin,
        )
        teacher = User(
            id=TEACHER_ID,
            org_id=ORG_ID,
            email="teacher@example.com",
            password_hash=hash_password("teacher123"),
            name="山田 花子",
            role=UserRole.teacher,
            notes="数学・英語担当",
        )
        db.add_all([admin, teacher])

        # Students
        student1 = Student(
            id=STUDENT1_ID, org_id=ORG_ID, name="佐藤 一郎", grade="中学3年", notes="受験生。志望校：県立A高校"
        )
        student2 = Student(
            id=STUDENT2_ID, org_id=ORG_ID, name="鈴木 二美", grade="高校1年", notes="英語が苦手"
        )
        db.add_all([student1, student2])

        # Materials
        mat1 = Material(
            id=MAT1_ID, org_id=ORG_ID, subject="数学", title="新中学問題集 数学3年",
            chapter="第5章 二次方程式", notes="標準レベル"
        )
        mat2 = Material(
            id=MAT2_ID, org_id=ORG_ID, subject="英語", title="NEW HORIZON 3",
            chapter="Unit 6", notes="教科書準拠"
        )
        mat3 = Material(
            id=MAT3_ID, org_id=ORG_ID, subject="英語", title="英文法基礎ドリル",
            chapter="関係代名詞", notes="高校範囲先取り"
        )
        db.add_all([mat1, mat2, mat3])

        # Sessions (yesterday, today, tomorrow)
        session1 = Session(
            id=SESSION1_ID, org_id=ORG_ID,
            student_id=STUDENT1_ID, teacher_id=TEACHER_ID,
            subject="数学",
            start_at=today - timedelta(days=1, hours=-16),
            end_at=today - timedelta(days=1, hours=-17, minutes=-30),
            status=SessionStatus.completed,
            material_id=MAT1_ID,
            notes="前回の続き",
        )
        session2 = Session(
            id=SESSION2_ID, org_id=ORG_ID,
            student_id=STUDENT1_ID, teacher_id=TEACHER_ID,
            subject="数学",
            start_at=today + timedelta(hours=16),
            end_at=today + timedelta(hours=17, minutes=30),
            status=SessionStatus.scheduled,
            material_id=MAT1_ID,
        )
        session3 = Session(
            id=SESSION3_ID, org_id=ORG_ID,
            student_id=STUDENT2_ID, teacher_id=TEACHER_ID,
            subject="英語",
            start_at=today + timedelta(days=1, hours=14),
            end_at=today + timedelta(days=1, hours=15, minutes=30),
            status=SessionStatus.scheduled,
            material_id=MAT3_ID,
        )
        db.add_all([session1, session2, session3])

        # Handover for session 1
        handover = Handover(
            id=HANDOVER1_ID,
            session_id=SESSION1_ID,
            covered_range="p.82〜p.85 例題1〜3",
            comprehension=3,
            homework="p.86 練習問題 1〜5",
            next_plan="p.86 練習問題の答え合わせ → p.87 応用問題",
            stumbling_points="因数分解の公式の使い分けが曖昧。特に (a+b)(a-b) のパターンを間違える",
            notes="集中力は後半落ちぎみ。休憩を挟んだ方がよい",
        )
        db.add(handover)

        # Progress
        progress1 = Progress(
            student_id=STUDENT1_ID, material_id=MAT1_ID,
            status=ProgressStatus.in_progress, last_session_id=SESSION1_ID,
            notes="第5章の途中"
        )
        progress2 = Progress(
            student_id=STUDENT2_ID, material_id=MAT3_ID,
            status=ProgressStatus.not_started,
            notes="次回から開始予定"
        )
        db.add_all([progress1, progress2])

        await db.commit()
        print("✅ シードデータを投入しました")
        print("   Admin:   admin@example.com / admin123")
        print("   Teacher: teacher@example.com / teacher123")


if __name__ == "__main__":
    asyncio.run(seed())
