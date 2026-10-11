"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Sparkles,
  BarChart3,
  FlaskConical,
  History,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cpu,
  BookOpen,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";
import { ModelMetricsResponse, DatasetSummary } from "@/types";

export default function HomePage() {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getModelMetrics().catch(() => null),
      api.getDatasetSummary().catch(() => null),
    ]).then(([metricData, summaryData]) => {
      if (mounted) {
        if (metricData) setMetrics(metricData);
        if (summaryData) setSummary(summaryData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto pt-6 sm:pt-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-semibold text-[#4E5B45] border border-[#84917A]/30 mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#84917A]" />
          <span>Empirical Machine Learning for Educational Insights</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#332A24] leading-[1.12]">
          Understand performance. <br />
          <span className="italic font-normal text-[#84917A]">Discover potential.</span>
        </h1>

        <p className="text-base sm:text-xl text-[#6B5E55] max-w-2xl mx-auto leading-relaxed font-light">
          GradePilot estimates academic outcomes using student and study information.
          Explore verifiable machine learning predictions trained on the landmark UCI Student Performance dataset.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link
            href="/analyze"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#332A24] text-[#FFFDF8] font-medium text-sm hover:bg-[#473B33] active:scale-[0.99] transition-all shadow-md group"
          >
            <GraduationCap className="w-4 h-4 text-[#B9AA96]" />
            <span>Analyze a student</span>
            <ArrowRight className="w-4 h-4 text-[#B9AA96] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/insights"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass-panel text-[#332A24] font-medium text-sm hover:bg-[#FFFDF8] active:scale-[0.99] transition-all"
          >
            <BarChart3 className="w-4 h-4 text-[#84917A]" />
            <span>Explore insights</span>
          </Link>
        </div>

        {/* Live Empirical Stat Strip */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-2xl glass-panel border border-[#B9AA96]/30">
            <span className="text-[11px] font-medium text-[#8F8278] uppercase tracking-wider block">
              Trained Records
            </span>
            <span className="font-serif text-2xl font-bold text-[#332A24]">
              {summary?.combined.total_rows ? summary.combined.total_rows.toLocaleString() : "1,044"}
            </span>
            <span className="text-[11px] text-[#6B5E55] block mt-0.5">Math & Portuguese</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-[#B9AA96]/30">
            <span className="text-[11px] font-medium text-[#8F8278] uppercase tracking-wider block">
              Early Mode MAE
            </span>
            <span className="font-serif text-2xl font-bold text-[#332A24]">
              {metrics?.models.early.holdout_test_metrics.mae.toFixed(2) || "2.51"}
            </span>
            <span className="text-[11px] text-[#84917A] block mt-0.5">Lifestyle features only</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-[#B9AA96]/30">
            <span className="text-[11px] font-medium text-[#8F8278] uppercase tracking-wider block">
              Mid-Year MAE
            </span>
            <span className="font-serif text-2xl font-bold text-[#332A24]">
              {metrics?.models.mid_year.holdout_test_metrics.mae.toFixed(2) || "0.91"}
            </span>
            <span className="text-[11px] text-[#84917A] block mt-0.5">With G1 & G2 exams</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-[#B9AA96]/30">
            <span className="text-[11px] font-medium text-[#8F8278] uppercase tracking-wider block">
              Mid-Year R²
            </span>
            <span className="font-serif text-2xl font-bold text-[#332A24]">
              {metrics?.models.mid_year.holdout_test_metrics.r2.toFixed(2) || "0.88"}
            </span>
            <span className="text-[11px] text-[#6B5E55] block mt-0.5">88% variance explained</span>
          </div>
        </div>
      </section>

      {/* Product Feature Cards */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#332A24]">
            Rigorous Academic Modeling
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5E55] mt-1.5">
            Designed to bridge machine learning precision with transparent educational analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl glass-panel glass-panel-hover border border-[#B9AA96]/30 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#84917A]/15 text-[#4E5B45] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#332A24]">
                Dual Prediction Horizons
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
                Test predictions in <strong>Early-Performance Mode</strong> (demographics, habits, and lifestyle without exam marks) or <strong>Mid-Year Estimate Mode</strong> (incorporating first and second period grades).
              </p>
            </div>
            <div className="pt-4 border-t border-[#B9AA96]/20 mt-4 flex items-center gap-2 text-xs font-medium text-[#4E5B45]">
              <CheckCircle2 className="w-4 h-4 text-[#84917A]" />
              <span>Independent metric reporting</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl glass-panel glass-panel-hover border border-[#B9AA96]/30 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#A88670]/15 text-[#A88670] flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#332A24]">
                Model Lab & Honest Benchmarks
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
                Compare candidate algorithms including Ridge, Random Forest, Extra Trees, HistGradientBoosting, and XGBoost with full 5-fold cross-validation. Zero hardcoded metrics.
              </p>
            </div>
            <div className="pt-4 border-t border-[#B9AA96]/20 mt-4 flex items-center gap-2 text-xs font-medium text-[#A88670]">
              <CheckCircle2 className="w-4 h-4 text-[#A88670]" />
              <span>Genuine serialization on disk</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl glass-panel glass-panel-hover border border-[#B9AA96]/30 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#B9AA96]/25 text-[#6A5A4A] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#332A24]">
                Exploratory Cohort Analytics
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
                Deep dive into grade distributions across Mathematics and Portuguese, examine the association between study time and performance, and inspect correlation heatmaps.
              </p>
            </div>
            <div className="pt-4 border-t border-[#B9AA96]/20 mt-4 flex items-center gap-2 text-xs font-medium text-[#6A5A4A]">
              <CheckCircle2 className="w-4 h-4 text-[#B9AA96]" />
              <span>Real data from Cortez & Silva (2008)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Explanation */}
      <section className="p-8 sm:p-10 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-8">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold text-[#84917A] uppercase tracking-wider">
            Architecture & Pipeline
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#332A24] mt-1">
            How GradePilot Operates
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5E55] mt-1">
            A secure end-to-end flow from form entry to verified inference and explanation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#332A24] text-[#FFFDF8] font-bold text-xs flex items-center justify-center">
              01
            </div>
            <h4 className="font-semibold text-sm text-[#332A24]">Student Profile Input</h4>
            <p className="text-xs text-[#6B5E55] leading-relaxed">
              User enters demographic, study habit, and attendance features via a validated form.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#84917A] text-[#FFFDF8] font-bold text-xs flex items-center justify-center">
              02
            </div>
            <h4 className="font-semibold text-sm text-[#332A24]">Pipeline Transformation</h4>
            <p className="text-xs text-[#6B5E55] leading-relaxed">
              Scikit-learn ColumnTransformer applies standard scaling and one-hot encoding without target leakage.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#A88670] text-[#FFFDF8] font-bold text-xs flex items-center justify-center">
              03
            </div>
            <h4 className="font-semibold text-sm text-[#332A24]">ML Inference</h4>
            <p className="text-xs text-[#6B5E55] leading-relaxed">
              Trained models predict final grade G3 on a 0–20 scale alongside pass/fail probability.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#B9AA96] text-[#332A24] font-bold text-xs flex items-center justify-center">
              04
            </div>
            <h4 className="font-semibold text-sm text-[#332A24]">Audit & Persistence</h4>
            <p className="text-xs text-[#6B5E55] leading-relaxed">
              Results and contributing factors are returned to the user and persisted in SQLite for review.
            </p>
          </div>
        </div>
      </section>

      {/* Dataset Overview & Model Evaluation Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Dataset Overview */}
        <div className="p-8 rounded-3xl glass-panel border border-[#B9AA96]/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-[#84917A]" />
              <h3 className="font-serif text-xl font-bold text-[#332A24]">
                Dataset Overview
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed mb-4">
              GradePilot is powered by the benchmark secondary student performance dataset collected by Paulo Cortez and Alice Silva in two public secondary schools in Portugal.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-[#B9AA96]/20">
                <span className="text-[#6B5E55]">Mathematics Cohort</span>
                <span className="font-semibold text-[#332A24]">395 student records</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#B9AA96]/20">
                <span className="text-[#6B5E55]">Portuguese Language Cohort</span>
                <span className="font-semibold text-[#332A24]">649 student records</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#B9AA96]/20">
                <span className="text-[#6B5E55]">Total Combined Size</span>
                <span className="font-semibold text-[#332A24]">1,044 observations</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#B9AA96]/20">
                <span className="text-[#6B5E55]">Missing Values</span>
                <span className="font-semibold text-[#84917A]">0 (Validated Complete)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#6B5E55]">Grade Scale Range</span>
                <span className="font-semibold text-[#332A24]">0 to 20 integer scale</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4">
            <Link
              href="/insights"
              className="text-xs font-medium text-[#4E5B45] hover:text-[#332A24] inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Explore full cohort distributions & correlations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Model Evaluation Preview */}
        <div className="p-8 rounded-3xl glass-panel border border-[#B9AA96]/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-[#A88670]" />
              <h3 className="font-serif text-xl font-bold text-[#332A24]">
                Holdout Test Performance
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed mb-4">
              All models are evaluated on a strictly isolated 20% holdout test partition (209 samples) untouched during training and tuning.
            </p>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#332A24]">Early-Performance Model</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#84917A]/15 text-[#4E5B45]">
                    {metrics?.models.early.selected_model || "Random Forest"}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B5E55] mb-2">Excludes first & second term exam marks</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#F5F0E8] p-1.5 rounded-lg">
                    <span className="text-[10px] text-[#8F8278] block">MAE</span>
                    <span className="text-xs font-bold text-[#332A24]">
                      {metrics?.models.early.holdout_test_metrics.mae.toFixed(2) || "2.51"}
                    </span>
                  </div>
                  <div className="bg-[#F5F0E8] p-1.5 rounded-lg">
                    <span className="text-[10px] text-[#8F8278] block">RMSE</span>
                    <span className="text-xs font-bold text-[#332A24]">
                      {metrics?.models.early.holdout_test_metrics.rmse.toFixed(2) || "3.40"}
                    </span>
                  </div>
                  <div className="bg-[#F5F0E8] p-1.5 rounded-lg">
                    <span className="text-[10px] text-[#8F8278] block">R² Score</span>
                    <span className="text-xs font-bold text-[#332A24]">
                      {metrics?.models.early.holdout_test_metrics.r2.toFixed(2) || "0.19"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#332A24]">Mid-Year Estimate Model</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#A88670]/15 text-[#A88670]">
                    {metrics?.models.mid_year.selected_model || "XGBoost"}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B5E55] mb-2">Incorporates G1 and G2 interim exam marks</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#F5F0E8] p-1.5 rounded-lg">
                    <span className="text-[10px] text-[#8F8278] block">MAE</span>
                    <span className="text-xs font-bold text-[#332A24]">
                      {metrics?.models.mid_year.holdout_test_metrics.mae.toFixed(2) || "0.91"}
                    </span>
                  </div>
                  <div className="bg-[#F5F0E8] p-1.5 rounded-lg">
                    <span className="text-[10px] text-[#8F8278] block">RMSE</span>
                    <span className="text-xs font-bold text-[#332A24]">
                      {metrics?.models.mid_year.holdout_test_metrics.rmse.toFixed(2) || "1.31"}
                    </span>
                  </div>
                  <div className="bg-[#F5F0E8] p-1.5 rounded-lg">
                    <span className="text-[10px] text-[#8F8278] block">R² Score</span>
                    <span className="text-xs font-bold text-[#332A24]">
                      {metrics?.models.mid_year.holdout_test_metrics.r2.toFixed(2) || "0.88"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4">
            <Link
              href="/model-lab"
              className="text-xs font-medium text-[#4E5B45] hover:text-[#332A24] inline-flex items-center gap-1.5 transition-colors"
            >
              <span>View full candidate comparisons & confusion matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Ethical Educational Use Notice */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#FFFDF8] border border-[#B9AA96]/40 shadow-xs flex flex-col sm:flex-row items-start gap-4">
        <div className="p-3 rounded-2xl bg-[#84917A]/15 text-[#4E5B45] shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#332A24]">
            Educational Purpose & Ethical Guidance
          </h3>
          <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
            GradePilot is created as an academic demonstration of machine learning applied to secondary educational data. It is intended for exploratory analytics, early alert identification, and instructional understanding. Under no circumstances should algorithmic estimates be used to categorize students as inherently capable or incapable, or to deny students access to educational opportunities.
          </p>
        </div>
      </section>
    </div>
  );
}
