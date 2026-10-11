"""
Evaluation metrics, scoring functions, and performance category mapping.
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
)


def map_grade_to_category(grade: float) -> str:
    """
    Map final grade (0-20) to standard academic performance categories.
    """
    g = float(grade)
    if g >= 16.0:
        return "Excellent"
    elif g >= 14.0:
        return "Good"
    elif g >= 12.0:
        return "Satisfactory"
    elif g >= 10.0:
        return "Sufficient"
    else:
        return "Failing / At Risk"


def compute_regression_metrics(
    y_true: np.ndarray, y_pred: np.ndarray, clip_range: bool = True
) -> Dict[str, Any]:
    """
    Compute MAE, RMSE, R2, and residual statistics for regression models.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    if clip_range:
        y_pred = np.clip(y_pred, 0.0, 20.0)

    mae = float(mean_absolute_error(y_true, y_pred))
    # root_mean_squared_error supported in modern sklearn
    try:
        from sklearn.metrics import root_mean_squared_error
        rmse = float(root_mean_squared_error(y_true, y_pred))
    except ImportError:
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))

    r2 = float(r2_score(y_true, y_pred))
    residuals = y_true - y_pred

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "residual_mean": round(float(np.mean(residuals)), 4),
        "residual_std": round(float(np.std(residuals)), 4),
        "actual_vs_pred_sample": [
            {
                "actual": round(float(yt), 1),
                "predicted": round(float(yp), 1),
                "residual": round(float(res), 2),
            }
            for yt, yp, res in zip(y_true[:50], y_pred[:50], residuals[:50])
        ],
    }


def compute_classification_metrics(
    y_true: np.ndarray, y_pred: np.ndarray
) -> Dict[str, Any]:
    """
    Compute binary classification metrics for pass/fail prediction.
    """
    y_true = np.asarray(y_true, dtype=int)
    y_pred = np.asarray(y_pred, dtype=int)

    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "accuracy": round(acc, 4),
        "balanced_accuracy": round(bal_acc, 4),
        "macro_f1": round(macro_f1, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "confusion_matrix": {
            "matrix": cm,
            "labels": ["Fail (<10)", "Pass (>=10)"],
            "true_negatives": int(cm[0][0]) if len(cm) > 0 and len(cm[0]) > 0 else 0,
            "false_positives": int(cm[0][1]) if len(cm) > 0 and len(cm[0]) > 1 else 0,
            "false_negatives": int(cm[1][0]) if len(cm) > 1 and len(cm[1]) > 0 else 0,
            "true_positives": int(cm[1][1]) if len(cm) > 1 and len(cm[1]) > 1 else 0,
        },
    }
