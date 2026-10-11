"""
Tests for trained models, serialization, and evaluation metrics computation.
"""

import pytest
import numpy as np
import pandas as pd
from app.services.predictor import model_manager
from training.evaluate import (
    compute_regression_metrics,
    compute_classification_metrics,
    map_grade_to_category,
)


def test_models_load_from_disk():
    model_manager.load_artifacts(force_reload=True)
    assert model_manager.is_loaded is True
    assert model_manager.early_model is not None
    assert model_manager.mid_year_model is not None
    assert model_manager.classifier is not None
    assert model_manager.metadata is not None


def test_evaluation_metric_calculators():
    y_true = np.array([10.0, 15.0, 8.0, 12.0, 18.0])
    y_pred = np.array([10.5, 14.2, 8.8, 12.0, 17.5])
    metrics = compute_regression_metrics(y_true, y_pred)

    assert "mae" in metrics
    assert "rmse" in metrics
    assert "r2" in metrics
    assert metrics["mae"] > 0
    assert metrics["rmse"] > 0
    assert metrics["r2"] > 0.8

    # Classification metrics
    y_true_clf = np.array([1, 1, 0, 1, 0])
    y_pred_clf = np.array([1, 1, 0, 0, 0])
    clf_metrics = compute_classification_metrics(y_true_clf, y_pred_clf)
    assert clf_metrics["accuracy"] == 0.8
    assert "confusion_matrix" in clf_metrics


def test_grade_category_mapping():
    assert map_grade_to_category(18.5) == "Excellent"
    assert map_grade_to_category(16.0) == "Excellent"
    assert map_grade_to_category(14.5) == "Good"
    assert map_grade_to_category(13.0) == "Satisfactory"
    assert map_grade_to_category(10.5) == "Sufficient"
    assert map_grade_to_category(8.0) == "Failing / At Risk"
    assert map_grade_to_category(0.0) == "Failing / At Risk"


def test_predictor_service_early_and_midyear():
    model_manager.load_artifacts()
    sample_features = {
        "school": "GP",
        "sex": "F",
        "age": 16,
        "address": "U",
        "famsize": "GT3",
        "Pstatus": "T",
        "Medu": 4,
        "Fedu": 3,
        "Mjob": "health",
        "Fjob": "services",
        "reason": "course",
        "guardian": "mother",
        "traveltime": 1,
        "studytime": 3,
        "failures": 0,
        "schoolsup": "no",
        "famsup": "yes",
        "paid": "no",
        "activities": "yes",
        "nursery": "yes",
        "higher": "yes",
        "internet": "yes",
        "romantic": "no",
        "famrel": 4,
        "freetime": 3,
        "goout": 2,
        "Dalc": 1,
        "Walc": 1,
        "health": 5,
        "absences": 2,
    }

    # Test early mode
    early_res = model_manager.predict("math", "early", sample_features)
    assert 0.0 <= early_res["predicted_grade"] <= 20.0
    assert early_res["performance_category"] in [
        "Excellent", "Good", "Satisfactory", "Sufficient", "Failing / At Risk"
    ]
    assert len(early_res["top_contributing_factors"]) > 0

    # Test mid_year mode
    sample_features_mid = dict(sample_features)
    sample_features_mid["G1"] = 15.0
    sample_features_mid["G2"] = 16.0
    mid_res = model_manager.predict("math", "mid_year", sample_features_mid)
    assert 0.0 <= mid_res["predicted_grade"] <= 20.0
    assert mid_res["predicted_grade"] >= 13.0  # high mid-year grades should yield strong prediction
