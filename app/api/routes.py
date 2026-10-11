"""
FastAPI Routes for GradePilot.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    PredictRequest,
    PredictResponse,
    PaginatedPredictions,
    PredictionHistoryItem,
    FeatureImportanceResponse,
    DeleteResponse,
)
from app.services.predictor import model_manager, ModelNotFoundError
from app.services.analytics import analytics_service
from app.repository import (
    create_prediction,
    get_prediction_by_id,
    list_predictions,
    delete_prediction,
)

router = APIRouter()


@router.get("/dataset/summary", summary="Retrieve dataset summary and inspection statistics")
def get_dataset_summary() -> Dict[str, Any]:
    """Returns row counts, file hashes, and descriptive statistics for UCI Student Performance."""
    try:
        return analytics_service.get_summary()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dataset summary: {str(e)}",
        )


@router.get("/model/metrics", summary="Retrieve saved evaluation metrics for all trained models")
def get_model_metrics() -> Dict[str, Any]:
    """Returns cross-validation and holdout test metrics for early, mid-year, and classification models."""
    try:
        meta = model_manager.get_metadata()
        return {
            "model_version": meta.get("model_version", "1.0.0"),
            "training_timestamp": meta.get("training_timestamp"),
            "dataset_info": meta.get("dataset_info", {}),
            "models": meta.get("models", {}),
            "performance_categories": meta.get("performance_categories", {}),
        }
    except ModelNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving model metrics: {str(e)}",
        )


@router.get("/model/feature-importance", summary="Retrieve actual feature importance rankings")
def get_feature_importance(
    mode: str = Query("early", pattern="^(early|mid_year)$", description="Prediction mode: early or mid_year")
) -> FeatureImportanceResponse:
    """Returns genuine permutation feature importance values computed on the held-out test partition."""
    try:
        meta = model_manager.get_metadata()
        model_info = meta.get("models", {}).get(mode, {})
        features = model_info.get("feature_importances", [])
        return FeatureImportanceResponse(
            mode=mode,
            model_name=model_info.get("selected_model", "Selected Model"),
            features=features,
            caveat=(
                "Feature importance reflects predictive utility in historical cohort data. "
                "It does not establish direct cause-and-effect relationships."
            ),
        )
    except ModelNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.post("/predict", response_model=PredictResponse, summary="Generate an ML grade prediction")
def predict_grade(
    payload: PredictRequest,
    db: Session = Depends(get_db),
) -> PredictResponse:
    """
    Predict student final grade (G3 on 0-20 scale) using genuine trained ML model.
    Persists prediction result to SQLite database.
    """
    try:
        features_dict = payload.features.model_dump()
        result = model_manager.predict(
            subject=payload.subject,
            mode=payload.prediction_mode,
            features=features_dict,
        )

        # Persist prediction in SQLite
        db_record = create_prediction(
            db=db,
            subject=payload.subject,
            prediction_mode=payload.prediction_mode,
            input_features=features_dict,
            predicted_grade=result["predicted_grade"],
            performance_category=result["performance_category"],
            model_version=result["model_version"],
        )

        return PredictResponse(
            id=db_record.id,
            created_at=db_record.created_at.isoformat(),
            subject=payload.subject,
            prediction_mode=payload.prediction_mode,
            predicted_grade=result["predicted_grade"],
            performance_category=result["performance_category"],
            model_version=result["model_version"],
            model_name=result["model_name"],
            held_out_metrics=result["held_out_metrics"],
            pass_probability=result.get("pass_probability"),
            pass_prediction=result.get("pass_prediction"),
            top_contributing_factors=result.get("top_contributing_factors", []),
        )
    except ModelNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@router.get("/predictions", response_model=PaginatedPredictions, summary="Retrieve paginated prediction history")
def get_predictions_history(
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
) -> PaginatedPredictions:
    """Retrieve actual predictions previously generated and persisted in the SQLite database."""
    records, total = list_predictions(db=db, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    items = [
        PredictionHistoryItem(
            id=r.id,
            created_at=r.created_at.isoformat(),
            subject=r.subject,
            prediction_mode=r.prediction_mode,
            predicted_grade=round(float(r.predicted_grade), 2),
            performance_category=r.performance_category,
            model_version=r.model_version,
            input_features=r.to_dict()["input_features"],
        )
        for r in records
    ]

    return PaginatedPredictions(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/predictions/{prediction_id}", response_model=PredictionHistoryItem, summary="Retrieve one saved prediction")
def get_single_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
) -> PredictionHistoryItem:
    """Get detailed information for a single saved prediction."""
    record = get_prediction_by_id(db=db, prediction_id=prediction_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with ID '{prediction_id}' was not found.",
        )

    return PredictionHistoryItem(
        id=record.id,
        created_at=record.created_at.isoformat(),
        subject=record.subject,
        prediction_mode=record.prediction_mode,
        predicted_grade=round(float(record.predicted_grade), 2),
        performance_category=record.performance_category,
        model_version=record.model_version,
        input_features=record.to_dict()["input_features"],
    )


@router.delete("/predictions/{prediction_id}", response_model=DeleteResponse, summary="Delete a saved prediction")
def delete_single_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
) -> DeleteResponse:
    """Delete a prediction record from SQLite database."""
    success = delete_prediction(db=db, prediction_id=prediction_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with ID '{prediction_id}' was not found.",
        )
    return DeleteResponse(
        status="success",
        deleted_id=prediction_id,
        message=f"Prediction '{prediction_id}' successfully removed from database.",
    )


@router.get("/analytics/grades", summary="Retrieve grade distribution histogram data")
def get_grade_analytics() -> Dict[str, Any]:
    """Retrieve grade distribution counts (0-20) across Math, Portuguese, and combined datasets."""
    try:
        return analytics_service.get_grade_distributions()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving grade distributions: {str(e)}",
        )


@router.get("/analytics/features", summary="Retrieve feature statistics")
def get_feature_analytics() -> Dict[str, Any]:
    """Retrieve descriptive statistics for numeric and categorical features."""
    try:
        return analytics_service.get_feature_statistics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving feature statistics: {str(e)}",
        )


@router.get("/analytics/relationships", summary="Retrieve feature correlation and relationship data")
def get_relationship_analytics() -> Dict[str, Any]:
    """Retrieve correlations with final grade and cohort relationship curves."""
    try:
        return analytics_service.get_relationships()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving relationships: {str(e)}",
        )
