# 塾 引き継ぎ管理 MVP

個別指導の引き継ぎを紙から脱却する Web アプリケーション。  
授業枠ごとに教材進捗・引き継ぎノートを一元管理し、代講時にも迷わない情報伝達を実現します。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2.x (async) + Pydantic v2 |
| DB | PostgreSQL 16 (Docker / Neon) |
| 認証 | JWT (Bearer Token) |

---

## セットアップ手順

### 前提条件

- **Python 3.11+**
- **Node.js 18+**
- **Docker & Docker Compose**（ローカル DB 用）

### 1. リポジトリクローン & 環境変数

```bash
cd Management_app

# Backend 環境変数
cp backend/.env.example backend/.env

# Frontend 環境変数
cp frontend/.env.local.example frontend/.env.local
```

### 2. DB 起動（Docker）

```bash
docker compose up -d
```

PostgreSQL が `localhost:5432` で起動します。

### 3. Backend セットアップ

```bash
cd backend

# 仮想環境（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# マイグレーション
alembic upgrade head

# シードデータ投入
python -m app.seed

# 起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend セットアップ

別ターミナルで：

```bash
cd frontend

# 依存関係インストール
npm install

# 起動
npm run dev
```

### 5. アクセス

- **Frontend**: http://localhost:3000
- **Backend API docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

### テストアカウント

| ロール | メール | パスワード |
|-------|--------|-----------|
| 管理者 | admin@example.com | admin123 |
| 講師 | teacher@example.com | teacher123 |

---

## Makefile ショートカット

```bash
make db          # Docker Compose で DB 起動
make migrate     # Alembic マイグレーション実行
make seed        # シードデータ投入
make dev-back    # Backend 開発サーバー起動
make dev-front   # Frontend 開発サーバー起動
make setup       # 初回セットアップ（DB + migrate + seed + npm install）
```

---

## Neon（クラウド Postgres）に接続する場合

1. Neon でプロジェクト作成
2. `backend/.env` の `DATABASE_URL` を Neon の接続文字列に変更：
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. `backend/alembic.ini` の `sqlalchemy.url` も同様に変更
4. マイグレーション & シードを実行

---

## ディレクトリ構成

```
Management_app/
├── docker-compose.yml       # ローカル DB
├── .env.example             # 環境変数テンプレート
├── Makefile                 # 開発コマンド
├── README.md
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/             # マイグレーション
│   └── app/
│       ├── main.py          # FastAPI エントリポイント
│       ├── config.py        # 設定
│       ├── database.py      # DB 接続
│       ├── auth.py          # JWT 認証
│       ├── models/          # SQLAlchemy モデル
│       ├── schemas/         # Pydantic スキーマ
│       ├── routers/         # API ルーター
│       └── seed.py          # シードデータ
└── frontend/
    ├── package.json
    ├── tailwind.config.ts
    └── src/
        ├── app/             # Next.js App Router ページ
        ├── components/      # UI コンポーネント
        └── lib/             # ユーティリティ
```

---

## 主な機能

- **ログイン / ログアウト**（JWT 認証）
- **ダッシュボード**：今日の授業・要対応（欠席/代講）を一目で確認
- **授業枠管理**：CRUD + ステータス変更（予定/実施/生徒欠席/講師欠席/代講）
- **引き継ぎノート**：授業枠ごとに範囲・理解度・宿題・次回計画・つまずきポイントを記録
- **代講サマリー**：session 詳細に「一枚サマリー」カードで最重要情報を表示
- **生徒管理**：CRUD + 進度表 + 授業履歴
- **教材管理**：CRUD
- **進度表**：生徒×教材の進捗を「未着手/進行中/完了」で管理
