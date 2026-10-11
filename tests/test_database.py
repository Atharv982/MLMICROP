"""
Tests for SQLite persistence, pagination, single retrieval, and deletion.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, PredictionRecord

client = TestClient(app)

SAMPLE_FEATURES = {
    "school": "GP",
    "sex": "M",
    "age": 17,
    "address": "U",
    "famsize": "LE3",
    "Pstatus": "T",
    "Medu": 3,
    "Fedu": 2,
    "Mjob": "other",
    "Fjob": "other",
    "reason": "home",
    "guardian": "father",
    "traveltime": 1,
    "studytime": 2,
    "failures": 0,
    "schoolsup": "no",
    "famsup": "no",
    "paid": "no",
    "activities": "no",
    "nursery": "yes",
    "higher": "yes",
    "internet": "yes",
    "romantic": "no",
    "famrel": 4,
    "freetime": 4,
    "goout": 3,
    "Dalc": 1,
    "Walc": 2,
    "health": 4,
    "absences": 6,
}


def test_prediction_crud_and_pagination():
    # 1. Post a prediction
    post_resp = client.post(
        "/api/v1/predict",
        json={
            "subject": "math",
            "prediction_mode": "early",
            "features": SAMPLE_FEATURES,
        },
    )
    assert post_resp.status_code == 200
    created = post_resp.json()
    pred_id = created["id"]
    assert pred_id is not None

    # 2. Get single prediction by ID
    get_resp = client.get(f"/api/v1/predictions/{pred_id}")
    assert get_resp.status_code == 200
    single = get_resp.json()
    assert single["id"] == pred_id
    assert single["subject"] == "math"
    assert single["prediction_mode"] == "early"

    # 3. Retrieve paginated list
    list_resp = client.get("/api/v1/predictions?page=1&page_size=10")
    assert list_resp.status_code == 200
    paginated = list_resp.json()
    assert paginated["total"] >= 1
    assert any(item["id"] == pred_id for item in paginated["items"])

    # 4. Delete prediction by ID
    del_resp = client.delete(f"/api/v1/predictions/{pred_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "success"

    # 5. Verify deletion
    verify_resp = client.get(f"/api/v1/predictions/{pred_id}")
    assert verify_resp.status_code == 404
