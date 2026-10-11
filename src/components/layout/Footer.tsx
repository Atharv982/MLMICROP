"use client";

import Link from "next/link";
import { BookOpen, ShieldAlert, ExternalLink, GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#B9AA96]/30 bg-[#FFFDF8]/70 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#84917A]/15 border border-[#84917A]/30 flex items-center justify-center text-[#4E5B45]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-lg text-[#332A24]">GradePilot</span>
            </div>
            <p className="text-xs text-[#6B5E55] leading-relaxed mb-3">
              GradePilot is an educational analytics system designed to estimate secondary academic performance (final grade G3 on a 0–20 scale) based on student demographics, study habits, and lifestyle factors.
            </p>
            <p className="text-[11px] text-[#8F8278]">
              Trained on 1,044 secondary student records from the Alentejo region of Portugal.
            </p>
          </div>

          {/* Column 2: Dataset Attribution */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#332A24] mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#A88670]" />
              Dataset & Methodology
            </h4>
            <p className="text-xs text-[#6B5E55] leading-relaxed mb-3">
              Based on the official <strong className="text-[#332A24]">UCI Student Performance Data Set</strong>:
            </p>
            <blockquote className="text-[11px] text-[#6B5E55] pl-2.5 border-l-2 border-[#B9AA96] italic mb-3">
              P. Cortez and A. Silva. Using Data Mining to Predict Secondary School Student Performance. In A. Brito and J. Teixeira Eds., Proceedings of 5th FUture BUsiness TEChnology Conference (FUBUTEC 2008) pp. 5-12, Porto, Portugal.
            </blockquote>
            <a
              href="https://archive.ics.uci.edu/dataset/320/student+performance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#4E5B45] hover:text-[#332A24] font-medium transition-colors"
            >
              <span>UCI Machine Learning Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Column 3: Ethical Disclaimer */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#332A24] mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#C87961]" />
              Ethical Educational Disclaimer
            </h4>
            <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[#B9AA96]/35 text-xs text-[#6B5E55] leading-relaxed">
              <p className="mb-2">
                This application is strictly an educational research demonstration.
              </p>
              <p className="text-[11px] text-[#8F8278]">
                ML estimates reflect historical population correlations and do <strong>not</strong> label individual student ability or dictate potential. Academic success depends on individualized mentorship, motivation, and growth.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#B9AA96]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F8278]">
          <p>© 2026 GradePilot. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="hover:text-[#332A24] transition-colors">Overview</Link>
            <Link href="/analyze" className="hover:text-[#332A24] transition-colors">Analyze</Link>
            <Link href="/insights" className="hover:text-[#332A24] transition-colors">Insights</Link>
            <Link href="/model-lab" className="hover:text-[#332A24] transition-colors">Model Lab</Link>
            <Link href="/history" className="hover:text-[#332A24] transition-colors">History</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
