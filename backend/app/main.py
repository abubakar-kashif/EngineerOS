import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.quiz import router as quiz_router
from app.api.routes.progress import router as progress_router
from app.db.seed import seed_quizzes


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_quizzes()
    yield


app = FastAPI(
    title="EngineerOS API",
    description="Backend API for the EngineerOS engineering learning platform.",
    version="0.1.0",
    lifespan=lifespan,
)


cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(quiz_router)
app.include_router(progress_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "EngineerOS API",
    }