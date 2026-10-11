import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "GradePilot — Secondary Academic Analytics & ML Estimation",
  description:
    "GradePilot estimates student academic performance from student-related, lifestyle, study, and attendance features using genuine machine learning models trained on the UCI Student Performance dataset.",
  keywords: [
    "GradePilot",
    "Machine Learning",
    "Education Analytics",
    "Student Performance",
    "UCI Dataset",
    "Academic Forecasting",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F5F0E8] text-[#332A24] antialiased selection:bg-[#84917A]/25 selection:text-[#332A24]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
