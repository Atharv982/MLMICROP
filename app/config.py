"""
Application Configuration.
"""

from pathlib import Path
import os
from typing import List


class Settings:
    """Application settings loaded from environment or defaults."""
    PROJECT_NAME: str = "GradePilot"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data" / "raw"
    MODELS_DIR: Path = BASE_DIR / "models"
    REPORTS_DIR: Path = BASE_DIR / "reports"
    DATABASE_PATH: Path = BASE_DIR / "gradepilot.db"

    # SQLite connection string
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}"
    )

    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
        ).split(",")
    ]


settings = Settings()
