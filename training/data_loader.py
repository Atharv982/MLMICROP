"""
Data loader and inspection pipeline for the UCI Student Performance dataset.
"""

from pathlib import Path
import hashlib
from typing import Dict, Any, Tuple, List, Optional
import pandas as pd
import numpy as np

# Feature definitions according to UCI Student Performance dataset
CATEGORICAL_FEATURES: List[str] = [
    "school",
    "sex",
    "address",
    "famsize",
    "Pstatus",
    "Mjob",
    "Fjob",
    "reason",
    "guardian",
    "schoolsup",
    "famsup",
    "paid",
    "activities",
    "nursery",
    "higher",
    "internet",
    "romantic",
    "subject",
]

NUMERIC_FEATURES_BASE: List[str] = [
    "age",
    "Medu",
    "Fedu",
    "traveltime",
    "studytime",
    "failures",
    "famrel",
    "freetime",
    "goout",
    "Dalc",
    "Walc",
    "health",
    "absences",
]

NUMERIC_FEATURES_MIDYEAR: List[str] = NUMERIC_FEATURES_BASE + ["G1", "G2"]

ALL_EXPECTED_RAW_COLUMNS: List[str] = [
    "school", "sex", "age", "address", "famsize", "Pstatus", "Medu", "Fedu",
    "Mjob", "Fjob", "reason", "guardian", "traveltime", "studytime", "failures",
    "schoolsup", "famsup", "paid", "activities", "nursery", "higher", "internet",
    "romantic", "famrel", "freetime", "goout", "Dalc", "Walc", "health", "absences",
    "G1", "G2", "G3"
]

FEATURE_VALUE_DOMAINS: Dict[str, List[Any]] = {
    "school": ["GP", "MS"],
    "sex": ["F", "M"],
    "address": ["U", "R"],
    "famsize": ["LE3", "GT3"],
    "Pstatus": ["T", "A"],
    "Mjob": ["teacher", "health", "services", "at_home", "other"],
    "Fjob": ["teacher", "health", "services", "at_home", "other"],
    "reason": ["home", "reputation", "course", "other"],
    "guardian": ["mother", "father", "other"],
    "schoolsup": ["yes", "no"],
    "famsup": ["yes", "no"],
    "paid": ["yes", "no"],
    "activities": ["yes", "no"],
    "nursery": ["yes", "no"],
    "higher": ["yes", "no"],
    "internet": ["yes", "no"],
    "romantic": ["yes", "no"],
    "subject": ["math", "portuguese"],
    "age": list(range(15, 23)),
    "Medu": [0, 1, 2, 3, 4],
    "Fedu": [0, 1, 2, 3, 4],
    "traveltime": [1, 2, 3, 4],
    "studytime": [1, 2, 3, 4],
    "failures": [0, 1, 2, 3, 4],
    "famrel": [1, 2, 3, 4, 5],
    "freetime": [1, 2, 3, 4, 5],
    "goout": [1, 2, 3, 4, 5],
    "Dalc": [1, 2, 3, 4, 5],
    "Walc": [1, 2, 3, 4, 5],
    "health": [1, 2, 3, 4, 5],
}


def compute_file_sha256(filepath: Path) -> str:
    """Compute SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def load_raw_datasets(data_dir: Optional[Path] = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load raw student-mat.csv and student-por.csv datasets.
    Raises FileNotFoundError if files are missing.
    """
    if data_dir is None:
        data_dir = Path(__file__).resolve().parent.parent / "data" / "raw"

    mat_path = data_dir / "student-mat.csv"
    por_path = data_dir / "student-por.csv"

    if not mat_path.exists():
        raise FileNotFoundError(
            f"Missing required dataset file: {mat_path}. "
            "Please download from https://archive.ics.uci.edu/dataset/320/student+performance "
            "and place student-mat.csv in backend/data/raw/."
        )

    if not por_path.exists():
        raise FileNotFoundError(
            f"Missing required dataset file: {por_path}. "
            "Please download from https://archive.ics.uci.edu/dataset/320/student+performance "
            "and place student-por.csv in backend/data/raw/."
        )

    df_mat = pd.read_csv(mat_path, sep=";")
    df_por = pd.read_csv(por_path, sep=";")

    # Validate required columns
    for col in ALL_EXPECTED_RAW_COLUMNS:
        if col not in df_mat.columns:
            raise ValueError(f"student-mat.csv is missing expected column: {col}")
        if col not in df_por.columns:
            raise ValueError(f"student-por.csv is missing expected column: {col}")

    return df_mat, df_por


def get_combined_dataset(data_dir: Optional[Path] = None) -> pd.DataFrame:
    """
    Load Mathematics and Portuguese datasets, inject the 'subject' column,
    and concatenate into a unified DataFrame.
    """
    df_mat, df_por = load_raw_datasets(data_dir)
    df_mat = df_mat.copy()
    df_por = df_por.copy()

    df_mat["subject"] = "math"
    df_por["subject"] = "portuguese"

    combined_df = pd.concat([df_mat, df_por], ignore_index=True)
    return combined_df


