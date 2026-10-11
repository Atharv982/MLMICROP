import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGrade(grade: number | undefined | null): string {
  if (grade === undefined || grade === null || isNaN(grade)) return "—";
  return grade.toFixed(1);
}

export function getCategoryBadgeStyle(category: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case "Excellent":
      return {
        bg: "bg-[#84917A]/15",
        text: "text-[#4E5B45]",
        border: "border-[#84917A]/40",
      };
    case "Good":
      return {
        bg: "bg-[#96A48D]/15",
        text: "text-[#586751]",
        border: "border-[#96A48D]/40",
      };
    case "Satisfactory":
      return {
        bg: "bg-[#B9AA96]/20",
        text: "text-[#6A5A4A]",
        border: "border-[#B9AA96]/50",
      };
    case "Sufficient":
      return {
        bg: "bg-[#D9C8B4]/25",
        text: "text-[#705F4F]",
        border: "border-[#D9C8B4]/60",
      };
    case "Failing / At Risk":
    default:
      return {
        bg: "bg-[#C87961]/15",
        text: "text-[#933D25]",
        border: "border-[#C87961]/40",
      };
  }
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
