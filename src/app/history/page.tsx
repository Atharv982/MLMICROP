"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  Trash2,
  Eye,
  AlertCircle,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { PaginatedPredictions, PredictionHistoryItem } from "@/types";
import { formatDate, formatGrade, getCategoryBadgeStyle } from "@/lib/utils";

export default function HistoryPage() {
  const [paginated, setPaginated] = useState<PaginatedPredictions | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PredictionHistoryItem | null>(null);

  const fetchHistory = (pageNumber: number) => {
    setLoading(true);
    setError(null);
    api
      .getPredictions(pageNumber, 10)
      .then((data) => {
        setPaginated(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load prediction history.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this prediction record?")) {
      return;
    }

    setDeletingId(id);
    try {
      await api.deletePrediction(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      fetchHistory(page);
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-semibold text-[#4E5B45] border border-[#84917A]/30">
          <History className="w-3.5 h-3.5 text-[#84917A]" />
          <span>Audit Log</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#332A24]">
          Prediction Audit History
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5E55] max-w-2xl font-light">
          Review predictions previously generated through the GradePilot API and persisted in SQLite.
        </p>
      </div>

      {/* Main Table / Container */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#B9AA96]/35 space-y-6">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#84917A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B5E55]">Querying SQLite prediction database...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3 text-[#933D25]">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={() => fetchHistory(page)}
              className="text-xs px-3 py-1.5 rounded-xl bg-[#332A24] text-[#FFFDF8]"
            >
              Retry
            </button>
          </div>
        ) : paginated && paginated.items.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#B9AA96]/20 flex items-center justify-center mx-auto text-[#6B5E55]">
              <History className="w-6 h-6 text-[#A88670]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#332A24]">
              No Predictions Saved Yet
            </h3>
            <p className="text-xs text-[#6B5E55] leading-relaxed">
              When you submit student profiles on the Analyze page, the predictions and input features are automatically persisted here for review.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#332A24] text-[#FFFDF8] text-xs font-medium hover:bg-[#473B33] transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Analyze a student now</span>
            </Link>
          </div>
        ) : (
          /* Table */
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#B9AA96]/30 text-[#8F8278]">
                    <th className="py-3 px-3 font-semibold">Timestamp</th>
                    <th className="py-3 px-3 font-semibold">Subject</th>
                    <th className="py-3 px-3 font-semibold">Mode</th>
                    <th className="py-3 px-3 font-semibold">Predicted Grade</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B9AA96]/15">
                  {paginated?.items.map((item) => {
                    const style = getCategoryBadgeStyle(item.performance_category);
                    return (
                      <tr key={item.id} className="hover:bg-[#FFFDF8]/70 transition-colors">
                        <td className="py-3 px-3 text-[#6B5E55] whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#332A24] capitalize">
                          {item.subject}
                        </td>
                        <td className="py-3 px-3 text-[#6B5E55]">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#B9AA96]/20 font-medium">
                            {item.prediction_mode === "early" ? "Early" : "Mid-Year"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-serif font-bold text-sm text-[#332A24]">
                          {formatGrade(item.predicted_grade)} / 20
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {item.performance_category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 rounded-lg hover:bg-[#84917A]/15 text-[#4E5B45] transition-colors"
                            title="View student input details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg hover:bg-[#C87961]/15 text-[#933D25] transition-colors disabled:opacity-50"
                            title="Delete prediction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {paginated && paginated.total_pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#B9AA96]/20 text-xs text-[#6B5E55]">
                <span>
                  Showing page {paginated.page} of {paginated.total_pages} ({paginated.total} records total)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-[#B9AA96]/30 hover:bg-[#FFFDF8] disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-[#332A24]">{page}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(paginated.total_pages, p + 1))}
                    disabled={page >= paginated.total_pages}
                    className="p-1.5 rounded-lg border border-[#B9AA96]/30 hover:bg-[#FFFDF8] disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#332A24]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FFFDF8] border border-[#B9AA96]/40 p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#B9AA96]/30">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#84917A] tracking-wider block">
                  Prediction Details
                </span>
                <h3 className="font-serif font-bold text-xl text-[#332A24]">
                  {selectedItem.subject.toUpperCase()} — {selectedItem.prediction_mode === "early" ? "Early Horizon" : "Mid-Year"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl hover:bg-[#B9AA96]/20 text-[#6B5E55] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Estimated Grade Card */}
            <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
              <span className="text-[11px] text-[#8F8278]">Predicted Final Grade</span>
              <div className="font-serif text-4xl font-bold text-[#332A24]">
                {formatGrade(selectedItem.predicted_grade)} / 20
              </div>
              <div className="text-xs font-semibold text-[#4E5B45]">
                {selectedItem.performance_category}
              </div>
            </div>

            {/* Input Features Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#332A24]">
                Recorded Student Features
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(selectedItem.input_features).map(([key, val]) => (
                  <div key={key} className="p-2 rounded-xl bg-[#F5F0E8] border border-[#B9AA96]/20">
                    <span className="text-[10px] text-[#8F8278] block truncate">{key}</span>
                    <span className="font-semibold text-[#332A24]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-[#332A24] text-[#FFFDF8] text-xs font-medium hover:bg-[#473B33] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
