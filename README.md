# 塾 引き継ぎ管理アプリ

個別指導の引き継ぎを紙から脱却する Web アプリケーション。  
授業枠ごとに教材進捗・引き継ぎノートを一元管理し、代講時にも迷わない情報伝達を実現します。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2.x (async) + Pydantic v2 |
| DB | PostgreSQL 16 |
| 認証 | JWT (Bearer Token) |
| デプロイ | Vercel (Frontend) + Koyeb (Backend) + Neon (DB) |

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

---

## ディレクトリ構成

```
Management_app/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example         # Backend 環境変数テンプレート
│   ├── Dockerfile           # Koyeb デプロイ用
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/             # マイグレーション
│   └── app/
│       ├── main.py          # FastAPI エントリポイント
│       ├── config.py        # 設定（環境変数読み込み）
│       ├── database.py      # DB 接続（Neon SSL 対応済み）
│       ├── auth.py          # JWT 認証
│       ├── models/          # SQLAlchemy モデル
│       ├── schemas/         # Pydantic スキーマ
│       ├── routers/         # API ルーター
│       └── seed.py          # シードデータ
└── frontend/
    ├── .env.example         # Frontend 環境変数テンプレート
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    └── src/
        ├── app/             # Next.js App Router ページ
        ├── components/      # UI コンポーネント
        └── lib/             # ユーティリティ（API・認証・utils）
```

---

## 環境変数一覧

### Backend（`backend/.env`）

| 変数名 | 説明 | ローカル例 | 本番（Koyeb）例 |
|--------|------|-----------|----------------|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql+asyncpg://juku:juku_pass@localhost:5432/juku_db` | `postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/dbname` |
| `DB_SSL` | SSL 接続を有効にするか | `false` | `true`（Neon は必須） |
| `SECRET_KEY` | JWT 署名用シークレットキー | `dev-secret-key-change-in-production` | ランダムな長い文字列に変更すること |
| `ALGORITHM` | JWT アルゴリズム | `HS256` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | トークン有効期限（分） | `480` | `480` |
| `CORS_ORIGINS` | 許可するフロントエンド URL（カンマ区切り） | `http://localhost:3000` | `https://your-app.vercel.app` |

### Frontend（`frontend/.env.local`）

| 変数名 | 説明 | ローカル例 | 本番（Vercel）例 |
|--------|------|-----------|-----------------|
| `NEXT_PUBLIC_API_URL` | Backend API の URL | `http://localhost:8000` | `https://your-backend.koyeb.app` |

---

## ローカル開発セットアップ

### 前提条件

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 16**（Homebrew: `brew install postgresql@16` or Docker）

### 1. リポジトリクローン

```bash
git clone https://github.com/morisanyutakun-png/Management_app.git
cd Management_app
```

### 2. 環境変数を設定

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

必要に応じて `backend/.env` の `DATABASE_URL` を自分の PostgreSQL に合わせて編集。

### 3. PostgreSQL を起動

**Homebrew の場合：**
```bash
brew services start postgresql@16
createuser -s juku 2>/dev/null
psql -U juku -c "ALTER USER juku PASSWORD 'juku_pass';" 2>/dev/null
createdb -U juku juku_db 2>/dev/null
```

**Docker の場合：**
```bash
docker run -d --name juku-db \
  -e POSTGRES_USER=juku \
  -e POSTGRES_PASSWORD=juku_pass \
  -e POSTGRES_DB=juku_db \
  -p 5432:5432 \
  postgres:16
```

### 4. Backend セットアップ

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# マイグレーション & シードデータ
alembic upgrade head
PYTHONPATH=. python -m app.seed

# 起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Frontend セットアップ（別ターミナル）

```bash
cd frontend
npm install
npm run dev
```

### 6. アクセス

| URL | 用途 |
|-----|------|
| http://localhost:3000 | フロントエンド |
| http://localhost:8000/docs | API ドキュメント（Swagger UI） |
| http://localhost:8000/health | ヘルスチェック |

### テストアカウント

| ロール | メール | パスワード |
|-------|--------|-----------|
| 管理者 | admin@example.com | admin123 |
| 講師 | teacher@example.com | teacher123 |

---

## 本番デプロイ手順

本アプリは **Neon（DB）→ Koyeb（Backend）→ Vercel（Frontend）** の順でデプロイします。

### Step 1: Neon（PostgreSQL データベース）

