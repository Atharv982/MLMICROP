"""
Inference engine and model loading service.
"""

from pathlib import Path
import json
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import numpy as np

from app.config import settings
from training.evaluate import map_grade_to_category
from training.data_loader import (
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES_BASE,
    NUMERIC_FEATURES_MIDYEAR,
)


class ModelNotFoundError(Exception):
    """Raised when required model artifacts cannot be found on disk."""
    pass


class ModelManager:
    """Singleton service to load models and serve predictions."""
    def __init__(self):
        self.early_model = None
        self.mid_year_model = None
        self.classifier = None
        self.metadata = None
        self._loaded = False

    def load_artifacts(self, force_reload: bool = False):
        if self._loaded and not force_reload:
            return

        models_dir = settings.MODELS_DIR
        early_path = models_dir / "early_regressor.joblib"
        mid_year_path = models_dir / "mid_year_regressor.joblib"
        clf_path = models_dir / "classifier.joblib"
        meta_path = models_dir / "metadata.json"

        missing = []
        for p in [early_path, mid_year_path, clf_path, meta_path]:
            if not p.exists():
                missing.append(p.name)

        if missing:
            raise ModelNotFoundError(
                f"Missing saved model artifacts: {', '.join(missing)} in {models_dir}. "
                "Please run `python -m training.train` inside the backend directory to train and serialize models."
            )

        self.early_model = joblib.load(early_path)
        self.mid_year_model = joblib.load(mid_year_path)
        self.classifier = joblib.load(clf_path)

        with open(meta_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        self._loaded = True

    @property
    def is_loaded(self) -> bool:
        if not self._loaded:
            try:
                self.load_artifacts()
            except Exception:
                pass
        return self._loaded

    def get_metadata(self) -> Dict[str, Any]:
        self.load_artifacts()
        return self.metadata

    def predict(
        self,
        subject: str,
        mode: str,
        features: Dict[str, Any],
    ) -> Dict[str, Any]:
        self.load_artifacts()

        row = dict(features)
        row["subject"] = subject

        if mode == "early":
            model = self.early_model
            model_info = self.metadata["models"]["early"]
            feature_cols = NUMERIC_FEATURES_BASE + CATEGORICAL_FEATURES
        elif mode == "mid_year":
            model = self.mid_year_model
            model_info = self.metadata["models"]["mid_year"]
            feature_cols = NUMERIC_FEATURES_MIDYEAR + CATEGORICAL_FEATURES
        else:
            raise ValueError(f"Unsupported prediction mode: '{mode}'. Must be 'early' or 'mid_year'.")

        # Build single-row DataFrame
        df_input = pd.DataFrame([row])

        # Ensure all columns exist
        for col in feature_cols:
            if col not in df_input.columns:
                raise ValueError(f"Missing required input column: {col}")

        df_input = df_input[feature_cols]

        raw_pred = float(model.predict(df_input)[0])
        predicted_grade = round(float(np.clip(raw_pred, 0.0, 20.0)), 1)
        performance_category = map_grade_to_category(predicted_grade)

        # Classification pass/fail estimate
        pass_prob = None
        pass_pred = None
        if self.classifier is not None:
            try:
                clf_cols = NUMERIC_FEATURES_BASE + CATEGORICAL_FEATURES
                clf_df = pd.DataFrame([row])[clf_cols]
                prob = self.classifier.predict_proba(clf_df)[0]
                # Index 1 is Pass (>=10)
                pass_prob = round(float(prob[1]), 3)
                pass_pred = "Pass" if pass_prob >= 0.5 else "Fail / At Risk"
            except Exception:
                pass_prob = 1.0 if predicted_grade >= 10.0 else 0.0
                pass_pred = "Pass" if predicted_grade >= 10.0 else "Fail / At Risk"

        # Explanation / Top Contributing factors
        top_importances = model_info.get("feature_importances", [])
        contributing_factors = []
        for imp in top_importances[:5]:
            feat_name = imp["feature"]
            val = row.get(feat_name, "N/A")
            desc = self._describe_factor_influence(feat_name, val, mode)
            contributing_factors.append(
                {
                    "feature": feat_name,
                    "importance": imp["importance"],
                    "student_value": val,
                    "interpretation": desc,
                }
            )

        return {
            "predicted_grade": predicted_grade,
            "performance_category": performance_category,
            "model_version": self.metadata.get("model_version", "1.0.0"),
            "model_name": model_info.get("selected_model", "Selected Regressor"),
            "held_out_metrics": model_info.get("holdout_test_metrics", {}),
            "pass_probability": pass_prob,
            "pass_prediction": pass_pred,
            "top_contributing_factors": contributing_factors,
        }

    def _describe_factor_influence(self, feature: str, value: Any, mode: str) -> str:
        """Contextual explanation of a feature value."""
        if feature == "failures":
            return f"Past class failures: {value}. Historical data shows a negative correlation with final marks."
        elif feature == "studytime":
            return f"Weekly study time level: {value} (1: <2h, 4: >10h). Higher study dedication positively associates with scores."
        elif feature == "absences":
            return f"School absences: {value}. Irregular attendance correlates with learning gaps."
        elif feature == "G2":
            return f"Second-period grade: {value}/20. Mid-year exams are the strongest predictor of final exam performance."
        elif feature == "G1":
            return f"First-period grade: {value}/20. Early baseline proficiency strongly anchors cumulative mastery."
        elif feature == "higher":
            return f"Aspirations for higher education: {value}. Educational drive is positively aligned with academic engagement."
        elif feature == "schoolsup":
            return f"Extra school support: {value}. Often received by students navigating prior curriculum difficulties."
        elif feature == "Medu":
            return f"Mother's education level: {value}/4. Parental academic attainment provides positive home learning environment."
        elif feature == "Fedu":
            return f"Father's education level: {value}/4. Family educational capital supports student academic persistence."
        elif feature == "goout":
            return f"Going out with friends level: {value}/5. Balanced leisure supports well-being; excessive leisure may reduce study hours."
        elif feature == "health":
            return f"Self-reported health: {value}/5. Physical vitality contributes to daily focus and endurance."
        else:
            return f"Feature value: {value}. Factor contributing to cohort statistical estimation."


model_manager = ModelManager()
