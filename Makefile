.PHONY: dev dev-front dev-back db migrate seed setup

# ── DB ──
db:
	docker compose up -d

db-down:
	docker compose down

# ── Backend ──
dev-back:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python -m app.seed

# ── Frontend ──
dev-front:
	cd frontend && npm run dev

# ── Setup (初回) ──
setup: db
	@echo "⏳ Waiting for Postgres..."
	@sleep 3
	cd backend && pip install -r requirements.txt
	$(MAKE) migrate
	$(MAKE) seed
	cd frontend && npm install
	@echo "✅ Setup complete. Run 'make dev-back' and 'make dev-front' in separate terminals."

# ── All dev (要 2 terminal) ──
dev:
	@echo "Run in separate terminals:"
	@echo "  make dev-back"
	@echo "  make dev-front"