1. [Neon](https://neon.tech) にアカウント登録・ログイン
2. **New Project** を作成（リージョンは `Asia Pacific (Singapore)` 推奨）
3. 作成後に表示される **Connection string** をコピー
   - 形式例: `postgresql://user:pass@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb`
4. この接続文字列を `asyncpg` 用に変換（`postgresql://` → `postgresql+asyncpg://`）：
   ```
   postgresql+asyncpg://user:pass@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb
   ```
5. **ローカルからマイグレーション & シードを実行：**
   ```bash
   cd backend
   source venv/bin/activate

   # .env を本番 DB に一時的に書き換える
   export DATABASE_URL="postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb"
   export DB_SSL=true

   alembic upgrade head
   PYTHONPATH=. python -m app.seed
   ```

### Step 2: Koyeb（Backend）

1. [Koyeb](https://www.koyeb.com) にアカウント登録・ログイン
2. **Create App** → **GitHub** を選択
3. リポジトリ `Management_app` を選択
4. 以下を設定：

| 設定項目 | 値 |
|---------|---|
| **Builder** | Dockerfile |
| **Dockerfile location** | `backend/Dockerfile` |
| **Work directory** | `backend` |
| **Port** | `8000` |
| **Instance type** | Free (Nano) |
| **Region** | Washington, D.C. (US) または Singapore |

5. **Environment variables** を設定（重要）：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb`（Step 1 の接続文字列） |
| `DB_SSL` | `true` |
| `SECRET_KEY` | ランダムな文字列（例: `openssl rand -hex 32` で生成） |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` |
| `CORS_ORIGINS` | `https://your-app.vercel.app`（Step 3 で取得する Vercel URL） |

6. **Deploy** をクリック
7. デプロイ完了後、Koyeb が発行する URL（例: `https://your-backend-xxx.koyeb.app`）をメモ
8. ヘルスチェック確認：`https://your-backend-xxx.koyeb.app/health` にアクセスし `{"status":"ok"}` が返れば成功

> **注意**: `CORS_ORIGINS` は Vercel の URL が確定してから更新してください。最初は `*` でもOK。

### Step 3: Vercel（Frontend）

1. [Vercel](https://vercel.com) にアカウント登録・ログイン（GitHub 連携推奨）
2. **Add New Project** → GitHub リポジトリ `Management_app` をインポート
3. 以下を設定：

| 設定項目 | 値 |
|---------|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build`（デフォルト） |
| **Output Directory** | `.next`（デフォルト） |

4. **Environment Variables** を設定：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-xxx.koyeb.app`（Step 2 の Koyeb URL） |

5. **Deploy** をクリック
6. デプロイ完了後、Vercel の URL（例: `https://your-app.vercel.app`）が発行される

### Step 4: CORS を更新（最後に忘れずに！）

Vercel の URL が確定したら、**Koyeb の環境変数**を更新：

```
CORS_ORIGINS=https://your-app.vercel.app
```

複数の URL を許可する場合はカンマ区切り：
```
CORS_ORIGINS=https://your-app.vercel.app,https://custom-domain.com
```

Koyeb で環境変数を変更すると自動的に再デプロイされます。

---

## デプロイ後の確認チェックリスト

- [ ] `https://your-backend.koyeb.app/health` → `{"status":"ok"}`
- [ ] `https://your-app.vercel.app` → ログイン画面が表示される
- [ ] テストアカウントでログインできる
- [ ] ダッシュボードにデータが表示される
- [ ] 授業の引き継ぎノートを作成・保存できる

---

## トラブルシューティング

### Backend が起動しない（Koyeb）
- **Dockerfile path** と **Work directory** が正しいか確認
- Koyeb のログ（Logs タブ）でエラーを確認
- `DATABASE_URL` のフォーマットが `postgresql+asyncpg://...` か確認（`postgresql://` では動かない）

### DB に接続できない
- `DB_SSL=true` が設定されているか確認（Neon は SSL 必須）
- Neon のダッシュボードで接続文字列を再確認

### CORS エラーが出る
- Koyeb の `CORS_ORIGINS` に Vercel の URL が正確に設定されているか確認
- `https://` を含めること。末尾の `/` は不要

### ログインできない
- シードデータが投入されているか確認（`python -m app.seed`）
- `SECRET_KEY` がローカルと本番で異なる場合、ローカルで発行したトークンは本番では無効（正常動作）

### Vercel でビルドエラー
- **Root Directory** が `frontend` に設定されているか確認
- `NEXT_PUBLIC_API_URL` が設定されているか確認
