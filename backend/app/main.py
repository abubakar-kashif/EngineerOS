import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api.routes.quiz import router as quiz_router
from app.api.routes.progress import router as progress_router
from app.api.routes.experiments import router as experiment_router
from app.api.routes.reports import router as reports_router
from app.api.routes.resources import router as resources_router
from app.api.routes.simulations import router as simulation_router

from app.db.database import Base, engine, SessionLocal
from app.db.seed import seed_database
from app.db.seed_resources import seed_resources


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    seed_resources()

    yield


app = FastAPI(
    title="EngineerOS API",
    description="Backend API for the EngineerOS engineering learning platform.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
app.include_router(experiment_router)
app.include_router(reports_router)
app.include_router(resources_router)
app.include_router(simulation_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "EngineerOS API",
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to EngineerOS",
        "docs": "/docs",
    }