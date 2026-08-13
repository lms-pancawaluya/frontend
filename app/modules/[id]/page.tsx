"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleById } from "@/services/module.service";

interface ModuleDetail {
  kategori?: string;
  judul?: string;
  deskripsi?: string;
}

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadModule() {
      try {
        const data = await getModuleById(moduleId);
        setModuleData(data);
      } catch (err) {
        console.error("Gagal memuat rincian modul:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (moduleId) {
      loadModule();
    }
  }, [moduleId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <svg className="w-5 h-5 animate-spin text-emerald-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat Informasi Modul...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Tombol Navigasi Kembali */}
        <div>
          <button
            onClick={() => router.push("/modules")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Katalog Modul
          </button>
        </div>

        {/* Hero Banner Header Modul */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{moduleData?.kategori || "Aspek Panca Waluya"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {moduleData?.judul || "Modul Pembelajaran"}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              {moduleData?.deskripsi ||
                "Modul ini membahas tentang pembentukan kesemaptaan fisik yang lebih baik sehingga energi tersalurkan untuk mengoptimalkan ketahanan fisik, disertai penguatan mental spiritual yang mendorong tanggung jawab terhadap sesama, alam, dan Tuhan Yang Maha Kuasa."}
            </p>
          </div>
        </div>

        {/* Alur Pengerjaan Modul */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Alur Tahapan Pembelajaran Modul
            </h2>
            <span className="text-xs text-slate-400 font-medium">3 Tahapan Berurutan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tahap 1 */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                  Tahap 1
                </span>
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  Video Interaktif & Evaluasi
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Penayangan video pembelajaran tanpa percepatan serta penyelesaian evaluasi interaktif (batas kelulusan KKM ≥ 80%).
                </p>
              </div>
            </div>

            {/* Tahap 2 */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200/60">
                  Tahap 2
                </span>
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  Materi Bacaan Teks
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Pendalaman substansi materi berbasis teks akademik dan studi penerapan konkrit dalam lingkungan pembelajaran.
                </p>
              </div>
            </div>

            {/* Tahap 3 */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200/60">
                  Tahap 3
                </span>
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  Evaluasi Akhir & Umpan Balik
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Pengujian capaian pemahaman akhir melalui soal pilihan ganda serta penyampaian refleksi pengembangan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Utama */}
        <div>
          <button
            onClick={() => router.push(`/modules/${moduleId}/video`)}
            className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white px-6 py-3 rounded-full font-medium shadow-sm hover:opacity-90 transition"
              >
            <span>Mulai Pembelajaran Sekarang</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
