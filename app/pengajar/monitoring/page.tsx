"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsers, getMonitoringUserProgress, getMonitoringUserEvaluations } from "@/services/user.service";
import { getStageLabel } from "@/types/evaluation";

interface GuruItem {
  id: string;
  nama: string;
  email: string;
  role: string;
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
  tipe?: string;
  dikerjakan: boolean;
  skor: number | null;
  status: string;
}

interface UserEvaluations {
  userId: string;
  namaGuru: string;
  evaluations: EvaluationItem[];
}

export default function PengajarMonitoringPage() {
  const router = useRouter();
  const [users, setUsers] = useState<GuruItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [evaluatingUserIds, setEvaluatingUserIds] = useState<Set<string>>(new Set());
  const [evaluationData, setEvaluationData] = useState<Record<string, UserEvaluations>>({});
  const [evaluationErrors, setEvaluationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(userData);
    if (currentUser.role !== "pengajar") {
      router.push(currentUser.role === "admin" ? "/admin" : "/dashboard");
      return;
    }

    async function fetchUsers() {
      try {
        const data = await getUsers();
        const guruOnly = (data as GuruItem[]).filter((u) => u.role === "guru");
        setUsers(guruOnly);

        setLoadingProgress(true);
        const entries = await Promise.all(
          guruOnly.map(async (guru) => {
            try {
              const prog = await getMonitoringUserProgress(guru.id);
              return { userId: guru.id, progress: prog as ProgressData };
            } catch {
              return { userId: guru.id, progress: null };
            }
          })
        );
        const map: Record<string, ProgressData> = {};
        entries.forEach((e) => {
          if (e.progress) map[e.userId] = e.progress;
        });
        setProgressMap(map);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data monitoring.");
      } finally {
        setLoading(false);
        setLoadingProgress(false);
      }
    }
    fetchUsers();
  }, [router]);

  async function toggleEvaluations(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);

    if (!evaluationData[userId]) {
      setEvaluatingUserIds((prev) => new Set([...prev, userId]));
      setEvaluationErrors((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      try {
        const data = await getMonitoringUserEvaluations(userId);
        setEvaluationData((prev) => ({ ...prev, [userId]: data as UserEvaluations }));
      } catch (err) {
        setEvaluationErrors((prev) => ({
          ...prev,
          [userId]: err instanceof Error ? err.message : "Gagal memuat hasil asesmen.",
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
    return <p className="text-center mt-16 text-gray-500">Memuat data monitoring...</p>;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = normalizedQuery ? users.filter((g) => g.nama.toLowerCase().includes(normalizedQuery)) : users;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-navy)]">
          Monitoring Pengerjaan Modul
        </h1>
        <p className="mt-1 text-sm text-gray-500">Pantau progres pengerjaan modul dan hasil Pre-Test/Post-Test tiap guru binaan.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1 rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Guru</span>
          <div className="text-2xl font-bold text-[var(--color-navy)]">{users.length} Guru</div>
        </div>
        <div className="space-y-1 rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {loadingProgress ? "Memuat Progres..." : "Modul Tuntas"}
          </span>
          <div className="text-2xl font-bold text-[var(--color-navy)]">
            {loadingProgress
              ? "—"
              : `${users.filter((u) => {
                  const p = progressMap[u.id];
                  return p && p.totalModul > 0 && p.modulSelesai >= p.totalModul;
                }).length}/${users.length}`}
          </div>
        </div>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama guru..."
          aria-label="Cari nama guru"
          className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/15"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-pale)]">
              <tr>
                <th className="w-12 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Guru</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Modul</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Progress</th>
                <th className="w-28 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-soft)]">
              {filteredUsers.map((guru, index) => {
                const prog = progressMap[guru.id];
                const pct = Math.min(100, Math.max(0, prog?.persentase ?? 0));
                let progressColor = "bg-emerald-500";
                if (pct < 50) progressColor = "bg-rose-500";
                else if (pct < 80) progressColor = "bg-amber-500";

                const isExpanded = expandedUserId === guru.id;
                const isEvalLoading = evaluatingUserIds.has(guru.id);
                const evalError = evaluationErrors[guru.id];
                const evaluations = evaluationData[guru.id]?.evaluations ?? [];

                return (
                  <Fragment key={guru.id}>
                    <tr className={`transition hover:bg-slate-50/80 ${isExpanded ? "bg-slate-50/60" : ""}`}>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-[var(--color-navy)]">{guru.nama}</td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {prog ? `${prog.modulSelesai}/${prog.totalModul}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-3 flex-1 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            <div className={`h-full rounded-full ${progressColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-xs font-bold text-gray-700">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleEvaluations(guru.id)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-slate-50"
                        >
                          {isEvalLoading ? "Memuat..." : isExpanded ? "Tutup" : "Hasil Pre-Test/Post-Test"}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/70 p-0">
                          <div className="px-4 py-5 sm:px-6">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                              <h3 className="mb-4 text-sm font-bold text-[var(--color-navy)]">
                                Hasil Pre-Test/Post-Test — {evaluationData[guru.id]?.namaGuru || guru.nama}
                              </h3>
                              {evalError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{evalError}</div>
                              ) : isEvalLoading ? (
                                <div className="py-6 text-center text-sm text-gray-500">Memuat hasil asesmen...</div>
                              ) : evaluations.length === 0 ? (
                                <p className="text-sm text-gray-500">Belum ada data hasil asesmen untuk guru ini.</p>
                              ) : (
                                <div className="space-y-3">
                                  {evaluations.map((ev) => (
                                    <div key={ev.evaluationId} className="rounded-xl border border-slate-200 p-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-bold text-slate-800">{ev.moduleJudul}</p>
                                          <p className="mt-0.5 text-xs text-gray-500">{getStageLabel(ev.tipe)} · {ev.evaluationJudul}</p>
                                          <p className="mt-2 text-xs text-gray-500">
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
                                    </div>
                                  ))}
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
          <div className="p-6 text-center sm:p-8">
            <p className="text-sm text-gray-500">Belum ada guru dalam lingkup Anda.</p>
          </div>
        )}
        {users.length > 0 && filteredUsers.length === 0 && (
          <div className="p-6 text-center sm:p-8">
            <p className="text-sm text-gray-500">Guru tidak ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
