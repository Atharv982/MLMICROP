"""
Analytics service for real dataset statistics, grade distributions, and feature correlations.
"""

from pathlib import Path
import json
from typing import Dict, Any, Optional
from app.config import settings
from training.data_loader import inspect_dataset


class AnalyticsService:
    """Service providing dataset analytics, grade histograms, and relationship metrics."""
    def __init__(self):
        self._cached_inspection: Optional[Dict[str, Any]] = None

    def get_inspection_data(self) -> Dict[str, Any]:
        if self._cached_inspection:
            return self._cached_inspection

        report_file = settings.REPORTS_DIR / "dataset_inspection.json"
        if report_file.exists():
            try:
                with open(report_file, "r", encoding="utf-8") as f:
                    self._cached_inspection = json.load(f)
                    return self._cached_inspection
            except Exception:
                pass

        # Fallback to computing live
        self._cached_inspection = inspect_dataset()
        return self._cached_inspection

    def get_summary(self) -> Dict[str, Any]:
        data = self.get_inspection_data()
        return {
            "dataset_name": data.get("dataset_name", "UCI Student Performance"),
            "source_url": data.get("source_url"),
            "citation": data.get("citation"),
            "files": data.get("files", {}),
            "combined": data.get("combined", {}),
            "categorical_features_count": len(data.get("categorical_features", {})),
            "numeric_features_count": len(data.get("numeric_features", {})),
        }

    def get_grade_distributions(self) -> Dict[str, Any]:
        data = self.get_inspection_data()
        dists = data.get("grade_distributions", {})
        combined_stats = data.get("combined", {}).get("grade_summary", {})
        math_stats = data.get("files", {}).get("student_mat", {}).get("grade_summary", {})
        por_stats = data.get("files", {}).get("student_por", {}).get("grade_summary", {})

        # Format into chart-friendly list
        chart_series = []
        for grade in range(0, 21):
            s_grade = str(grade)
            chart_series.append(
                {
                    "grade": grade,
                    "combined": dists.get("combined", {}).get(s_grade, 0),
                    "math": dists.get("math", {}).get(s_grade, 0),
                    "portuguese": dists.get("portuguese", {}).get(s_grade, 0),
                }
            )

        return {
            "series": chart_series,
            "summaries": {
                "combined": combined_stats,
                "math": math_stats,
                "portuguese": por_stats,
            },
            "scale": "0 - 20 (Portuguese Secondary Education Grading System)",
        }

    def get_feature_statistics(self) -> Dict[str, Any]:
        data = self.get_inspection_data()
        return {
            "numeric_features": data.get("numeric_features", {}),
            "categorical_features": data.get("categorical_features", {}),
        }

    def get_relationships(self) -> Dict[str, Any]:
        data = self.get_inspection_data()
        rels = data.get("relationships", {})

        # Load correlation matrix from metadata if available
        meta_file = settings.MODELS_DIR / "metadata.json"
        corr_data = {}
        if meta_file.exists():
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    corr_data = meta.get("correlations", {})
            except Exception:
                pass

        return {
            "studytime_vs_grade": rels.get("studytime_vs_grade", []),
            "absences_vs_grade": rels.get("absences_vs_grade", []),
            "correlations": corr_data,
            "caveat": (
                "Correlation does not imply causation. Observable relationships between habits, demographics, "
                "and grades reflect aggregated cohort associations rather than deterministic causal mechanisms."
            ),
        }


analytics_service = AnalyticsService()
