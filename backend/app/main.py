from fastapi import FastAPI

from app.api.routes.quiz import router as quiz_router


app = FastAPI(
    title="EngineerOS API",
    description="Backend API for the EngineerOS engineering learning platform.",
    version="0.1.0",
)

app.include_router(quiz_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "EngineerOS API",
    }