from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, students, materials, sessions, handovers, progress

settings = get_settings()

app = FastAPI(
    title="塾引き継ぎ管理 API",
    description="個別指導の引き継ぎを管理するAPI",
    version="1.0.0",
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
allow_all = "*" in origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=not allow_all,  # credentials と wildcard は併用不可
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(materials.router)
app.include_router(sessions.router)
app.include_router(handovers.router)
app.include_router(progress.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
