from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
from app.db.seed import seed_database

from app.api.routes.quiz import router as quiz_router
from app.api.routes.progress import router as progress_router
from app.api.routes.experiments import router as experiment_router


# Create database tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created!")


# Seed the database
print("Seeding database...")
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(quiz_router)
app.include_router(progress_router)
app.include_router(experiment_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME
    }


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs"
    }