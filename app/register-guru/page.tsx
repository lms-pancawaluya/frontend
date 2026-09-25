"use client";

import { useRouter } from "next/navigation";
import RegisterGuruForm from "../components/RegisterGuruForm";
import { useApp } from "@/app/context/AppContext";

export default function RegisterGuruPage() {
  const router = useRouter();
  const { t } = useApp();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col justify-between leading-normal relative overflow-hidden py-10 px-4 dark:bg-slate-900/70 dark:text-slate-200">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#419AD6]/15 rounded-full blur-3xl" />
        <div className="absolute top-2/3 -left-16 w-80 h-80 bg-[#F3BF10]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0047A5] transition-colors dark:text-slate-300 dark:hover:text-blue-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{t("Kembali", "Back")}</span>
          </button>

          <span className="text-xs font-semibold text-[#109B51] bg-[#109B51]/10 border border-[#109B51]/20 px-3 py-1 rounded-full">
            {t("Portal LMS Guru SMA", "High School Teacher LMS Portal")}
          </span>
        </div>

        <RegisterGuruForm />
      </div>
    </div>
  );
}
