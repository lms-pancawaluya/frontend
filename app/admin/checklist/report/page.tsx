"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsers, getUserProgress, getUserEvaluations } from "@/services/user.service";
import { getAllFeedbacks } from "@/services/evaluation.service";

interface UserItem {
  id: string;
  nama: string;
  email: string;
  role: string;
  createdAt: string;
  modulSelesai: number;
  status?: string;
}

interface ProgressData {
  totalModul: number;
  modulSelesai: number;
  persentase: number;
}

interface EvaluationItem {
  moduleId: string;
  moduleJudul: string;
  evaluationId: string;
  evaluationJudul: string;
  dikerjakan: boolean;
  skor: number | null;
  status: string;
}

interface UserEvaluations {
  userId: string;
  namaGuru: string;
  evaluations: EvaluationItem[];
}

interface FeedbackItem {
  id: string;
  saran: string;
  kritik: string;
  createdAt: string;
  user: {
    id: string;
    nama: string;
    email: string;
  };
  module: {
    id: string;
    judul: string;
  };
}

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(false);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [evaluatingUserIds, setEvaluatingUserIds] = useState<Set<string>>(new Set());
  const [evaluationData, setEvaluationData] = useState<Record<string, UserEvaluations>>({});
  const [evaluationErrors, setEvaluationErrors] = useState<Record<string, string>>({});

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [expandedFeedbackKeys, setExpandedFeedbackKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);

    if (currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function fetchUsers() {
      try {
        const data = await getUsers();
        const guruOnly = data.filter((u: UserItem) => u.role === "guru");
        setUsers(guruOnly);

        // Fetch progress for each guru
        setLoadingProgress(true);
        const progressEntries = await Promise.all(
          guruOnly.map(async (guru: UserItem) => {
            try {
              const prog = await getUserProgress(guru.id);
              return { userId: guru.id, progress: prog as ProgressData };
            } catch {
              return { userId: guru.id, progress: null };
            }
          })
        );

        const map: Record<string, ProgressData> = {};
        progressEntries.forEach((entry) => {
          if (entry.progress) {
            map[entry.userId] = entry.progress;
          }
        });
        setProgressMap(map);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat data monitoring.");
        }
      } finally {
        setLoading(false);
        setLoadingProgress(false);
      }
    }

    fetchUsers();

    async function fetchFeedbacks() {
      setFeedbackLoading(true);
      setFeedbackError("");
      try {
        const data = await getAllFeedbacks();
        setFeedbacks((data as FeedbackItem[]) ?? []);
      } catch (err) {
        setFeedbackError(
          err instanceof Error ? err.message : "Gagal memuat saran & kritik."
        );
      } finally {
        setFeedbackLoading(false);
      }
    }

    fetchFeedbacks();
  }, [router]);

  function toggleFeedback(userId: string, moduleId: string) {
    const key = `${userId}:${moduleId}`;
    setExpandedFeedbackKeys((prev) => {
      const copy = new Set(prev);
      if (copy.has(key)) {
        copy.delete(key);
      } else {
        copy.add(key);
      }
      return copy;
    });
  }

  async function toggleEvaluations(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    // Only allow one expanded at a time
    setExpandedUserId(userId);

    // Only fetch if not already loaded
    if (!evaluationData[userId]) {
      setEvaluatingUserIds((prev) => new Set([...prev, userId]));
      setEvaluationErrors((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });

      try {
        const data = await getUserEvaluations(userId);
        setEvaluationData((prev) => ({
          ...prev,
          [userId]: data as UserEvaluations,
        }));
      } catch (err) {
        setEvaluationErrors((prev) => ({
          ...prev,
          [userId]: err instanceof Error ? err.message : "Gagal memuat hasil evaluasi.",
        }));
      } finally {
        setEvaluatingUserIds((prev) => {
          const copy = new Set(prev);
          copy.delete(userId);
          return copy;
        });
      }
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
          Memuat data monitoring...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Tombol Navigasi Kembali */}
        <div>
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Dashboard Admin
          </button>
        </div>

        {/* Judul Halaman */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Pengerjaan Modul Guru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau progres pengerjaan modul dan hasil evaluasi tiap guru.
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Ringkasan Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Guru</span>
            <div className="text-2xl font-bold text-slate-900">{users.length} Guru</div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {loadingProgress ? "Memuat Progres..." : "Modul Selesai"}
            </span>
            <div className="text-2xl font-bold text-slate-900">
              {loadingProgress
                ? "—"
                : `${users.filter((u) => {
                    const prog = progressMap[u.id];
                    return prog && prog.modulSelesai >= prog.totalModul && prog.totalModul > 0;
                  }).length}/${users.length}`}
            </div>
          </div>
        </div>

        {/* Tabel Monitoring */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200/80">
                <tr>
                  <th className="text-center px-4 py-3 w-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Guru</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Modul Dikerjakan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((guru, index) => {
                  const prog = progressMap[guru.id];
                  const totalModul = prog?.totalModul ?? 0;
                  const modulSelesai = prog?.modulSelesai ?? 0;
                  const persentase = prog?.persentase ?? 0;
                  const pct = Math.min(100, Math.max(0, persentase));

                  let progressColor = "bg-emerald-500";
                  if (pct < 50) progressColor = "bg-rose-500";
                  else if (pct < 80) progressColor = "bg-amber-500";

                  const isExpanded = expandedUserId === guru.id;
                  const isEvaluationLoading = evaluatingUserIds.has(guru.id);
                  const evaluationError = evaluationErrors[guru.id];
                  const evaluations = evaluationData[guru.id]?.evaluations ?? [];

                  return (
                    <Fragment key={guru.id}>
                      <tr className={`hover:bg-slate-50/80 transition ${isExpanded ? "bg-slate-50/60" : ""}`}>
                        <td className="text-center px-4 py-3 font-semibold text-slate-400 text-xs">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {guru.nama}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-700">
                          {prog ? `${modulSelesai}/${totalModul} modul` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 w-10 text-right">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleEvaluations(guru.id)}
                            className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition"
                          >
                            {isEvaluationLoading ? "Memuat..." : isExpanded ? "Tutup" : "Hasil Evaluasi"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50/70 p-0">
                            <div className="px-4 py-5 sm:px-6">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                                <h3 className="mb-4 text-sm font-bold text-slate-900">
                                  Hasil Evaluasi — {evaluationData[guru.id]?.namaGuru || guru.nama}
                                </h3>

                                {evaluationError ? (
                                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {evaluationError}
                                  </div>
                                ) : isEvaluationLoading ? (
                                  <div className="py-6 text-center text-sm text-slate-500">
                                    Memuat hasil evaluasi...
                                  </div>
                                ) : evaluations.length === 0 ? (
                                  <p className="text-sm text-slate-500">
                                    Belum ada data hasil evaluasi untuk guru ini.
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    {evaluations.map((ev) => {
                                      const feedbackKey = `${guru.id}:${ev.moduleId}`;
                                      const isFeedbackExpanded = expandedFeedbackKeys.has(feedbackKey);
                                      const moduleFeedback = feedbacks.find(
                                        (fb) => fb.user?.id === guru.id && fb.module?.id === ev.moduleId
                                      );

                                      return (
                                      <div
                                        key={ev.evaluationId}
                                        className="rounded-xl border border-slate-200 p-4"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-bold text-slate-800">
                                              {ev.moduleJudul}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                              {ev.evaluationJudul}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-500">
                                              {ev.dikerjakan ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                  Sudah dikerjakan
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1.5">
                                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                  Belum dikerjakan
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          {ev.dikerjakan && ev.skor !== null && (
                                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                              Skor: {ev.skor}%
                                            </span>
                                          )}
                                        </div>

                                        {ev.dikerjakan && (
                                          <div className="mt-3 border-t border-slate-100 pt-3">
                                            <button
                                              onClick={() => toggleFeedback(guru.id, ev.moduleId)}
                                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
                                              aria-expanded={isFeedbackExpanded}
                                            >
                                              <svg
                                                className={`w-3.5 h-3.5 transition-transform ${isFeedbackExpanded ? "rotate-90" : ""}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                              </svg>
                                              Saran &amp; Kritik
                                            </button>

                                            {isFeedbackExpanded && (
                                              <div className="mt-3">
                                                {feedbackLoading ? (
                                                  <p className="text-xs text-slate-400">Memuat saran &amp; kritik...</p>
                                                ) : feedbackError ? (
                                                  <p className="text-xs text-rose-500">{feedbackError}</p>
                                                ) : moduleFeedback ? (
                                                  <div className="space-y-2.5">
                                                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Saran</p>
                                                      <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
                                                        {moduleFeedback.saran || "—"}
                                                      </p>
                                                    </div>
                                                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Kritik</p>
                                                      <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
                                                        {moduleFeedback.kritik || "—"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <p className="text-xs italic text-slate-400">Belum ada saran &amp; kritik</p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-6 sm:p-8 text-center">
              <p className="text-sm text-slate-500">Belum ada guru terdaftar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
