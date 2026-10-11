"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Award,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Scale,
  TrendingUp,
  BarChart2,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Line,
  ComposedChart,
} from "recharts";
import { api } from "@/lib/api";
import { ModelMetricsResponse } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ModelLabPage() {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"early" | "mid_year" | "classification">("early");

  useEffect(() => {
    let mounted = true;
    api
      .getModelMetrics()
      .then((data) => {
        if (mounted) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Failed to load model metrics from backend.");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-[#84917A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#6B5E55]">Loading serialized model metrics from backend...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 rounded-3xl bg-[#C87961]/15 border border-[#C87961]/40 text-[#933D25] text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto" />
        <h3 className="font-serif font-bold text-lg">Unable to Load Model Lab Artifacts</h3>
        <p className="text-xs max-w-md mx-auto">{error}</p>
        <p className="text-[11px] text-[#6B5E55]">
          Ensure you have run <code className="bg-[#FFFDF8] px-1.5 py-0.5 rounded">python -m training.train</code> inside the backend directory.
        </p>
      </div>
    );
  }

  const earlyData = metrics.models.early;
  const midData = metrics.models.mid_year;
  const clfData = metrics.models.classification;

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-semibold text-[#4E5B45] border border-[#84917A]/30">
          <FlaskConical className="w-3.5 h-3.5 text-[#84917A]" />
          <span>Evaluation Lab</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#332A24]">
          Model Lab & Benchmark Transparency
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5E55] max-w-2xl font-light">
          Real cross-validation and holdout test metrics serialized on disk. GradePilot does not fabricate model performance or hide algorithmic error.
        </p>
      </div>

      {/* Artifact Metadata Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-[#B9AA96]/35 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[10px] text-[#8F8278] uppercase tracking-wider block">Model Version</span>
          <span className="font-bold text-sm text-[#332A24]">{metrics.model_version}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#8F8278] uppercase tracking-wider block">Training Timestamp</span>
          <span className="font-medium text-[#332A24]">{formatDate(metrics.training_timestamp)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#8F8278] uppercase tracking-wider block">Training Split</span>
          <span className="font-bold text-[#332A24]">{metrics.dataset_info.train_samples} samples (80%)</span>
        </div>
        <div>
          <span className="text-[10px] text-[#8F8278] uppercase tracking-wider block">Isolated Holdout Test</span>
          <span className="font-bold text-[#4E5B45]">{metrics.dataset_info.test_samples} samples (20%)</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#B9AA96]/30 gap-2">
        <button
          onClick={() => setActiveTab("early")}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === "early"
              ? "text-[#332A24] border-b-2 border-[#84917A]"
              : "text-[#8F8278] hover:text-[#332A24]"
          }`}
        >
          Early-Performance Model (Lifestyle)
        </button>
        <button
          onClick={() => setActiveTab("mid_year")}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === "mid_year"
              ? "text-[#332A24] border-b-2 border-[#A88670]"
              : "text-[#8F8278] hover:text-[#332A24]"
          }`}
        >
          Mid-Year Estimate (With G1 & G2)
        </button>
        <button
          onClick={() => setActiveTab("classification")}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === "classification"
              ? "text-[#332A24] border-b-2 border-[#332A24]"
              : "text-[#8F8278] hover:text-[#332A24]"
          }`}
        >
          Pass/Fail Classification (G3 ≥ 10)
        </button>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === "early" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Overview Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[11px] font-semibold text-[#84917A] uppercase tracking-wider">
                  Selected Algorithm
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#332A24]">
                  {earlyData.selected_model} Regressor
                </h3>
                <p className="text-xs text-[#6B5E55] mt-0.5">
                  Predicting final grade without first or second period grades.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#84917A]/15 border border-[#84917A]/30 text-xs font-semibold text-[#4E5B45]">
                CV MAE: {earlyData.cross_validation.cv_mae_mean?.toFixed(2)} ± {earlyData.cross_validation.cv_mae_std?.toFixed(2)}
              </div>
            </div>

            {/* Test Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Holdout Test MAE</span>
                <span className="font-serif text-3xl font-bold text-[#332A24]">
                  {earlyData.holdout_test_metrics.mae.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#6B5E55] block mt-1">
                  Baseline improvement: -{earlyData.baseline_comparison.mae_improvement.toFixed(2)} marks
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Holdout Test RMSE</span>
                <span className="font-serif text-3xl font-bold text-[#332A24]">
                  {earlyData.holdout_test_metrics.rmse.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#6B5E55] block mt-1">
                  On 0–20 point scale
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Test R² (Variance Explained)</span>
                <span className="font-serif text-3xl font-bold text-[#84917A]">
                  {earlyData.holdout_test_metrics.r2.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#6B5E55] block mt-1">
                  ~19% of final variance from lifestyle alone
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Regressors Comparison Table */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#332A24]">
              Candidate Model Comparison (5-Fold Cross-Validation)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#B9AA96]/30 text-[#8F8278]">
                    <th className="py-2.5 px-3 font-semibold">Candidate Algorithm</th>
                    <th className="py-2.5 px-3 font-semibold">CV MAE (Mean ± Std)</th>
                    <th className="py-2.5 px-3 font-semibold">CV RMSE</th>
                    <th className="py-2.5 px-3 font-semibold">CV R²</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B9AA96]/15">
                  {Object.entries(earlyData.candidate_comparison).map(([candName, candRes]) => {
                    const isSelected = candName === earlyData.selected_model;
                    return (
                      <tr
                        key={candName}
                        className={`transition-colors ${
                          isSelected ? "bg-[#84917A]/10 font-medium" : "hover:bg-[#FFFDF8]/60"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-[#332A24] font-semibold flex items-center gap-2">
                          {candName}
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#84917A] text-[#FFFDF8]">
                              Selected Best
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {candRes.cv_mae_mean?.toFixed(2)} ± {candRes.cv_mae_std?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{candRes.cv_rmse_mean?.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono">{candRes.cv_r2_mean?.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-[#6B5E55]">
                          {isSelected ? "Selected (Lowest CV Error)" : "Evaluated"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Importance Chart */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#332A24]">
                Permutation Feature Importance (Early Horizon)
              </h3>
              <p className="text-xs text-[#6B5E55] mt-0.5">
                Evaluated on the isolated holdout test partition (209 unseen samples).
              </p>
            </div>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={earlyData.feature_importances.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 30, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#B9AA96" strokeOpacity={0.25} />
                  <XAxis type="number" stroke="#8F8278" fontSize={11} />
                  <YAxis dataKey="feature" type="category" stroke="#8F8278" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFDF8",
                      borderColor: "#B9AA96",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="importance" name="Permutation Importance" fill="#84917A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "mid_year" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Overview Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#A88670]/40 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[11px] font-semibold text-[#A88670] uppercase tracking-wider">
                  Selected Algorithm
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#332A24]">
                  {midData.selected_model} Regressor
                </h3>
                <p className="text-xs text-[#6B5E55] mt-0.5">
                  Incorporating G1 (Term 1) and G2 (Term 2) interim examinations.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#A88670]/15 border border-[#A88670]/30 text-xs font-semibold text-[#A88670]">
                CV MAE: {midData.cross_validation.cv_mae_mean?.toFixed(2)} ± {midData.cross_validation.cv_mae_std?.toFixed(2)}
              </div>
            </div>

            {/* Test Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Holdout Test MAE</span>
                <span className="font-serif text-3xl font-bold text-[#332A24]">
                  {midData.holdout_test_metrics.mae.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#6B5E55] block mt-1">
                  Less than 1 grade point average deviation
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Holdout Test RMSE</span>
                <span className="font-serif text-3xl font-bold text-[#332A24]">
                  {midData.holdout_test_metrics.rmse.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#6B5E55] block mt-1">
                  On 0–20 point scale
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Test R² (Variance Explained)</span>
                <span className="font-serif text-3xl font-bold text-[#A88670]">
                  {midData.holdout_test_metrics.r2.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#6B5E55] block mt-1">
                  88% variance explained on test set
                </span>
              </div>
            </div>
          </div>

          {/* Actual vs Predicted Sample Visualization */}
          {midData.holdout_test_metrics.actual_vs_pred_sample && (
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#332A24]">
                  Actual vs. Predicted Grades (Holdout Test Cohort Sample)
                </h3>
                <p className="text-xs text-[#6B5E55] mt-0.5">
                  Comparison between true student final mark G3 and model prediction.
                </p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={midData.holdout_test_metrics.actual_vs_pred_sample.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#B9AA96" strokeOpacity={0.25} />
                    <XAxis
                      dataKey="actual"
                      stroke="#8F8278"
                      fontSize={11}
                      tickFormatter={(val, i) => `S${i + 1}`}
                    />
                    <YAxis domain={[0, 20]} stroke="#8F8278" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFDF8",
                        borderColor: "#B9AA96",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="actual" name="Actual G3" fill="#B9AA96" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="predicted" name="Predicted G3" fill="#A88670" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Feature Importance */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#332A24]">
                Permutation Feature Importance (Mid-Year Horizon)
              </h3>
              <p className="text-xs text-[#6B5E55] mt-0.5">
                Shows the predominant weighting of G2 and G1 when interim exams are provided.
              </p>
            </div>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={midData.feature_importances.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 30, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#B9AA96" strokeOpacity={0.25} />
                  <XAxis type="number" stroke="#8F8278" fontSize={11} />
                  <YAxis dataKey="feature" type="category" stroke="#8F8278" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFDF8",
                      borderColor: "#B9AA96",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="importance" name="Permutation Importance" fill="#A88670" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "classification" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Classification Overview */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[11px] font-semibold text-[#332A24] uppercase tracking-wider">
                  Binary Pass/Fail Classifier
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#332A24]">
                  {clfData.selected_model}
                </h3>
                <p className="text-xs text-[#6B5E55] mt-0.5">
                  Threshold: G3 ≥ 10 is Pass, &lt; 10 is Fail. (Evaluated on early lifestyle features).
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#332A24] text-[#FFFDF8] text-xs font-semibold">
                Accuracy: {(clfData.holdout_test_metrics.accuracy * 100).toFixed(1)}%
              </div>
            </div>

            {/* Classification Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Accuracy</span>
                <span className="font-serif text-2xl font-bold text-[#332A24]">
                  {(clfData.holdout_test_metrics.accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Balanced Accuracy</span>
                <span className="font-serif text-2xl font-bold text-[#332A24]">
                  {(clfData.holdout_test_metrics.balanced_accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Macro F1 Score</span>
                <span className="font-serif text-2xl font-bold text-[#84917A]">
                  {clfData.holdout_test_metrics.macro_f1.toFixed(3)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <span className="text-[11px] text-[#8F8278] block">Precision / Recall</span>
                <span className="font-serif text-2xl font-bold text-[#A88670]">
                  {clfData.holdout_test_metrics.precision.toFixed(2)} / {clfData.holdout_test_metrics.recall.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Confusion Matrix Display */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#332A24]">
              Confusion Matrix (209 Holdout Test Samples)
            </h3>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-center pt-2">
              <div className="p-5 rounded-2xl bg-[#84917A]/15 border border-[#84917A]/30">
                <span className="text-xs text-[#4E5B45] font-semibold block">True Positives (Pass)</span>
                <span className="font-serif text-3xl font-bold text-[#332A24] block my-1">
                  {clfData.holdout_test_metrics.confusion_matrix.true_positives}
                </span>
                <span className="text-[11px] text-[#6B5E55]">Predicted Pass, Actual Pass</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#C87961]/15 border border-[#C87961]/30">
                <span className="text-xs text-[#933D25] font-semibold block">False Positives</span>
                <span className="font-serif text-3xl font-bold text-[#332A24] block my-1">
                  {clfData.holdout_test_metrics.confusion_matrix.false_positives}
                </span>
                <span className="text-[11px] text-[#6B5E55]">Predicted Pass, Actual Fail</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#C87961]/15 border border-[#C87961]/30">
                <span className="text-xs text-[#933D25] font-semibold block">False Negatives</span>
                <span className="font-serif text-3xl font-bold text-[#332A24] block my-1">
                  {clfData.holdout_test_metrics.confusion_matrix.false_negatives}
                </span>
                <span className="text-[11px] text-[#6B5E55]">Predicted Fail, Actual Pass</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#84917A]/15 border border-[#84917A]/30">
                <span className="text-xs text-[#4E5B45] font-semibold block">True Negatives (Fail)</span>
                <span className="font-serif text-3xl font-bold text-[#332A24] block my-1">
                  {clfData.holdout_test_metrics.confusion_matrix.true_negatives}
                </span>
                <span className="text-[11px] text-[#6B5E55]">Predicted Fail, Actual Fail</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Limitations & Fairness Constraints */}
      <div className="p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#A88670]" />
          <h3 className="font-serif font-bold text-lg text-[#332A24]">
            Model Limitations & Algorithmic Boundaries
          </h3>
        </div>
        <ul className="space-y-2 text-xs text-[#6B5E55] leading-relaxed list-disc list-inside">
          <li>
            <strong>Sample Population Boundary:</strong> Trained exclusively on students from two public secondary schools in the Alentejo region of Portugal during 2005–2006. Generalization to other countries, curricula, or eras cannot be guaranteed.
          </li>
          <li>
            <strong>Lifestyle Predictive Ceiling:</strong> Socio-demographic and habit features explain approximately 19% of final mark variance. Over 80% of student variance in early horizons is driven by unmeasured factors (teacher effectiveness, motivation, personal events).
          </li>
          <li>
            <strong>Interim Mark Anchoring:</strong> Mid-year predictions (with G1 and G2) achieve R² ≈ 0.88 because interim grades directly reflect accumulated curriculum mastery, not because the algorithm possesses clairvoyance.
          </li>
          <li>
            <strong>Non-Causal Interpretability:</strong> Permutation importance indicates statistical associations in historical cohorts. It must not be interpreted as proving that modifying a feature (e.g. forced study hours) will directly alter a student&apos;s grade.
          </li>
        </ul>
      </div>
    </div>
  );
}
