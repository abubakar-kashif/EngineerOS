from fastapi import FastAPI

app = FastAPI(
    title="EngineerOS API",
    description="Backend API for the EngineerOS engineering learning platform.",
    version="0.1.0",
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "EngineerOS API",
    }