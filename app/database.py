"""
Database setup and SQLAlchemy ORM models.
"""

from datetime import datetime, timezone
import json
import uuid
from typing import Generator

from sqlalchemy import create_engine, Column, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# Engine configuration for SQLite
connect_args = {"check_same_thread": False} if settings.SQLALCHEMY_DATABASE_URI.startswith("sqlite") else {}
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PredictionRecord(Base):
    """Database table for storing student grade predictions."""
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    subject = Column(String(20), nullable=False)
    prediction_mode = Column(String(20), nullable=False)
    input_features = Column(Text, nullable=False)  # JSON-encoded input features
    predicted_grade = Column(Float, nullable=False)
    performance_category = Column(String(50), nullable=False)
    model_version = Column(String(20), nullable=False)

    def to_dict(self):
        try:
            inputs = json.loads(self.input_features)
        except Exception:
            inputs = {}

        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "subject": self.subject,
            "prediction_mode": self.prediction_mode,
            "input_features": inputs,
            "predicted_grade": round(float(self.predicted_grade), 2),
            "performance_category": self.performance_category,
            "model_version": self.model_version,
        }


def init_db():
    """Create database tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


# Auto-initialize database tables
init_db()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
