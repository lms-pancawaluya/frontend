"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUsers } from "@/services/user.service";

interface GuruItem {
  id: string;
  nama: string;
  email: string;
  role: string;
  sekolah?: string;
  kotaKab?: string;
  kecamatan?: string;
  status?: string;
}

const statusColor: Record<string, string> = {
  aktif: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  nonaktif: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
  pensiun: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  wafat: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function PengajarGuruPage() {
  const router = useRouter();
  const [guru, setGuru] = useState<GuruItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(userData);
    if (currentUser?.role !== "pengajar") {
      router.push(currentUser?.role === "admin" ? "/admin" : "/dashboard");
      return;
    }

    async function fetchGuru() {
      try {
        // Backend auto-scopes GET /api/users to guru in the pengajar's school.
        // Do NOT add ?sekolah — scope is enforced server-side.
        const data = await getUsers();
        setGuru((data as GuruItem[]).filter((u) => u.role === "guru"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data guru.");
      } finally {
        setLoading(false);
      }
    }
    fetchGuru();
  }, [router]);

  if (loading) {
    return <p className="text-center mt-16 text-gray-500 dark:text-slate-400">Memuat data guru...</p>;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = normalizedQuery
    ? guru.filter(
        (g) =>
          g.nama.toLowerCase().includes(normalizedQuery) ||
          (g.email ?? "").toLowerCase().includes(normalizedQuery) ||
          (g.sekolah ?? "").toLowerCase().includes(normalizedQuery)
      )
    : guru;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-navy)] dark:text-slate-100">Kelola Guru</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Daftar guru binaan di sekolah Anda (otomatis sesuai lingkup akun Anda).</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      )}

      <div className="relative w-full sm:max-w-sm">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-slate-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, email, atau sekolah..."
          aria-label="Cari guru"
          className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/15 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Bersihkan pencarian"
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-sm dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-pale)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-[var(--color-navy)] dark:text-slate-200">Nama</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-[var(--color-navy)] dark:text-slate-200">Sekolah</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-[var(--color-navy)] dark:text-slate-200">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-navy)] dark:text-slate-200">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-navy)] dark:text-slate-200">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                    {guru.length === 0 ? "Belum ada guru dalam lingkup Anda." : "Guru tidak ditemukan."}
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="border-b border-[var(--color-border-soft)] last:border-0">
                    <td className="px-4 py-3 text-gray-800 dark:text-slate-200">{g.nama}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{g.sekolah || <span className="text-gray-400 dark:text-slate-500">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{g.email}</td>
                    <td className="px-4 py-3 text-center">
                      {g.status ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor[g.status] || "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                          {g.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/pengajar/guru/${g.id}`}
                        className="rounded-full border border-[var(--color-border-soft)] px-3 py-1.5 text-sm text-[var(--color-navy)] transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
