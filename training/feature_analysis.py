"""
Feature importance, correlation analysis, and model interpretation.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from sklearn.pipeline import Pipeline


def get_feature_names_from_preprocessor(preprocessor) -> List[str]:
    """
    Extract readable feature names after ColumnTransformer one-hot encoding.
    """
    try:
        return list(preprocessor.get_feature_names_out())
    except Exception:
        # Fallback if get_feature_names_out fails
        return [f"feature_{i}" for i in range(100)]


def calculate_permutation_importance(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: np.ndarray,
    n_repeats: int = 5,
    random_state: int = 42,
    top_k: int = 15,
) -> List[Dict[str, Any]]:
    """
    Calculate permutation feature importance on the held-out test set using original columns.
    """
    result = permutation_importance(
        pipeline,
        X_test,
        y_test,
        n_repeats=n_repeats,
        random_state=random_state,
        scoring="neg_mean_absolute_error",
    )

    importances = []
    for col_idx, col_name in enumerate(X_test.columns):
        mean_imp = float(result.importances_mean[col_idx])
        std_imp = float(result.importances_std[col_idx])
        importances.append(
            {
                "feature": col_name,
                "importance": round(max(0.0, mean_imp), 4),
                "std": round(std_imp, 4),
            }
        )

    # Sort descending
    importances.sort(key=lambda x: x["importance"], reverse=True)
    return importances[:top_k]


def compute_dataset_correlations(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute pairwise Pearson correlations for numeric features with G3.
    """
    numeric_cols = [
        col for col in [
            "age", "Medu", "Fedu", "traveltime", "studytime", "failures",
            "famrel", "freetime", "goout", "Dalc", "Walc", "health",
            "absences", "G1", "G2", "G3"
        ] if col in df.columns
    ]

    corr_matrix = df[numeric_cols].corr()
    g3_corr = corr_matrix["G3"].drop("G3", errors="ignore").sort_values(ascending=False)

    corr_list = [
        {
            "feature": col,
            "correlation": round(float(val), 3),
            "direction": "positive" if val > 0 else "negative",
            "magnitude": round(abs(float(val)), 3),
        }
        for col, val in g3_corr.items()
    ]

    # Full heatmap matrix for frontend visualization
    matrix_data = []
    for row_col in numeric_cols:
        row_dict = {"feature": row_col}
        for col_col in numeric_cols:
            row_dict[col_col] = round(float(corr_matrix.loc[row_col, col_col]), 2)
        matrix_data.append(row_dict)

    return {
        "correlations_with_g3": corr_list,
        "features": numeric_cols,
        "matrix": matrix_data,
        "caveat": (
            "Correlation indicates statistical association, not causation. "
            "Underlying socioeconomic, school environment, or personal factors "
            "often confound observed relationships."
        ),
    }
