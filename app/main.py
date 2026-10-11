"""
Main FastAPI application entry point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import settings
from app.database import init_db
from app.schemas import HealthResponse
from app.api.routes import router as api_router
from app.services.predictor import model_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database
    init_db()

    # Attempt to load model artifacts
    try:
        model_manager.load_artifacts()
        print("GradePilot ML models successfully loaded into memory.")
    except Exception as e:
        print(f"Notice: Model artifacts not loaded on startup ({e}). Run training pipeline to generate.")

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Educational analytics application that estimates student academic performance using genuine ML models.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for seamless local dev between Next.js and FastAPI
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def root():
    """Redirect root path to interactive Swagger documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """Return API health status, loaded model status, and available modes."""
    is_loaded = model_manager.is_loaded
    meta = model_manager.metadata if is_loaded else {}
    version = meta.get("model_version", settings.VERSION) if meta else settings.VERSION
    dataset_records = meta.get("dataset_info", {}).get("total_combined_rows", 1044) if meta else 0

    return HealthResponse(
        status="healthy",
        model_status="loaded" if is_loaded else "unloaded",
        model_version=version,
        available_prediction_modes=["early", "mid_year"],
        dataset_records_trained=dataset_records,
    )


# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR, tags=["API V1"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
