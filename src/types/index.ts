export type SubjectType = "math" | "portuguese";
export type PredictionModeType = "early" | "mid_year";

export interface StudentFeatures {
  school: "GP" | "MS";
  sex: "F" | "M";
  age: number;
  address: "U" | "R";
  famsize: "LE3" | "GT3";
  Pstatus: "T" | "A";
  Medu: number;
  Fedu: number;
  Mjob: "teacher" | "health" | "services" | "at_home" | "other";
  Fjob: "teacher" | "health" | "services" | "at_home" | "other";
  reason: "home" | "reputation" | "course" | "other";
  guardian: "mother" | "father" | "other";
  traveltime: number;
  studytime: number;
  failures: number;
  schoolsup: "yes" | "no";
  famsup: "yes" | "no";
  paid: "yes" | "no";
  activities: "yes" | "no";
  nursery: "yes" | "no";
  higher: "yes" | "no";
  internet: "yes" | "no";
  romantic: "yes" | "no";
  famrel: number;
  freetime: number;
  goout: number;
  Dalc: number;
  Walc: number;
  health: number;
  absences: number;
  G1?: number;
  G2?: number;
}

export interface PredictRequest {
  subject: SubjectType;
  prediction_mode: PredictionModeType;
  features: StudentFeatures;
}

export interface FeatureImpact {
  feature: string;
  importance: number;
  student_value: any;
  interpretation: string;
}

export interface RegressionMetrics {
  mae: number;
  rmse: number;
  r2: number;
  residual_mean?: number;
  residual_std?: number;
  actual_vs_pred_sample?: Array<{
    actual: number;
    predicted: number;
    residual: number;
  }>;
}

export interface PredictResponse {
  id: string;
  created_at: string;
  subject: SubjectType;
  prediction_mode: PredictionModeType;
  predicted_grade: number;
  performance_category: string;
  grade_scale: string;
  model_version: string;
  model_name: string;
  held_out_metrics: RegressionMetrics;
  pass_probability?: number | null;
  pass_prediction?: string | null;
  top_contributing_factors: FeatureImpact[];
  caveat: string;
}

export interface PredictionHistoryItem {
  id: string;
  created_at: string;
  subject: SubjectType;
  prediction_mode: PredictionModeType;
  predicted_grade: number;
  performance_category: string;
  model_version: string;
  input_features: Record<string, any>;
}

export interface PaginatedPredictions {
  items: PredictionHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DatasetFileSummary {
  rows: number;
  columns: number;
  sha256?: string;
  grade_summary: {
    mean: number;
    std: number;
    median: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
    pass_count: number;
    fail_count: number;
    pass_rate: number;
  };
}

export interface DatasetSummary {
  dataset_name: string;
  source_url: string;
  citation: string;
  files: {
    student_mat: DatasetFileSummary;
    student_por: DatasetFileSummary;
  };
  combined: {
    total_rows: number;
    total_columns: number;
    missing_values_total: number;
    duplicate_rows: number;
    grade_summary: {
      mean: number;
      std: number;
      median: number;
      min: number;
      max: number;
      pass_count: number;
      fail_count: number;
      pass_rate: number;
    };
    pass_fail_balance: {
      pass_ge_10: number;
      fail_lt_10: number;
      pass_rate_pct: number;
    };
  };
  categorical_features_count: number;
  numeric_features_count: number;
}

export interface CandidateResult {
  cv_mae_mean?: number;
  cv_mae_std?: number;
  cv_rmse_mean?: number;
  cv_rmse_std?: number;
  cv_r2_mean?: number;
  cv_r2_std?: number;
  cv_accuracy_mean?: number;
  cv_balanced_accuracy_mean?: number;
  cv_macro_f1_mean?: number;
}

export interface ModelMetricsResponse {
  model_version: string;
  training_timestamp: string;
  dataset_info: {
    name: string;
    math_rows: number;
    portuguese_rows: number;
    total_combined_rows: number;
    train_samples: number;
    test_samples: number;
    math_sha256: string;
    portuguese_sha256: string;
  };
  models: {
    early: {
      mode: string;
      selected_model: string;
      candidate_comparison: Record<string, CandidateResult>;
      cross_validation: CandidateResult;
      holdout_test_metrics: RegressionMetrics;
      baseline_comparison: {
        baseline_model: string;
        baseline_test_mae: number;
        baseline_test_rmse: number;
        baseline_test_r2: number;
        mae_improvement: number;
        rmse_improvement: number;
        r2_improvement: number;
      };
      feature_importances: Array<{
        feature: string;
        importance: number;
        std: number;
      }>;
    };
    mid_year: {
      mode: string;
      selected_model: string;
      candidate_comparison: Record<string, CandidateResult>;
      cross_validation: CandidateResult;
      holdout_test_metrics: RegressionMetrics;
      baseline_comparison: {
        baseline_model: string;
        baseline_test_mae: number;
        baseline_test_rmse: number;
        baseline_test_r2: number;
        mae_improvement: number;
        rmse_improvement: number;
        r2_improvement: number;
      };
      feature_importances: Array<{
        feature: string;
        importance: number;
        std: number;
      }>;
    };
    classification: {
      selected_model: string;
      threshold: string;
      candidate_comparison: Record<string, CandidateResult>;
      holdout_test_metrics: {
        accuracy: number;
        balanced_accuracy: number;
        macro_f1: number;
        precision: number;
        recall: number;
        confusion_matrix: {
          matrix: number[][];
          labels: string[];
          true_negatives: number;
          false_positives: number;
          false_negatives: number;
          true_positives: number;
        };
      };
    };
  };
  performance_categories: Record<string, { range: string; description: string }>;
}

export interface GradeDistributionData {
  series: Array<{
    grade: number;
    combined: number;
    math: number;
    portuguese: number;
  }>;
  summaries: {
    combined: any;
    math: any;
    portuguese: any;
  };
  scale: string;
}

export interface RelationshipsData {
  studytime_vs_grade: Array<{
    studytime: number;
    avg_grade: number;
    count: number;
  }>;
  absences_vs_grade: Array<{
    bin: string;
    avg_grade: number;
    count: number;
  }>;
  correlations: {
    correlations_with_g3?: Array<{
      feature: string;
      correlation: number;
      direction: "positive" | "negative";
      magnitude: number;
    }>;
    features?: string[];
    matrix?: Array<Record<string, any>>;
  };
  caveat: string;
}

export interface HealthResponse {
  status: string;
  model_status: string;
  model_version: string;
  available_prediction_modes: string[];
  dataset_records_trained: number;
}
