"""
Tests for FastAPI HTTP endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SAMPLE_VALID_STUDENT = {
    "school": "GP",
    "sex": "F",
    "age": 16,
    "address": "U",
    "famsize": "GT3",
    "Pstatus": "T",
    "Medu": 4,
    "Fedu": 3,
    "Mjob": "services",
    "Fjob": "other",
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
    "absences": 4,
}


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["model_status"] == "loaded"
    assert "early" in data["available_prediction_modes"]
    assert "mid_year" in data["available_prediction_modes"]


def test_dataset_summary_endpoint():
    resp = client.get("/api/v1/dataset/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["combined"]["total_rows"] == 1044
    assert data["files"]["student_mat"]["rows"] == 395
    assert data["files"]["student_por"]["rows"] == 649


def test_model_metrics_endpoint():
    resp = client.get("/api/v1/model/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "early" in data["models"]
    assert "mid_year" in data["models"]
    assert "classification" in data["models"]
    assert "holdout_test_metrics" in data["models"]["early"]


def test_feature_importance_endpoint():
    resp = client.get("/api/v1/model/feature-importance?mode=early")
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "early"
    assert len(data["features"]) > 0


def test_predict_endpoint_valid_early():
    payload = {
        "subject": "math",
        "prediction_mode": "early",
        "features": SAMPLE_VALID_STUDENT,
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert 0.0 <= data["predicted_grade"] <= 20.0
    assert data["performance_category"] in [
        "Excellent", "Good", "Satisfactory", "Sufficient", "Failing / At Risk"
    ]
    assert data["subject"] == "math"
    assert data["prediction_mode"] == "early"


def test_predict_endpoint_valid_midyear():
    features_mid = dict(SAMPLE_VALID_STUDENT)
    features_mid["G1"] = 14.0
    features_mid["G2"] = 15.0
    payload = {
        "subject": "portuguese",
        "prediction_mode": "mid_year",
        "features": features_mid,
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["predicted_grade"] >= 10.0


def test_predict_endpoint_rejects_missing_g1_in_midyear():
    payload = {
        "subject": "math",
        "prediction_mode": "mid_year",
        "features": SAMPLE_VALID_STUDENT,  # Missing G1 and G2
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 422  # Validation error


def test_predict_endpoint_rejects_invalid_values():
    bad_features = dict(SAMPLE_VALID_STUDENT)
    bad_features["age"] = 35  # Outside 15-22
    payload = {
        "subject": "math",
        "prediction_mode": "early",
        "features": bad_features,
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 422


def test_analytics_endpoints():
    r1 = client.get("/api/v1/analytics/grades")
    assert r1.status_code == 200
    assert "series" in r1.json()

    r2 = client.get("/api/v1/analytics/features")
    assert r2.status_code == 200
    assert "numeric_features" in r2.json()

    r3 = client.get("/api/v1/analytics/relationships")
    assert r3.status_code == 200
    assert "studytime_vs_grade" in r3.json()
