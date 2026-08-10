"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getChecklistReport } from "@/services/checklist.service";

interface TeacherReport {
  id: string;
  nama: string;
  email: string;
  hariAktif: number;
  totalHari: number;
  persentaseKonsistensi: number;
}

interface ReportData {
  periodeHari: number;
  totalGuru: number;
  report: TeacherReport[];
}

export default function AdminChecklistReportPage() {
  const router = useRouter();
  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<"konsistensi" | "nama">("konsistensi");

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

    async function fetchReport(periodDays: number) {
      try {
        setLoading(true);
        setError("");
        const result = await getChecklistReport(periodDays);
        setData(result);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat laporan konsistensi.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchReport(days);
  }, [router, days]);

  const sortedReport = data?.report ? [...data.report].sort((a, b) => {
    if (sortBy === "konsistensi") {
      return b.persentaseKonsistensi - a.persentaseKonsistensi;
    }
    return a.nama.localeCompare(b.nama);
  }) : [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/checklist" className="text-xs text-[var(--color-navy)] hover:underline font-medium">
              ← Kembali ke Kelola Checklist
            </Link>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)]">
            Laporan Konsistensi Checklist
          </h1>
          <p className="text-sm text-gray-500">
            Rekapitulasi tingkat konsistensi pengisian daily checklist oleh Guru
          </p>
        </div>

        {/* Filter Periode */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200">
          <button
            onClick={() => setDays(7)}
            className={`text-xs font-semibold px-4 py-1.5 rounded-full transition ${
              days === 7
                ? "bg-[var(--color-navy)] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setDays(30)}
            className={`text-xs font-semibold px-4 py-1.5 rounded-full transition ${
              days === 30
                ? "bg-[var(--color-navy)] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 mb-6">
          {error}
        </div>
      )}

      {/* Ringkasan Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[var(--color-border-soft)] p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Periode Pengamatan</span>
          <div className="text-2xl font-bold text-[var(--color-navy)] mt-1">{days} Hari</div>
        </div>
        <div className="bg-white border border-[var(--color-border-soft)] p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Guru Terdaftar</span>
          <div className="text-2xl font-bold text-[var(--color-navy)] mt-1">{data?.totalGuru ?? 0} Guru</div>
        </div>
      </div>

      {/* Control Sorting & Header Tabel */}
      <div className="bg-white border border-[var(--color-border-soft)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border-soft)] flex justify-between items-center bg-[var(--color-pale)]">
          <h3 className="font-medium text-sm text-[var(--color-navy)]">
            Daftar Konsistensi Guru ({sortedReport.length})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "konsistensi" | "nama")}
              className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-700 focus:outline-none"
            >
              <option value="konsistensi">Konsistensi Tertinggi</option>
              <option value="nama">Nama Guru (A-Z)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-12 text-sm text-gray-400">Memuat laporan konsistensi...</p>
        ) : sortedReport.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">Belum ada data konsistensi guru.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-100">
                <tr>
                  <th className="text-center px-4 py-3 w-12">#</th>
                  <th className="text-left px-4 py-3">Nama Guru</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-center px-4 py-3">Hari Aktif</th>
                  <th className="text-left px-4 py-3 w-64">Konsistensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedReport.map((guru, index) => {
                  const pct = Math.min(100, Math.max(0, guru.persentaseKonsistensi));
                  
                  // Color spectrum based on percentage
                  let progressColor = "bg-emerald-500";
                  if (pct < 50) progressColor = "bg-rose-500";
                  else if (pct < 80) progressColor = "bg-amber-500";

                  return (
                    <tr key={guru.id} className="hover:bg-gray-50/80 transition">
                      <td className="text-center px-4 py-3 font-semibold text-gray-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--color-navy)]">
                        {guru.nama}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {guru.email}
                      </td>
                      <td className="text-center px-4 py-3 font-medium text-gray-700">
                        <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full border border-gray-200">
                          {guru.hariAktif}/{guru.totalHari} hari
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div
                              className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
