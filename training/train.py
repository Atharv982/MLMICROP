"""
End-to-End Training Pipeline for GradePilot.
Trains Early-Performance Regressor, Mid-Year Regressor, and Pass/Fail Classifier.
Evaluates candidate models via 5-fold CV, selects best models, tests on holdout split,
and saves model artifacts + evaluation reports.
"""

from pathlib import Path
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, KFold, cross_validate
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Candidate Regressors
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import (
    RandomForestRegressor,
    ExtraTreesRegressor,
    HistGradientBoostingRegressor,
)
try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

# Candidate Classifiers
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    HistGradientBoostingClassifier,
)

from training.data_loader import (
    get_combined_dataset,
    inspect_dataset,
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES_BASE,
    NUMERIC_FEATURES_MIDYEAR,
    FEATURE_VALUE_DOMAINS,
)
from training.evaluate import (
    compute_regression_metrics,
    compute_classification_metrics,
    map_grade_to_category,
)
from training.feature_analysis import (
    calculate_permutation_importance,
    compute_dataset_correlations,
)


def build_preprocessor(numeric_features: List[str], categorical_features: List[str]) -> ColumnTransformer:
    """
    Construct a scikit-learn ColumnTransformer for numeric and categorical pipelines.
    Guarantees no target leakage and consistent encoding.
    """
    num_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    cat_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, numeric_features),
            ("cat", cat_pipeline, categorical_features),
        ],
        remainder="drop",
    )
    return preprocessor


def get_candidate_regressors() -> Dict[str, Any]:
    """Define candidate regression models to evaluate."""
    candidates = {
        "Dummy (Mean)": DummyRegressor(strategy="mean"),
        "Ridge": Ridge(alpha=1.0, random_state=42),
        "RandomForest": RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42),
        "ExtraTrees": ExtraTreesRegressor(n_estimators=100, max_depth=8, random_state=42),
        "HistGradientBoosting": HistGradientBoostingRegressor(max_iter=100, random_state=42),
    }
    if HAS_XGBOOST:
        candidates["XGBoost"] = XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            random_state=42,
            verbosity=0,
        )
    return candidates


def get_candidate_classifiers() -> Dict[str, Any]:
    """Define candidate classification models for binary pass/fail."""
    return {
        "Dummy (Most Frequent)": DummyClassifier(strategy="most_frequent"),
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
        "ExtraTrees": ExtraTreesClassifier(n_estimators=100, max_depth=8, random_state=42),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=100, random_state=42),
    }


def train_and_select_regressor(
    X_train: pd.DataFrame,
    y_train: np.ndarray,
    X_test: pd.DataFrame,
    y_test: np.ndarray,
    numeric_features: List[str],
    mode_name: str,
) -> Tuple[Pipeline, str, Dict[str, Any]]:
    """
    Evaluates candidate regressors using 5-fold CV on X_train.
    Selects best model by lowest CV MAE.
    Fits selected model on full X_train and evaluates on holdout X_test.
    """
    candidates = get_candidate_regressors()
    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    candidate_results = {}
    best_name = None
    best_cv_mae = float("inf")

    for name, model in candidates.items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", build_preprocessor(numeric_features, CATEGORICAL_FEATURES)),
                ("regressor", model),
            ]
        )

        cv_scores = cross_validate(
            pipeline,
            X_train,
            y_train,
            cv=cv,
            scoring={
                "mae": "neg_mean_absolute_error",
                "rmse": "neg_root_mean_squared_error",
                "r2": "r2",
            },
            n_jobs=-1,
        )

        mean_mae = float(-cv_scores["test_mae"].mean())
        std_mae = float(cv_scores["test_mae"].std())
        mean_rmse = float(-cv_scores["test_rmse"].mean())
        std_rmse = float(cv_scores["test_rmse"].std())
        mean_r2 = float(cv_scores["test_r2"].mean())
        std_r2 = float(cv_scores["test_r2"].std())

        candidate_results[name] = {
            "cv_mae_mean": round(mean_mae, 4),
            "cv_mae_std": round(std_mae, 4),
            "cv_rmse_mean": round(mean_rmse, 4),
            "cv_rmse_std": round(std_rmse, 4),
            "cv_r2_mean": round(mean_r2, 4),
            "cv_r2_std": round(std_r2, 4),
        }

        if mean_mae < best_cv_mae:
            best_cv_mae = mean_mae
            best_name = name

    print(f"[{mode_name}] Selected best model: {best_name} (CV MAE: {best_cv_mae:.4f})")

    # Fit selected candidate on full training set
    selected_model = candidates[best_name]
    best_pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor(numeric_features, CATEGORICAL_FEATURES)),
            ("regressor", selected_model),
        ]
    )
    best_pipeline.fit(X_train, y_train)

    # Evaluate on untouched holdout test partition
    y_test_pred = np.clip(best_pipeline.predict(X_test), 0.0, 20.0)
    test_metrics = compute_regression_metrics(y_test, y_test_pred)

    # Also compute baseline metrics on test partition
    baseline_pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor(numeric_features, CATEGORICAL_FEATURES)),
            ("regressor", DummyRegressor(strategy="mean")),
        ]
    )
    baseline_pipeline.fit(X_train, y_train)
    baseline_pred = baseline_pipeline.predict(X_test)
    baseline_test_metrics = compute_regression_metrics(y_test, baseline_pred)

    # Feature importances
    feature_importances = calculate_permutation_importance(
        best_pipeline, X_test, y_test, n_repeats=5, random_state=42
    )

    result_summary = {
        "mode": mode_name,
        "selected_model": best_name,
        "candidate_comparison": candidate_results,
        "cross_validation": candidate_results[best_name],
        "holdout_test_metrics": test_metrics,
        "baseline_comparison": {
            "baseline_model": "DummyRegressor (Mean)",
            "baseline_test_mae": baseline_test_metrics["mae"],
            "baseline_test_rmse": baseline_test_metrics["rmse"],
            "baseline_test_r2": baseline_test_metrics["r2"],
            "mae_improvement": round(baseline_test_metrics["mae"] - test_metrics["mae"], 4),
            "rmse_improvement": round(baseline_test_metrics["rmse"] - test_metrics["rmse"], 4),
            "r2_improvement": round(test_metrics["r2"] - baseline_test_metrics["r2"], 4),
        },
        "feature_importances": feature_importances,
    }

    return best_pipeline, best_name, result_summary


