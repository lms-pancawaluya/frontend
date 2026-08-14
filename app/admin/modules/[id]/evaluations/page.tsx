"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleEvaluations, createEvaluation } from "@/services/evaluation.service";

interface EvaluationItem {
  id: string;
  judul: string;
  _count: {
    questions: number;
  };
}

export default function ModuleEvaluationsPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);
    if (currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function loadEvaluations() {
      try {
        const data = await getModuleEvaluations(moduleId);
        setEvaluations(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat daftar evaluasi.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadEvaluations();
  }, [moduleId, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const newEvaluation = await createEvaluation(moduleId, newTitle);
      router.push(`/admin/modules/${moduleId}/evaluations/${newEvaluation.id}`);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal membuat evaluasi.");
      }
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <svg className="w-5 h-5 animate-spin text-emerald-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Memuat evaluasi...
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
            onClick={() => router.push(`/admin/modules/${moduleId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Detail Modul
          </button>
        </div>

        {/* Judul Halaman */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kelola Evaluasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola soal dan pengaturan evaluasi untuk modul ini.
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Tombol Tambah Evaluasi */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3 3l3-3-3-3M9 5v2m0 10v2" />
            </svg>
            Daftar Evaluasi
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-slate-800 transition shadow-sm"
            >
              + Buat Evaluasi
            </button>
          )}
        </div>

        {/* Form Buat Evaluasi */}
        {showForm && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">Buat Evaluasi Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Judul Evaluasi
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Evaluasi Modul Cageur"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {creating ? "Membuat..." : "Buat & Lanjut Tambah Soal"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Daftar Evaluasi */}
        {evaluations.length === 0 ? (
          !showForm && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <p className="text-sm text-slate-500">Belum ada evaluasi untuk modul ini.</p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            {evaluations.map((evaluasi) => (
              <div
                key={evaluasi.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {evaluasi.judul}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {evaluasi._count.questions} soal
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/modules/${moduleId}/evaluations/${evaluasi.id}`)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-sm transition"
                  >
                    Kelola
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Area Aksi Admin */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.488c.457-.66 1.245-.904 2.054-.65A17.267 17.267 0 0115 5.5c0 1.005-.2 2.001-.606 2.933A7.5 7.5 0 017 12.5a7.5 0 01-2 5.36l-2.744 2.744a1 1 0 01-1.415-.001l-.003-.003a1 1 0 01-.001-1.414l1.742-1.742A5.5 5.5 0 017.5 10.5c0-1.057.094-2.103.286-3.114z" />
            </svg>
            Aksi Pengelolaan
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/admin/modules/${moduleId}`)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl shadow-sm transition"
            >
              Edit Modul
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-2xl shadow-sm transition"
            >
              Buat Evaluasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
