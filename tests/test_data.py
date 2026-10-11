"""
Tests for dataset loading, schema verification, and target leakage prevention.
"""

import pytest
import pandas as pd
from training.data_loader import (
    load_raw_datasets,
    get_combined_dataset,
    inspect_dataset,
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES_BASE,
    NUMERIC_FEATURES_MIDYEAR,
    ALL_EXPECTED_RAW_COLUMNS,
)


def test_raw_datasets_exist_and_load():
    df_mat, df_por = load_raw_datasets()
    assert len(df_mat) == 395, f"Expected 395 math rows, got {len(df_mat)}"
    assert len(df_por) == 649, f"Expected 649 portuguese rows, got {len(df_por)}"
    for col in ALL_EXPECTED_RAW_COLUMNS:
        assert col in df_mat.columns
        assert col in df_por.columns


def test_combined_dataset_subject_column():
    combined = get_combined_dataset()
    assert len(combined) == 1044, f"Expected 1044 combined rows, got {len(combined)}"
    assert "subject" in combined.columns
    assert set(combined["subject"].unique()) == {"math", "portuguese"}
    assert (combined["subject"] == "math").sum() == 395
    assert (combined["subject"] == "portuguese").sum() == 649


def test_no_target_leakage_in_feature_definitions():
    # Early features must NOT contain G1, G2, or G3
    early_features = set(CATEGORICAL_FEATURES + NUMERIC_FEATURES_BASE)
    assert "G1" not in early_features, "Target leakage detected: G1 in early features"
    assert "G2" not in early_features, "Target leakage detected: G2 in early features"
    assert "G3" not in early_features, "Target leakage detected: G3 in early features"

    # Mid-year features must NOT contain G3
    midyear_features = set(CATEGORICAL_FEATURES + NUMERIC_FEATURES_MIDYEAR)
    assert "G3" not in midyear_features, "Target leakage detected: G3 in midyear features"
    assert "G1" in midyear_features
    assert "G2" in midyear_features


def test_dataset_inspection_metrics():
    report = inspect_dataset()
    assert report["status"] == "success"
    assert report["combined"]["total_rows"] == 1044
    assert report["combined"]["missing_values_total"] == 0
    assert "grade_distributions" in report
    assert "relationships" in report
