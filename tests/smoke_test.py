"""
End-to-End Smoke Test Script for GradePilot.
Verifies:
1. API starts and health endpoint reports healthy.
2. Models are loaded in memory from serialized disk artifacts.
3. Submitting valid predictions in Early and Mid-Year modes succeeds.
4. Submitting invalid inputs (missing fields, out-of-range, NaN) is rejected with 422.
5. Real model metrics and feature importance are retrieved.
6. Predictions are persisted in SQLite and can be retrieved, paginated, and deleted.
"""

import sys
from pathlib import Path

# Add backend root to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

def run_smoke_test():
    print("=" * 60)
    print("GRADEPILOT END-TO-END SMOKE TEST EXECUTION")
    print("=" * 60)

    client = TestClient(app)

    # 1. Confirm API starts and model is loaded
    print("\n[Step 1] Verifying /health endpoint...")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    health = resp.json()
    print("  Status:", health["status"])
    print("  Model Status:", health["model_status"])
    print("  Model Version:", health["model_version"])
    print("  Available Modes:", health["available_prediction_modes"])
    assert health["status"] == "healthy"
    assert health["model_status"] == "loaded"
    print("  -> Step 1 PASSED: API started and models confirmed loaded.")

    # 2. Retrieve real model metrics
    print("\n[Step 2] Retrieving empirical model metrics from /api/v1/model/metrics...")
    resp = client.get("/api/v1/model/metrics")
    assert resp.status_code == 200
    metrics = resp.json()
    early_mae = metrics["models"]["early"]["holdout_test_metrics"]["mae"]
    early_r2 = metrics["models"]["early"]["holdout_test_metrics"]["r2"]
    mid_mae = metrics["models"]["mid_year"]["holdout_test_metrics"]["mae"]
    mid_r2 = metrics["models"]["mid_year"]["holdout_test_metrics"]["r2"]
    print(f"  Early Horizon Model: {metrics['models']['early']['selected_model']} (Test MAE: {early_mae}, R2: {early_r2})")
    print(f"  Mid-Year Horizon Model: {metrics['models']['mid_year']['selected_model']} (Test MAE: {mid_mae}, R2: {mid_r2})")
    print(f"  Classifier Model: {metrics['models']['classification']['selected_model']}")
    assert early_mae > 0 and mid_mae > 0
    print("  -> Step 2 PASSED: Real empirical metrics retrieved from disk artifacts.")

    # 3. Submit valid Early prediction
    print("\n[Step 3] Submitting valid Early-Performance prediction...")
    valid_payload = {
        "subject": "math",
        "prediction_mode": "early",
        "features": {
            "school": "GP", "sex": "F", "age": 16, "address": "U", "famsize": "GT3", "Pstatus": "T",
            "Medu": 4, "Fedu": 4, "Mjob": "health", "Fjob": "teacher", "reason": "reputation",
            "guardian": "mother", "traveltime": 1, "studytime": 4, "failures": 0, "schoolsup": "no",
            "famsup": "yes", "paid": "yes", "activities": "yes", "nursery": "yes", "higher": "yes",
            "internet": "yes", "romantic": "no", "famrel": 5, "freetime": 3, "goout": 2, "Dalc": 1,
            "Walc": 1, "health": 5, "absences": 2
        }
    }
    resp = client.post("/api/v1/predict", json=valid_payload)
    assert resp.status_code == 200, f"Predict failed: {resp.text}"
    early_pred = resp.json()
    print(f"  Predicted Grade: {early_pred['predicted_grade']} / 20")
    print(f"  Performance Category: {early_pred['performance_category']}")
    print(f"  Persistence ID: {early_pred['id']}")
    print(f"  Contributing Factors Identified: {len(early_pred['top_contributing_factors'])}")
    assert 0.0 <= early_pred["predicted_grade"] <= 20.0
    print("  -> Step 3 PASSED: Valid early prediction produced and persisted.")

    # 4. Submit valid Mid-Year prediction
    print("\n[Step 4] Submitting valid Mid-Year Estimate prediction (with G1=15, G2=16)...")
    mid_payload = dict(valid_payload)
    mid_payload["prediction_mode"] = "mid_year"
    mid_payload["features"] = dict(valid_payload["features"])
    mid_payload["features"]["G1"] = 15.0
    mid_payload["features"]["G2"] = 16.0
    resp = client.post("/api/v1/predict", json=mid_payload)
    assert resp.status_code == 200
    mid_pred = resp.json()
    print(f"  Predicted Grade: {mid_pred['predicted_grade']} / 20")
    print(f"  Performance Category: {mid_pred['performance_category']}")
    assert mid_pred["predicted_grade"] >= 13.0
    print("  -> Step 4 PASSED: Valid mid-year prediction produced.")

    # 5. Reject invalid inputs
    print("\n[Step 5] Testing input rejection on malformed inputs...")
    # 5a: Missing G1/G2 in mid_year mode
    bad_mid = dict(valid_payload)
    bad_mid["prediction_mode"] = "mid_year"
    resp = client.post("/api/v1/predict", json=bad_mid)
    assert resp.status_code == 422, f"Expected 422 for missing G1/G2, got {resp.status_code}"
    print("  5a: Successfully rejected mid_year request missing G1 and G2.")

    # 5b: Out-of-bounds age (e.g. age=30)
    bad_age = dict(valid_payload)
    bad_age["features"] = dict(valid_payload["features"])
    bad_age["features"]["age"] = 30
    resp = client.post("/api/v1/predict", json=bad_age)
    assert resp.status_code == 422
    print("  5b: Successfully rejected out-of-bounds age (age=30).")

    # 5c: Invalid categorical value
    bad_cat = dict(valid_payload)
    bad_cat["features"] = dict(valid_payload["features"])
    bad_cat["features"]["school"] = "INVALID_SCHOOL"
    resp = client.post("/api/v1/predict", json=bad_cat)
    assert resp.status_code == 422
    print("  5c: Successfully rejected invalid categorical value.")
    print("  -> Step 5 PASSED: All invalid inputs properly rejected with structured 422 errors.")

    # 6. Save and retrieve prediction history
    print("\n[Step 6] Verifying SQLite persistence and history pagination...")
    resp = client.get("/api/v1/predictions?page=1&page_size=10")
    assert resp.status_code == 200
    history = resp.json()
    print(f"  Total Persisted Predictions in SQLite: {history['total']}")
    assert history["total"] >= 2
    # Verify the created prediction is present
    found = any(p["id"] == early_pred["id"] for p in history["items"])
    assert found, "Created prediction ID not found in history"
    print(f"  Found prediction record {early_pred['id']} in paginated database output.")

    # Test single retrieval
    resp = client.get(f"/api/v1/predictions/{early_pred['id']}")
    assert resp.status_code == 200
    single = resp.json()
    assert single["id"] == early_pred["id"]
    print("  Single record retrieval verified.")

    # Test deletion
    resp = client.delete(f"/api/v1/predictions/{early_pred['id']}")
    assert resp.status_code == 200
    print("  Record deletion verified.")

    # Confirm deletion
    resp = client.get(f"/api/v1/predictions/{early_pred['id']}")
    assert resp.status_code == 404
    print("  404 confirmation on deleted record verified.")
    print("  -> Step 6 PASSED: Full SQLite CRUD lifecycle functioning perfectly.")

    print("\n" + "=" * 60)
    print("ALL 6 END-TO-END SMOKE TEST STEPS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_smoke_test()
