"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Sparkles,
  BarChart3,
  FlaskConical,
  History,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: Sparkles },
  { label: "Analyze", href: "/analyze", icon: GraduationCap },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Model Lab", href: "/model-lab", icon: FlaskConical },
  { label: "History", href: "/history", icon: History },
];

export function Navbar() {
  const pathname = usePathname();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getHealth()
      .then((data) => {
        if (isMounted) setIsBackendHealthy(data.status === "healthy");
      })
      .catch(() => {
        if (isMounted) setIsBackendHealthy(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#B9AA96]/30 bg-[#FFFDF8]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#84917A]/15 border border-[#84917A]/30 flex items-center justify-center text-[#4E5B45] group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl font-bold tracking-tight text-[#332A24]">
                GradePilot
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#A88670]/15 text-[#A88670] border border-[#A88670]/30 tracking-wider">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#6B5E55] -mt-0.5 hidden sm:block">
              Secondary Academic Analytics & ML Estimation
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#84917A]/15 text-[#332A24] font-semibold border border-[#84917A]/35 shadow-sm"
                    : "text-[#6B5E55] hover:text-[#332A24] hover:bg-[#B9AA96]/15"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#4E5B45]" : "text-[#8F8278]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Backend Status indicator */}
        <div className="hidden md:flex items-center">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isBackendHealthy === true
                ? "bg-[#84917A]/15 text-[#4E5B45] border-[#84917A]/30"
                : isBackendHealthy === false
                ? "bg-[#C87961]/15 text-[#933D25] border-[#C87961]/35"
                : "bg-[#B9AA96]/15 text-[#6B5E55] border-[#B9AA96]/30"
            }`}
            title={
              isBackendHealthy === true
                ? "FastAPI server live and model loaded"
                : "Backend server offline or unreachable"
            }
          >
            {isBackendHealthy === true ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#84917A] animate-pulse" />
                <span>ML Engine Active</span>
              </>
            ) : isBackendHealthy === false ? (
              <>
                <AlertCircle className="w-3 h-3 text-[#933D25]" />
                <span>API Offline</span>
              </>
            ) : (
              <>
                <Activity className="w-3 h-3 text-[#8F8278] animate-spin" />
                <span>Connecting...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
