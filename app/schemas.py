"""
Pydantic Schemas for Request Validation and Typed Responses.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, field_validator, model_validator
import math


class StudentFeatures(BaseModel):
    """Features describing a student based on the UCI dataset."""
    school: Literal["GP", "MS"] = Field(..., description="Student school: GP (Gabriel Pereira) or MS (Mousinho da Silveira)")
    sex: Literal["F", "M"] = Field(..., description="Student sex: F (Female) or M (Male)")
    age: int = Field(..., ge=15, le=22, description="Student age between 15 and 22")
    address: Literal["U", "R"] = Field(..., description="Home address type: U (Urban) or R (Rural)")
    famsize: Literal["LE3", "GT3"] = Field(..., description="Family size: LE3 (<=3) or GT3 (>3)")
    Pstatus: Literal["T", "A"] = Field(..., description="Parent cohabitation status: T (Together) or A (Apart)")
    Medu: int = Field(..., ge=0, le=4, description="Mother's education (0: none to 4: higher education)")
    Fedu: int = Field(..., ge=0, le=4, description="Father's education (0: none to 4: higher education)")
    Mjob: Literal["teacher", "health", "services", "at_home", "other"] = Field(..., description="Mother's job")
    Fjob: Literal["teacher", "health", "services", "at_home", "other"] = Field(..., description="Father's job")
    reason: Literal["home", "reputation", "course", "other"] = Field(..., description="Reason for choosing school")
    guardian: Literal["mother", "father", "other"] = Field(..., description="Student guardian")
    traveltime: int = Field(..., ge=1, le=4, description="Home to school travel time (1: <15 min to 4: >1 hour)")
    studytime: int = Field(..., ge=1, le=4, description="Weekly study time (1: <2 hrs to 4: >10 hrs)")
    failures: int = Field(..., ge=0, le=4, description="Number of past class failures")
    schoolsup: Literal["yes", "no"] = Field(..., description="Extra educational school support")
    famsup: Literal["yes", "no"] = Field(..., description="Family educational support")
    paid: Literal["yes", "no"] = Field(..., description="Extra paid classes")
    activities: Literal["yes", "no"] = Field(..., description="Extra-curricular activities")
    nursery: Literal["yes", "no"] = Field(..., description="Attended nursery school")
    higher: Literal["yes", "no"] = Field(..., description="Wants to take higher education")
    internet: Literal["yes", "no"] = Field(..., description="Internet access at home")
    romantic: Literal["yes", "no"] = Field(..., description="In a romantic relationship")
    famrel: int = Field(..., ge=1, le=5, description="Quality of family relationships (1: very bad to 5: excellent)")
    freetime: int = Field(..., ge=1, le=5, description="Free time after school (1: very low to 5: very high)")
    goout: int = Field(..., ge=1, le=5, description="Going out with friends (1: very low to 5: very high)")
    Dalc: int = Field(..., ge=1, le=5, description="Workday alcohol consumption (1: very low to 5: very high)")
    Walc: int = Field(..., ge=1, le=5, description="Weekend alcohol consumption (1: very low to 5: very high)")
    health: int = Field(..., ge=1, le=5, description="Current health status (1: very bad to 5: very good)")
    absences: int = Field(..., ge=0, le=93, description="Number of school absences (0 to 93)")

    # Optional Mid-Year grades
    G1: Optional[float] = Field(None, ge=0.0, le=20.0, description="First-period grade (0-20 scale)")
    G2: Optional[float] = Field(None, ge=0.0, le=20.0, description="Second-period grade (0-20 scale)")


class PredictRequest(BaseModel):
    """Prediction request payload."""
    subject: Literal["math", "portuguese"] = Field(..., description="Academic subject: math or portuguese")
    prediction_mode: Literal["early", "mid_year"] = Field(
        ..., description="Prediction mode: early (lifestyle only) or mid_year (includes G1 and G2)"
    )
    features: StudentFeatures

    @model_validator(mode="after")
    def validate_midyear_grades(self):
        mode = self.prediction_mode
        f = self.features
        if mode == "mid_year":
            if f.G1 is None or f.G2 is None:
                raise ValueError(
                    "When using 'mid_year' prediction mode, both G1 (period 1) and G2 (period 2) grades must be provided."
                )
            if math.isnan(f.G1) or math.isinf(f.G1) or math.isnan(f.G2) or math.isinf(f.G2):
                raise ValueError("G1 and G2 grades must be valid finite numbers between 0 and 20.")
        return self


class FeatureImpact(BaseModel):
    feature: str
    importance: float
    student_value: Any
    interpretation: str


class PredictResponse(BaseModel):
    """Prediction response containing predicted grade, performance category, and metrics."""
    id: str
    created_at: str
    subject: str
    prediction_mode: str
    predicted_grade: float
    performance_category: str
    grade_scale: str = "0 - 20"
    model_version: str
    model_name: str
    held_out_metrics: Dict[str, Any]
    pass_probability: Optional[float] = None
    pass_prediction: Optional[str] = None
    top_contributing_factors: List[FeatureImpact] = []
    caveat: str = (
        "Educational estimate only. Predictions indicate statistical expectations based on historical cohort patterns "
        "and do not determine an individual student's potential or guarantee academic outcomes."
    )


class PredictionHistoryItem(BaseModel):
    id: str
    created_at: str
    subject: str
    prediction_mode: str
    predicted_grade: float
    performance_category: str
    model_version: str
    input_features: Dict[str, Any]


class PaginatedPredictions(BaseModel):
    items: List[PredictionHistoryItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class HealthResponse(BaseModel):
    status: str
    model_status: str
    model_version: str
    available_prediction_modes: List[str]
    dataset_records_trained: int


class FeatureImportanceResponse(BaseModel):
    mode: str
    model_name: str
    features: List[Dict[str, Any]]
    caveat: str


class DeleteResponse(BaseModel):
    status: str
    deleted_id: str
    message: str
