"""
Repository layer for database CRUD operations on predictions.
"""

from typing import List, Optional, Tuple, Dict, Any
import json
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import PredictionRecord


def create_prediction(
    db: Session,
    subject: str,
    prediction_mode: str,
    input_features: Dict[str, Any],
    predicted_grade: float,
    performance_category: str,
    model_version: str,
) -> PredictionRecord:
    """Store a new prediction in SQLite database."""
    record = PredictionRecord(
        subject=subject,
        prediction_mode=prediction_mode,
        input_features=json.dumps(input_features),
        predicted_grade=predicted_grade,
        performance_category=performance_category,
        model_version=model_version,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_prediction_by_id(db: Session, prediction_id: str) -> Optional[PredictionRecord]:
    """Retrieve a single prediction by its primary key ID."""
    return db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()


def list_predictions(
    db: Session, page: int = 1, page_size: int = 10
) -> Tuple[List[PredictionRecord], int]:
    """
    Retrieve paginated predictions ordered by creation timestamp descending.
    Returns (records, total_count).
    """
    total = db.query(PredictionRecord).count()
    offset = max(0, (page - 1) * page_size)
    records = (
        db.query(PredictionRecord)
        .order_by(desc(PredictionRecord.created_at))
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return records, total


def delete_prediction(db: Session, prediction_id: str) -> bool:
    """Delete a prediction by ID. Returns True if deleted, False if not found."""
    record = get_prediction_by_id(db, prediction_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