def train_and_select_classifier(
    X_train: pd.DataFrame,
    y_train_binary: np.ndarray,
    X_test: pd.DataFrame,
    y_test_binary: np.ndarray,
    numeric_features: List[str],
) -> Tuple[Pipeline, str, Dict[str, Any]]:
    """
    Evaluates candidate classifiers for binary pass/fail (G3 >= 10).
    """
    candidates = get_candidate_classifiers()
    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    candidate_results = {}
    best_name = None
    best_cv_f1 = -1.0

    for name, model in candidates.items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", build_preprocessor(numeric_features, CATEGORICAL_FEATURES)),
                ("classifier", model),
            ]
        )

        cv_scores = cross_validate(
            pipeline,
            X_train,
            y_train_binary,
            cv=cv,
            scoring={
                "accuracy": "accuracy",
                "balanced_accuracy": "balanced_accuracy",
                "macro_f1": "f1_macro",
            },
            n_jobs=-1,
        )

        mean_acc = float(cv_scores["test_accuracy"].mean())
        mean_bal_acc = float(cv_scores["test_balanced_accuracy"].mean())
        mean_f1 = float(cv_scores["test_macro_f1"].mean())

        candidate_results[name] = {
            "cv_accuracy_mean": round(mean_acc, 4),
            "cv_balanced_accuracy_mean": round(mean_bal_acc, 4),
            "cv_macro_f1_mean": round(mean_f1, 4),
        }

        if mean_f1 > best_cv_f1:
            best_cv_f1 = mean_f1
            best_name = name

    print(f"[Classification] Selected best model: {best_name} (CV Macro F1: {best_cv_f1:.4f})")

    selected_model = candidates[best_name]
    best_pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor(numeric_features, CATEGORICAL_FEATURES)),
            ("classifier", selected_model),
        ]
    )
    best_pipeline.fit(X_train, y_train_binary)

    y_test_pred = best_pipeline.predict(X_test)
    test_metrics = compute_classification_metrics(y_test_binary, y_test_pred)

    result_summary = {
        "selected_model": best_name,
        "threshold": "G3 >= 10 is Pass, < 10 is Fail",
        "candidate_comparison": candidate_results,
        "holdout_test_metrics": test_metrics,
    }

    return best_pipeline, best_name, result_summary


