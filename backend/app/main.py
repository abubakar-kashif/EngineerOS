from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine
from app.db.seed import seed_database
from app.db.database import SessionLocal

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

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs"
    }
