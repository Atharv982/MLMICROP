/**
 * Strongly-typed API client for GradePilot FastAPI backend.
 */

import {
  HealthResponse,
  DatasetSummary,
  ModelMetricsResponse,
  PredictRequest,
  PredictResponse,
  PaginatedPredictions,
  PredictionHistoryItem,
  GradeDistributionData,
  RelationshipsData,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      // Ensure Next.js doesn't aggressively cache dynamic ML predictions or history
      cache: "no-store",
    });

    if (!res.ok) {
      let errorMessage = `API request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === "string" 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback to text
        const text = await res.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    return (await res.json()) as T;
  } catch (error: any) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        `Unable to connect to GradePilot backend at ${API_BASE_URL}. Ensure the FastAPI server is running on port 8000.`
      );
    }
    throw error;
  }
}

export const api = {
  getHealth: () => fetchJson<HealthResponse>("/health"),

  getDatasetSummary: () => fetchJson<DatasetSummary>("/api/v1/dataset/summary"),

  getModelMetrics: () => fetchJson<ModelMetricsResponse>("/api/v1/model/metrics"),

  getFeatureImportance: (mode: "early" | "mid_year" = "early") =>
    fetchJson<{ mode: string; model_name: string; features: any[]; caveat: string }>(
      `/api/v1/model/feature-importance?mode=${mode}`
    ),

  predict: (data: PredictRequest) =>
    fetchJson<PredictResponse>("/api/v1/predict", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPredictions: (page: number = 1, pageSize: number = 10) =>
    fetchJson<PaginatedPredictions>(
      `/api/v1/predictions?page=${page}&page_size=${pageSize}`
    ),

  getPrediction: (id: string) =>
    fetchJson<PredictionHistoryItem>(`/api/v1/predictions/${id}`),

  deletePrediction: (id: string) =>
    fetchJson<{ status: string; deleted_id: string; message: string }>(
      `/api/v1/predictions/${id}`,
      { method: "DELETE" }
    ),

  getGradeDistributions: () =>
    fetchJson<GradeDistributionData>("/api/v1/analytics/grades"),

  getFeatureAnalytics: () =>
    fetchJson<{ numeric_features: any; categorical_features: any }>(
      "/api/v1/analytics/features"
    ),

  getRelationships: () =>
    fetchJson<RelationshipsData>("/api/v1/analytics/relationships"),
};