def run_full_training_pipeline() -> Dict[str, Any]:
    """
    Executes complete training and evaluation pipeline, writes artifacts to backend/models/
    and backend/reports/.
    """
    base_dir = Path(__file__).resolve().parent.parent
    models_dir = base_dir / "models"
    reports_dir = base_dir / "reports"
    models_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    print("Step 1: Inspecting and loading dataset...")
    inspection_data = inspect_dataset()
    reports_dir.joinpath("dataset_inspection.json").write_text(
        json.dumps(inspection_data, indent=2), encoding="utf-8"
    )

    df_combined = get_combined_dataset()
    print(f"Dataset loaded: {len(df_combined)} total rows across math and portuguese.")

    # Prepare features and target
    y = df_combined["G3"].values
    y_binary = (y >= 10).astype(int)

    # 80/20 train/test split with fixed random seed
    train_idx, test_idx = train_test_split(
        np.arange(len(df_combined)),
        test_size=0.20,
        random_state=42,
        stratify=y_binary,
    )

    train_df = df_combined.iloc[train_idx].copy()
    test_df = df_combined.iloc[test_idx].copy()

    y_train = y[train_idx]
    y_test = y[test_idx]
    y_train_binary = y_binary[train_idx]
    y_test_binary = y_binary[test_idx]

    print(f"Train set: {len(train_df)} samples, Test set: {len(test_df)} samples.")

    # 1. Early-Performance Regression (Excludes G1, G2, G3)
    print("\nStep 2: Training Early-Performance Regressor (without G1, G2)...")
    early_features = NUMERIC_FEATURES_BASE + CATEGORICAL_FEATURES
    X_train_early = train_df[early_features]
    X_test_early = test_df[early_features]

    early_pipeline, early_name, early_metrics = train_and_select_regressor(
        X_train_early, y_train, X_test_early, y_test, NUMERIC_FEATURES_BASE, "early"
    )
    joblib.dump(early_pipeline, models_dir / "early_regressor.joblib")

    # 2. Mid-Year Regression (Includes G1, G2)
    print("\nStep 3: Training Mid-Year Regressor (with G1, G2)...")
    midyear_features = NUMERIC_FEATURES_MIDYEAR + CATEGORICAL_FEATURES
    X_train_midyear = train_df[midyear_features]
    X_test_midyear = test_df[midyear_features]

    midyear_pipeline, midyear_name, midyear_metrics = train_and_select_regressor(
        X_train_midyear, y_train, X_test_midyear, y_test, NUMERIC_FEATURES_MIDYEAR, "mid_year"
    )
    joblib.dump(midyear_pipeline, models_dir / "mid_year_regressor.joblib")

    # 3. Pass/Fail Classification
    print("\nStep 4: Training Pass/Fail Classifier...")
    classifier_pipeline, clf_name, clf_metrics = train_and_select_classifier(
        X_train_early, y_train_binary, X_test_early, y_test_binary, NUMERIC_FEATURES_BASE
    )
    joblib.dump(classifier_pipeline, models_dir / "classifier.joblib")

    # 4. Correlation Analysis
    correlations = compute_dataset_correlations(df_combined)

    # 5. Metadata compilation
    timestamp = datetime.now(timezone.utc).isoformat()
    metadata = {
        "model_version": "1.0.0",
        "training_timestamp": timestamp,
        "dataset_info": {
            "name": "UCI Student Performance",
            "math_rows": inspection_data["files"]["student_mat"]["rows"],
            "portuguese_rows": inspection_data["files"]["student_por"]["rows"],
            "total_combined_rows": len(df_combined),
            "train_samples": len(train_df),
            "test_samples": len(test_df),
            "math_sha256": inspection_data["files"]["student_mat"]["sha256"],
            "portuguese_sha256": inspection_data["files"]["student_por"]["sha256"],
        },
        "feature_schema": {
            "categorical_features": CATEGORICAL_FEATURES,
            "numeric_features_early": NUMERIC_FEATURES_BASE,
            "numeric_features_midyear": NUMERIC_FEATURES_MIDYEAR,
            "domains": FEATURE_VALUE_DOMAINS,
        },
        "performance_categories": {
            "Excellent": {"range": "16 - 20", "description": "Outstanding academic mastery"},
            "Good": {"range": "14 - 15", "description": "High proficiency and strong outcomes"},
            "Satisfactory": {"range": "12 - 13", "description": "Solid understanding meeting benchmarks"},
            "Sufficient": {"range": "10 - 11", "description": "Passing grade meeting minimum standards"},
            "Failing / At Risk": {"range": "0 - 9", "description": "Needs proactive intervention and support"},
        },
        "models": {
            "early": early_metrics,
            "mid_year": midyear_metrics,
            "classification": clf_metrics,
        },
        "correlations": correlations,
    }

    # Save metadata and reports
    metadata_path = models_dir / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    report_path = reports_dir / "evaluation_summary.json"
    report_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("\nTraining completed successfully!")
    print(f"Artifacts saved in: {models_dir}")
    print(f"Early Model: {early_name} | Test MAE: {early_metrics['holdout_test_metrics']['mae']} | R2: {early_metrics['holdout_test_metrics']['r2']}")
    print(f"Mid-Year Model: {midyear_name} | Test MAE: {midyear_metrics['holdout_test_metrics']['mae']} | R2: {midyear_metrics['holdout_test_metrics']['r2']}")
    print(f"Classifier: {clf_name} | Test Acc: {clf_metrics['holdout_test_metrics']['accuracy']} | Macro F1: {clf_metrics['holdout_test_metrics']['macro_f1']}")

    return metadata


if __name__ == "__main__":
    run_full_training_pipeline()