def inspect_dataset(data_dir: Optional[Path] = None) -> Dict[str, Any]:
    """
    Perform deep statistical and structural inspection of the datasets.
    Returns comprehensive metadata and statistics dictionary.
    """
    if data_dir is None:
        data_dir = Path(__file__).resolve().parent.parent / "data" / "raw"

    mat_path = data_dir / "student-mat.csv"
    por_path = data_dir / "student-por.csv"

    mat_hash = compute_file_sha256(mat_path) if mat_path.exists() else None
    por_hash = compute_file_sha256(por_path) if por_path.exists() else None

    df_mat, df_por = load_raw_datasets(data_dir)
    combined = get_combined_dataset(data_dir)

    def summarize_grades(df: pd.DataFrame) -> Dict[str, Any]:
        return {
            "mean": float(df["G3"].mean()),
            "std": float(df["G3"].std()),
            "median": float(df["G3"].median()),
            "min": int(df["G3"].min()),
            "max": int(df["G3"].max()),
            "q25": float(df["G3"].quantile(0.25)),
            "q75": float(df["G3"].quantile(0.75)),
            "pass_count": int((df["G3"] >= 10).sum()),
            "fail_count": int((df["G3"] < 10).sum()),
            "pass_rate": float((df["G3"] >= 10).mean()),
        }

    # Categorical distributions
    cat_summary = {}
    for col in CATEGORICAL_FEATURES:
        cat_summary[col] = combined[col].value_counts().to_dict()

    # Numeric descriptive stats
    num_summary = {}
    for col in NUMERIC_FEATURES_MIDYEAR + ["G3"]:
        s = combined[col].describe()
        num_summary[col] = {
            "mean": round(float(s["mean"]), 2),
            "std": round(float(s["std"]), 2),
            "min": float(s["min"]),
            "25%": float(s["25%"]),
            "50%": float(s["50%"]),
            "75%": float(s["75%"]),
            "max": float(s["max"]),
        }

    # Grade distribution counts (0-20)
    grade_hist_combined = combined["G3"].value_counts().sort_index().to_dict()
    grade_hist_mat = df_mat["G3"].value_counts().sort_index().to_dict()
    grade_hist_por = df_por["G3"].value_counts().sort_index().to_dict()

    # Study time vs G3 average
    study_vs_grade = combined.groupby("studytime")["G3"].agg(["mean", "count"]).reset_index()
    study_grade_map = [
        {
            "studytime": int(row["studytime"]),
            "avg_grade": round(float(row["mean"]), 2),
            "count": int(row["count"]),
        }
        for _, row in study_vs_grade.iterrows()
    ]

    # Absences vs G3 average (binned)
    combined["absence_bin"] = pd.cut(
        combined["absences"],
        bins=[-1, 2, 5, 10, 20, 100],
        labels=["0-2", "3-5", "6-10", "11-20", "21+"],
    )
    absence_vs_grade = combined.groupby("absence_bin", observed=True)["G3"].agg(["mean", "count"]).reset_index()
    absence_grade_map = [
        {
            "bin": str(row["absence_bin"]),
            "avg_grade": round(float(row["mean"]), 2),
            "count": int(row["count"]),
        }
        for _, row in absence_vs_grade.iterrows()
    ]

    report = {
        "status": "success",
        "dataset_name": "UCI Student Performance",
        "source_url": "https://archive.ics.uci.edu/dataset/320/student+performance",
        "citation": "Cortez, P., & Silva, A. (2008). Using Data Mining to Predict Secondary School Student Performance.",
        "files": {
            "student_mat": {
                "rows": int(len(df_mat)),
                "columns": int(df_mat.shape[1]),
                "sha256": mat_hash,
                "grade_summary": summarize_grades(df_mat),
            },
            "student_por": {
                "rows": int(len(df_por)),
                "columns": int(df_por.shape[1]),
                "sha256": por_hash,
                "grade_summary": summarize_grades(df_por),
            },
        },
        "combined": {
            "total_rows": int(len(combined)),
            "total_columns": int(combined.shape[1]),
            "missing_values_total": int(combined.isnull().sum().sum()),
            "duplicate_rows": int(combined.duplicated().sum()),
            "grade_summary": summarize_grades(combined),
            "pass_fail_balance": {
                "pass_ge_10": int((combined["G3"] >= 10).sum()),
                "fail_lt_10": int((combined["G3"] < 10).sum()),
                "pass_rate_pct": round(float((combined["G3"] >= 10).mean() * 100), 2),
            },
        },
        "categorical_features": cat_summary,
        "numeric_features": num_summary,
        "grade_distributions": {
            "combined": {str(k): int(v) for k, v in grade_hist_combined.items()},
            "math": {str(k): int(v) for k, v in grade_hist_mat.items()},
            "portuguese": {str(k): int(v) for k, v in grade_hist_por.items()},
        },
        "relationships": {
            "studytime_vs_grade": study_grade_map,
            "absences_vs_grade": absence_grade_map,
        },
    }

    return report
