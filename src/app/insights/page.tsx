"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  BookOpen,
  PieChart,
  Table,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  GradeDistributionData,
  RelationshipsData,
  DatasetSummary,
} from "@/types";

export default function InsightsPage() {
  const [grades, setGrades] = useState<GradeDistributionData | null>(null);
  const [relationships, setRelationships] = useState<RelationshipsData | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [featureStats, setFeatureStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getGradeDistributions(),
      api.getRelationships(),
      api.getDatasetSummary(),
      api.getFeatureAnalytics(),
    ])
      .then(([gData, rData, sData, fData]) => {
        if (mounted) {
          setGrades(gData);
          setRelationships(rData);
          setSummary(sData);
          setFeatureStats(fData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Failed to load dataset analytics.");
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
        <p className="text-sm text-[#6B5E55]">Computing dataset analytics from UCI student cohorts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-[#C87961]/15 border border-[#C87961]/40 text-[#933D25] text-center space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <h3 className="font-serif font-bold text-lg">Unable to load dataset analytics</h3>
        <p className="text-xs max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-semibold text-[#4E5B45] border border-[#84917A]/30">
          <BarChart3 className="w-3.5 h-3.5 text-[#84917A]" />
          <span>Cohort Explorations</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#332A24]">
          Dataset Analytics & Habit Distributions
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5E55] max-w-2xl font-light">
          Real statistical distributions and correlation structures derived from 1,044 secondary student records in the official UCI benchmark.
        </p>
      </div>

      {/* Cohort Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-[#B9AA96]/30">
          <span className="text-[11px] font-semibold text-[#8F8278] uppercase tracking-wider block">
            Math Cohort
          </span>
          <span className="font-serif text-2xl font-bold text-[#332A24]">
            {summary?.files.student_mat.rows || 395} students
          </span>
          <span className="text-[11px] text-[#6B5E55] block mt-0.5">
            Mean G3: {summary?.files.student_mat.grade_summary.mean.toFixed(1)}/20
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-[#B9AA96]/30">
          <span className="text-[11px] font-semibold text-[#8F8278] uppercase tracking-wider block">
            Portuguese Cohort
          </span>
          <span className="font-serif text-2xl font-bold text-[#332A24]">
            {summary?.files.student_por.rows || 649} students
          </span>
          <span className="text-[11px] text-[#6B5E55] block mt-0.5">
            Mean G3: {summary?.files.student_por.grade_summary.mean.toFixed(1)}/20
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-[#B9AA96]/30">
          <span className="text-[11px] font-semibold text-[#8F8278] uppercase tracking-wider block">
            Overall Pass Rate
          </span>
          <span className="font-serif text-2xl font-bold text-[#4E5B45]">
            {summary?.combined.pass_fail_balance.pass_rate_pct.toFixed(1)}%
          </span>
          <span className="text-[11px] text-[#6B5E55] block mt-0.5">G3 ≥ 10 threshold</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-[#B9AA96]/30">
          <span className="text-[11px] font-semibold text-[#8F8278] uppercase tracking-wider block">
            Missing Values
          </span>
          <span className="font-serif text-2xl font-bold text-[#84917A]">
            0.0%
          </span>
          <span className="text-[11px] text-[#6B5E55] block mt-0.5">Fully validated dataset</span>
        </div>
      </div>

      {/* Chart 1: Grade Distribution by Subject */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
        <div>
          <h2 className="font-serif font-bold text-lg text-[#332A24]">
            Final Grade (G3) Distribution: Mathematics vs. Portuguese
          </h2>
          <p className="text-xs text-[#6B5E55] mt-0.5">
            Frequency of marks from 0 to 20 across cohorts. Note the noticeable cluster of 0 scores representing non-completion/dropout.
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grades?.series || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#B9AA96" strokeOpacity={0.25} />
              <XAxis dataKey="grade" stroke="#8F8278" fontSize={11} tickLine={false} />
              <YAxis stroke="#8F8278" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFDF8",
                  borderColor: "#B9AA96",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#332A24",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="math" name="Mathematics (395)" fill="#A88670" radius={[4, 4, 0, 0]} />
              <Bar dataKey="portuguese" name="Portuguese (649)" fill="#84917A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Charts: Study Time vs Grade & Absences vs Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Study Time */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#332A24] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#84917A]" />
              Study Time vs. Mean Grade
            </h2>
            <p className="text-xs text-[#6B5E55] mt-0.5">
              Weekly dedication (1: &lt;2h, 2: 2–5h, 3: 5–10h, 4: &gt;10h)
            </p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={relationships?.studytime_vs_grade || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#B9AA96" strokeOpacity={0.25} />
                <XAxis
                  dataKey="studytime"
                  stroke="#8F8278"
                  fontSize={11}
                  tickFormatter={(val) => {
                    const map: Record<number, string> = {
                      1: "<2 hrs",
                      2: "2-5 hrs",
                      3: "5-10 hrs",
                      4: ">10 hrs",
                    };
                    return map[val] || `${val}`;
                  }}
                />
                <YAxis domain={[0, 20]} stroke="#8F8278" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFDF8",
                    borderColor: "#B9AA96",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} / 20`, "Average Grade"]}
                />
                <Bar dataKey="avg_grade" name="Average Grade" fill="#84917A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Absences */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#332A24] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#A88670]" />
              School Absences vs. Mean Grade
            </h2>
            <p className="text-xs text-[#6B5E55] mt-0.5">
              Stratified days absent and corresponding final grade averages
            </p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={relationships?.absences_vs_grade || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#B9AA96" strokeOpacity={0.25} />
                <XAxis dataKey="bin" stroke="#8F8278" fontSize={11} />
                <YAxis domain={[0, 20]} stroke="#8F8278" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFDF8",
                    borderColor: "#B9AA96",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} / 20`, "Average Grade"]}
                />
                <Bar dataKey="avg_grade" name="Average Grade" fill="#A88670" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Correlation Rankings Table with G3 */}
      {relationships?.correlations?.correlations_with_g3 && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-6">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#332A24]">
              Empirical Pearson Correlations with Final Grade (G3)
            </h2>
            <p className="text-xs text-[#6B5E55] mt-0.5">
              Ranked numerical variables by linear association with G3.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#B9AA96]/30 text-[#8F8278]">
                  <th className="py-2.5 px-3 font-semibold">Variable</th>
                  <th className="py-2.5 px-3 font-semibold">Correlation (r)</th>
                  <th className="py-2.5 px-3 font-semibold">Direction</th>
                  <th className="py-2.5 px-3 font-semibold">Empirical Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9AA96]/15">
                {relationships.correlations.correlations_with_g3.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FFFDF8]/60 transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#332A24]">{item.feature}</td>
                    <td className="py-2 px-3 font-mono font-bold text-xs">
                      {item.correlation > 0 ? `+${item.correlation.toFixed(3)}` : item.correlation.toFixed(3)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.direction === "positive"
                            ? "bg-[#84917A]/15 text-[#4E5B45]"
                            : "bg-[#C87961]/15 text-[#933D25]"
                        }`}
                      >
                        {item.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#6B5E55]">
                      {item.feature === "failures"
                        ? "Negative: Prior failure strongly drags downstream marks."
                        : item.feature === "Medu"
                        ? "Positive: Maternal educational attainment provides academic support."
                        : item.feature === "studytime"
                        ? "Positive: Systematic study allocation associates with higher achievement."
                        : item.feature === "Dalc" || item.feature === "Walc"
                        ? "Negative: Higher alcohol consumption correlates with lower scores."
                        : item.feature === "G2" || item.feature === "G1"
                        ? "Strong Positive: Prior exam marks are the dominant cumulative predictor."
                        : "Observed statistical cohort association."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Scientific Caveat */}
      <div className="p-6 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/40 flex items-start gap-3.5 shadow-xs">
        <AlertCircle className="w-5 h-5 text-[#A88670] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[#6B5E55] leading-relaxed">
          <strong className="text-[#332A24] block font-semibold">
            Correlation vs. Causation Principle
          </strong>
          <p>
            {relationships?.caveat ||
              "Observable correlations indicate statistical cohort patterns, not causal guarantees. For instance, increasing study time without qualitative support or changing parent employment will not mechanically guarantee a specific grade improvement."}
          </p>
        </div>
      </div>
    </div>
  );
}
