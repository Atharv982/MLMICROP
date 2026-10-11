"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GraduationCap,
  Sparkles,
  HelpCircle,
  RotateCcw,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Info,
  Sliders,
  BookOpen,
  Calendar,
} from "lucide-react";

import { studentFormSchema, StudentFormData, SAMPLE_STUDENTS } from "@/lib/schemas";
import { api } from "@/lib/api";
import { PredictResponse, SubjectType, PredictionModeType } from "@/types";
import { getCategoryBadgeStyle, formatGrade } from "@/lib/utils";

export default function AnalyzePage() {
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema) as any,
    defaultValues: {
      subject: "math",
      prediction_mode: "early",
      school: "GP",
      sex: "F",
      age: 16,
      address: "U",
      famsize: "GT3",
      Pstatus: "T",
      Medu: 3,
      Fedu: 3,
      Mjob: "services",
      Fjob: "other",
      reason: "course",
      guardian: "mother",
      traveltime: 1,
      studytime: 2,
      failures: 0,
      schoolsup: "no",
      famsup: "yes",
      paid: "no",
      activities: "yes",
      nursery: "yes",
      higher: "yes",
      internet: "yes",
      romantic: "no",
      famrel: 4,
      freetime: 3,
      goout: 3,
      Dalc: 1,
      Walc: 2,
      health: 4,
      absences: 4,
      G1: 12,
      G2: 12,
    },
  });

  const selectedMode = watch("prediction_mode");
  const selectedSubject = watch("subject");

  const loadSample = (profileKey: "high_achiever" | "at_risk" | "average_profile") => {
    const sample = SAMPLE_STUDENTS[profileKey];
    if (sample) {
      reset(sample);
      setPrediction(null);
      setApiError(null);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    setLoading(true);
    setApiError(null);

    try {
      const payload = {
        subject: data.subject as SubjectType,
        prediction_mode: data.prediction_mode as PredictionModeType,
        features: {
          ...data,
          G1: data.prediction_mode === "mid_year" ? Number(data.G1) : undefined,
          G2: data.prediction_mode === "mid_year" ? Number(data.G2) : undefined,
        },
      };

      const result = await api.predict(payload);
      setPrediction(result);
    } catch (err: any) {
      setApiError(err.message || "Failed to generate prediction from backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-semibold text-[#4E5B45] border border-[#84917A]/30">
          <GraduationCap className="w-3.5 h-3.5 text-[#84917A]" />
          <span>Inference Laboratory</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#332A24]">
          Student Performance Analysis
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5E55] max-w-2xl font-light">
          Enter student features to compute an empirical grade estimate on the Portuguese 0–20 academic scale. All estimates are powered by verified models trained on the UCI benchmark.
        </p>
      </div>

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sample Preload Strip */}
          <div className="p-4 rounded-2xl glass-panel border border-[#B9AA96]/35 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-xs font-medium text-[#6B5E55] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#84917A]" />
              Load Sample Profile:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadSample("high_achiever")}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#FFFDF8] hover:bg-[#84917A]/15 text-[#4E5B45] font-medium border border-[#B9AA96]/30 transition-colors"
              >
                High Achiever
              </button>
              <button
                type="button"
                onClick={() => loadSample("average_profile")}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#FFFDF8] hover:bg-[#B9AA96]/20 text-[#6B5E55] font-medium border border-[#B9AA96]/30 transition-colors"
              >
                Average Profile
              </button>
              <button
                type="button"
                onClick={() => loadSample("at_risk")}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#FFFDF8] hover:bg-[#C87961]/15 text-[#933D25] font-medium border border-[#B9AA96]/30 transition-colors"
              >
                At-Risk Trajectory
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Subject & Prediction Horizon */}
            <div className="p-6 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
              <h2 className="font-serif font-bold text-base text-[#332A24] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#84917A]" />
                1. Mode & Subject Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subject-select" className="block text-xs font-semibold text-[#332A24] mb-1.5">
                    Academic Subject
                  </label>
                  <select
                    id="subject-select"
                    {...register("subject")}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl glass-input"
                  >
                    <option value="math">Mathematics (student-mat.csv)</option>
                    <option value="portuguese">Portuguese Language (student-por.csv)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mode-select" className="block text-xs font-semibold text-[#332A24] mb-1.5">
                    Prediction Horizon
                  </label>
                  <select
                    id="mode-select"
                    {...register("prediction_mode")}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl glass-input"
                  >
                    <option value="early">Early-Performance (Lifestyle only, no exam grades)</option>
                    <option value="mid_year">Mid-Year Estimate (Includes G1 & G2 marks)</option>
                  </select>
                </div>
              </div>

              {selectedMode === "early" ? (
                <div className="p-3 rounded-xl bg-[#84917A]/10 border border-[#84917A]/25 text-[11px] text-[#4E5B45] flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#84917A]" />
                  <span>
                    <strong>Early Mode Active:</strong> G1 and G2 interim exam marks are excluded. Predictions depend entirely on habits, school context, and socio-demographic features.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#A88670]/15 border border-[#A88670]/30 text-[11px] text-[#332A24] flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A88670]" />
                  <span>
                    <strong>Mid-Year Estimate Active:</strong> G1 (Term 1) and G2 (Term 2) grades are utilized, achieving superior predictive correlation (R² ≈ 0.88).
                  </span>
                </div>
              )}
            </div>

            {/* Section 2: Interim Exam Marks (Conditionally displayed when mid_year is chosen) */}
            {selectedMode === "mid_year" && (
              <div className="p-6 rounded-3xl glass-panel border border-[#A88670]/40 bg-[#FFFDF8]/95 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif font-bold text-base text-[#332A24] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#A88670]" />
                    Interim Exam Grades (0–20 Scale)
                  </h2>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#A88670]/20 text-[#A88670]">
                    Required for Mid-Year
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="g1-input" className="block text-xs font-semibold text-[#332A24] mb-1">
                      G1: First Period Grade (0 to 20)
                    </label>
                    <input
                      id="g1-input"
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      {...register("G1")}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl glass-input font-mono"
                    />
                    {errors.G1 && (
                      <p className="text-[11px] text-[#933D25] mt-1">{errors.G1.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="g2-input" className="block text-xs font-semibold text-[#332A24] mb-1">
                      G2: Second Period Grade (0 to 20)
                    </label>
                    <input
                      id="g2-input"
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      {...register("G2")}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl glass-input font-mono"
                    />
                    {errors.G2 && (
                      <p className="text-[11px] text-[#933D25] mt-1">{errors.G2.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Demographics */}
            <div className="p-6 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
              <h2 className="font-serif font-bold text-base text-[#332A24]">
                2. Student Demographics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="school-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">School</label>
                  <select id="school-select" {...register("school")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="GP">GP (Gabriel Pereira)</option>
                    <option value="MS">MS (Mousinho da Silveira)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sex-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Sex</label>
                  <select id="sex-select" {...register("sex")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="F">Female (F)</option>
                    <option value="M">Male (M)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="age-input" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Age (15–22)</label>
                  <input id="age-input" type="number" min="15" max="22" {...register("age")} className="w-full text-xs p-2 rounded-xl glass-input" />
                </div>

                <div>
                  <label htmlFor="address-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Address</label>
                  <select id="address-select" {...register("address")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="U">Urban (U)</option>
                    <option value="R">Rural (R)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="famsize-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Family Size</label>
                  <select id="famsize-select" {...register("famsize")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="GT3">Greater than 3 (GT3)</option>
                    <option value="LE3">Less or equal to 3 (LE3)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pstatus-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Parents Cohabitation</label>
                  <select id="pstatus-select" {...register("Pstatus")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="T">Living Together (T)</option>
                    <option value="A">Apart (A)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Family Background */}
            <div className="p-6 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
              <h2 className="font-serif font-bold text-base text-[#332A24]">
                3. Family Background & Parental Education
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="medu-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Mother&apos;s Education</label>
                  <select id="medu-select" {...register("Medu")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="0">0: None</option>
                    <option value="1">1: Primary (4th grade)</option>
                    <option value="2">2: 5th to 9th grade</option>
                    <option value="3">3: Secondary education</option>
                    <option value="4">4: Higher education</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fedu-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Father&apos;s Education</label>
                  <select id="fedu-select" {...register("Fedu")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="0">0: None</option>
                    <option value="1">1: Primary (4th grade)</option>
                    <option value="2">2: 5th to 9th grade</option>
                    <option value="3">3: Secondary education</option>
                    <option value="4">4: Higher education</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mjob-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Mother&apos;s Job</label>
                  <select id="mjob-select" {...register("Mjob")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="teacher">Teacher</option>
                    <option value="health">Healthcare</option>
                    <option value="services">Civil Services</option>
                    <option value="at_home">At Home</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fjob-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Father&apos;s Job</label>
                  <select id="fjob-select" {...register("Fjob")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="teacher">Teacher</option>
                    <option value="health">Healthcare</option>
                    <option value="services">Civil Services</option>
                    <option value="at_home">At Home</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="guardian-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Guardian</label>
                  <select id="guardian-select" {...register("guardian")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="reason-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Reason for School</label>
                  <select id="reason-select" {...register("reason")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="home">Close to Home</option>
                    <option value="reputation">School Reputation</option>
                    <option value="course">Course Preference</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Study Habits & Educational Support */}
            <div className="p-6 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
              <h2 className="font-serif font-bold text-base text-[#332A24]">
                4. Study Habits & Support
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="studytime-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Weekly Study Time</label>
                  <select id="studytime-select" {...register("studytime")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: &lt; 2 hours</option>
                    <option value="2">2: 2 to 5 hours</option>
                    <option value="3">3: 5 to 10 hours</option>
                    <option value="4">4: &gt; 10 hours</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="traveltime-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Travel Time</label>
                  <select id="traveltime-select" {...register("traveltime")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: &lt; 15 min</option>
                    <option value="2">2: 15 to 30 min</option>
                    <option value="3">3: 30 to 60 min</option>
                    <option value="4">4: &gt; 60 min</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="failures-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Past Class Failures</label>
                  <select id="failures-select" {...register("failures")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="0">0 failures</option>
                    <option value="1">1 failure</option>
                    <option value="2">2 failures</option>
                    <option value="3">3 failures</option>
                    <option value="4">4+ failures</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="schoolsup-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Extra School Support</label>
                  <select id="schoolsup-select" {...register("schoolsup")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="famsup-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Family Support</label>
                  <select id="famsup-select" {...register("famsup")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="paid-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Extra Paid Classes</label>
                  <select id="paid-select" {...register("paid")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="higher-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Aspirations for Higher Ed</label>
                  <select id="higher-select" {...register("higher")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="internet-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Internet at Home</label>
                  <select id="internet-select" {...register("internet")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="activities-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Extra Activities</label>
                  <select id="activities-select" {...register("activities")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 6: Lifestyle & Attendance */}
            <div className="p-6 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-4">
              <h2 className="font-serif font-bold text-base text-[#332A24]">
                5. Social Habits, Health & Attendance
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="famrel-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Family Relationships (1-5)</label>
                  <select id="famrel-select" {...register("famrel")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: Very bad</option>
                    <option value="2">2: Poor</option>
                    <option value="3">3: Average</option>
                    <option value="4">4: Good</option>
                    <option value="5">5: Excellent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="freetime-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Free Time (1-5)</label>
                  <select id="freetime-select" {...register("freetime")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: Very low</option>
                    <option value="2">2: Low</option>
                    <option value="3">3: Moderate</option>
                    <option value="4">4: High</option>
                    <option value="5">5: Very high</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="goout-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Going Out with Friends (1-5)</label>
                  <select id="goout-select" {...register("goout")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: Very low</option>
                    <option value="2">2: Low</option>
                    <option value="3">3: Moderate</option>
                    <option value="4">4: High</option>
                    <option value="5">5: Very high</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dalc-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Workday Alcohol (1-5)</label>
                  <select id="dalc-select" {...register("Dalc")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: Very low</option>
                    <option value="2">2: Low</option>
                    <option value="3">3: Moderate</option>
                    <option value="4">4: High</option>
                    <option value="5">5: Very high</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="walc-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Weekend Alcohol (1-5)</label>
                  <select id="walc-select" {...register("Walc")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: Very low</option>
                    <option value="2">2: Low</option>
                    <option value="3">3: Moderate</option>
                    <option value="4">4: High</option>
                    <option value="5">5: Very high</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="health-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Current Health (1-5)</label>
                  <select id="health-select" {...register("health")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="1">1: Very bad</option>
                    <option value="2">2: Poor</option>
                    <option value="3">3: Normal</option>
                    <option value="4">4: Good</option>
                    <option value="5">5: Very good</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="absences-input" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Absences (0–93 days)</label>
                  <input id="absences-input" type="number" min="0" max="93" {...register("absences")} className="w-full text-xs p-2 rounded-xl glass-input font-mono" />
                </div>

                <div>
                  <label htmlFor="nursery-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Nursery School</label>
                  <select id="nursery-select" {...register("nursery")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="romantic-select" className="block text-[11px] font-semibold text-[#6B5E55] mb-1">Romantic Relationship</label>
                  <select id="romantic-select" {...register("romantic")} className="w-full text-xs p-2 rounded-xl glass-input">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {apiError && (
              <div className="p-4 rounded-2xl bg-[#C87961]/15 border border-[#C87961]/40 text-[#933D25] text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Prediction Request Failed</strong>
                  <span>{apiError}</span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#332A24] text-[#FFFDF8] font-medium text-sm hover:bg-[#473B33] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FFFDF8] border-t-transparent rounded-full animate-spin" />
                    <span>Computing Prediction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#B9AA96]" />
                    <span>Predict Final Grade (G3)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  reset();
                  setPrediction(null);
                  setApiError(null);
                }}
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl glass-panel text-[#6B5E55] hover:text-[#332A24] text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results Panel Column (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          {prediction ? (
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#84917A]/40 bg-[#FFFDF8]/90 shadow-lg space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-[#B9AA96]/20">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4E5B45]">
                  Estimation Results
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#84917A]/15 text-[#4E5B45] font-medium">
                  {prediction.prediction_mode === "early" ? "Early Horizon" : "Mid-Year Horizon"}
                </span>
              </div>

              {/* Large Grade Display */}
              <div className="text-center py-2 space-y-2">
                <span className="text-xs text-[#8F8278] block">Estimated Final Grade (G3)</span>
                <div className="font-serif text-6xl sm:text-7xl font-bold text-[#332A24] tracking-tight">
                  {formatGrade(prediction.predicted_grade)}
                  <span className="text-xl font-sans font-light text-[#8F8278] ml-1">/ 20</span>
                </div>

                {/* Category Badge */}
                {(() => {
                  const style = getCategoryBadgeStyle(prediction.performance_category);
                  return (
                    <div
                      className={`inline-block px-3.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {prediction.performance_category}
                    </div>
                  );
                })()}
              </div>

              {/* Grade Progress Gauge on 0-20 scale */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-[#8F8278]">
                  <span>0 (Min)</span>
                  <span>10 (Passing)</span>
                  <span>16 (Excellent)</span>
                  <span>20 (Max)</span>
                </div>
                <div className="w-full h-3 bg-[#EAE3D6] rounded-full overflow-hidden p-0.5 border border-[#B9AA96]/30">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#C87961] via-[#D99B59] to-[#84917A]"
                    style={{ width: `${Math.min(100, (prediction.predicted_grade / 20) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Pass/Fail Classifier Probability */}
              {prediction.pass_probability !== null && prediction.pass_probability !== undefined && (
                <div className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#B9AA96]/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#6B5E55] block">Classifier Pass Likelihood:</span>
                    <strong className="text-sm font-semibold text-[#332A24]">
                      {prediction.pass_prediction} ({(prediction.pass_probability * 100).toFixed(0)}%)
                    </strong>
                  </div>
                  <div className="text-right text-[11px] text-[#8F8278]">
                    <span>Threshold: G3 ≥ 10</span>
                  </div>
                </div>
              )}

              {/* Top Contributing Factors */}
              {prediction.top_contributing_factors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#332A24]">
                    Top Influencing Factors
                  </h3>
                  <div className="space-y-2">
                    {prediction.top_contributing_factors.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#FFFDF8] border border-[#B9AA96]/25 text-xs text-[#332A24]"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-xs text-[#4E5B45]">{f.feature}</span>
                          <span className="text-[10px] text-[#8F8278] font-mono">
                            weight: {f.importance.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5E55] leading-relaxed">
                          {f.interpretation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Verification Specs */}
              <div className="pt-3 border-t border-[#B9AA96]/20 space-y-1 text-[11px] text-[#8F8278]">
                <div className="flex justify-between">
                  <span>Selected Algorithm:</span>
                  <span className="font-medium text-[#332A24]">{prediction.model_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Holdout Test MAE:</span>
                  <span className="font-medium text-[#332A24]">
                    {prediction.held_out_metrics.mae.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Holdout Test R²:</span>
                  <span className="font-medium text-[#332A24]">
                    {prediction.held_out_metrics.r2.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Persistence ID:</span>
                  <span className="font-mono text-[10px] text-[#8F8278] truncate max-w-[140px]">
                    {prediction.id}
                  </span>
                </div>
              </div>

              {/* Caveat */}
              <p className="text-[10px] text-[#8F8278] italic leading-tight pt-1">
                {prediction.caveat}
              </p>
            </div>
          ) : (
            /* Empty placeholder state */
            <div className="p-8 rounded-3xl glass-panel border border-[#B9AA96]/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#B9AA96]/20 text-[#6B5E55] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-[#A88670]" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#332A24]">
                Awaiting Student Profile
              </h3>
              <p className="text-xs text-[#6B5E55] leading-relaxed">
                Complete the feature fields on the left or click one of the sample profile buttons above, then press <strong>Predict Final Grade</strong> to generate empirical estimates.
              </p>
              <div className="pt-2 flex flex-col gap-1.5 text-[11px] text-[#8F8278]">
                <span>✓ 33 Student lifestyle and demographic features</span>
                <span>✓ Verified scikit-learn & XGBoost pipeline</span>
                <span>✓ Automatically saved to prediction history</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
