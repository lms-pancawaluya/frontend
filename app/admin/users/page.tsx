"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUsers, deleteUser } from "@/services/user.service";

interface UserItem {
  id: string;
  nama: string;
  email: string;
  role: string;
  createdAt: string;
  modulSelesai: number;
  sekolah?: string;
  status?: string;
  kota?: string;
  daerah?: string;
}

const statusColor: Record<string, string> = {
  aktif: "bg-green-100 text-green-700",
  nonaktif: "bg-gray-100 text-gray-600",
  pensiun: "bg-amber-100 text-amber-700",
  wafat: "bg-red-100 text-red-700",
};

function normalizeRole(role?: string): string {
  return String(role || "").toLowerCase();
}

function isManagedStaff(role?: string): boolean {
  const r = normalizeRole(role);
  return r === "guru" || r === "pengajar";
}

function getRoleBadge(role?: string): { label: string; className: string } {
  const r = normalizeRole(role);
  if (r === "pengajar") return { label: "Pengajar", className: "bg-amber-100 text-amber-800" };
  if (r === "guru") return { label: "Guru", className: "bg-blue-100 text-blue-700" };
  return { label: role || "—", className: "bg-gray-100 text-gray-600" };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterKota, setFilterKota] = useState("");
  const [filterDaerah, setFilterDaerah] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [allSchools, setAllSchools] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allRegions, setAllRegions] = useState<string[]>([]);
  const hydratedFilters = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

    let active = true;

    async function fetchUsers() {
      try {
        setLoading(true);
        setError("");

        const filterPayload = {
          search: debouncedQuery,
          sekolah: filterSekolah,
          kota: filterKota,
          daerah: filterDaerah,
          status: filterStatus,
        };

        const data = await getUsers(filterPayload);
        if (!active) return;
        setUsers(data);

        if (!hydratedFilters.current) {
          const managedStaff = data.filter((u: UserItem) => isManagedStaff(u.role));
          const schools = Array.from(new Set(managedStaff.map((u: UserItem) => u.sekolah).filter(Boolean))) as string[];
          const cities = Array.from(new Set(managedStaff.map((u: UserItem) => u.kota).filter(Boolean))) as string[];
          const regions = Array.from(new Set(managedStaff.map((u: UserItem) => u.daerah).filter(Boolean))) as string[];
          setAllSchools(schools.sort());
          setAllCities(cities.sort());
          setAllRegions(regions.sort());
          hydratedFilters.current = true;
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat data pengguna.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      active = false;
    };
  }, [debouncedQuery, filterSekolah, filterKota, filterDaerah, filterStatus, router]);

  async function handleDelete(id: string, nama: string) {
    const confirmed = window.confirm(`Yakin ingin menghapus akun guru "${nama}"?`);
    if (!confirmed) return;

    setDeletingId(id);

    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal menghapus pengguna.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setFilterSekolah("");
    setFilterKota("");
    setFilterDaerah("");
    setFilterStatus("");
    setFilterRole("");
  };

  if (initialLoading) {
    return <p className="text-center mt-16 text-gray-500">Memuat data pengguna...</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const role = normalizeRole(u.role);
    if (!isManagedStaff(role)) return false;
    if (filterRole === "guru") return role === "guru";
    if (filterRole === "pengajar") return role === "pengajar";
    return true;
  });

  const roleLabel = filterRole === "guru" ? "Guru" : filterRole === "pengajar" ? "Pengajar" : "Guru/Pengajar";
  const emptyLabel = filterRole ? `${roleLabel} tidak ditemukan.` : "Guru/Pengajar tidak ditemukan.";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-2">
        Kelola Akun Guru
      </h1>
      <p className="text-gray-500 mb-8">Daftar guru dan pengajar terdaftar di sistem</p>

      <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm p-6 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Cari</label>
            <div className="relative w-full">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIP, atau email..."
                aria-label="Cari nama, NIP, atau email"
                className="w-full rounded-xl border border-[var(--color-border-soft)] bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:bg-white focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                  }}
                  aria-label="Bersihkan pencarian"
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-48 space-y-1.5">
            <label htmlFor="filter-status" className="text-xs font-bold text-slate-600">
              Filter Status
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-[var(--color-border-soft)] rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)]/15 transition-all text-gray-700"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="pensiun">Pensiun</option>
              <option value="wafat">Wafat</option>
            </select>
          </div>

          <div className="w-full md:w-48 space-y-1.5">
            <label htmlFor="filter-role" className="text-xs font-bold text-slate-600">
              Filter Role
            </label>
            <select
              id="filter-role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-[var(--color-border-soft)] rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)]/15 transition-all text-gray-700"
            >
              <option value="">Semua</option>
              <option value="guru">Guru</option>
              <option value="pengajar">Pengajar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="filter-kota" className="text-xs font-bold text-slate-600">
              Filter Kota/Kabupaten
            </label>
            <select
              id="filter-kota"
              value={filterKota}
              onChange={(e) => setFilterKota(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-[var(--color-border-soft)] rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)]/15 transition-all text-gray-700"
            >
              <option value="">Semua Kota/Kabupaten</option>
              {allCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-daerah" className="text-xs font-bold text-slate-600">
              Filter Daerah/Kecamatan
            </label>
            <select
              id="filter-daerah"
              value={filterDaerah}
              onChange={(e) => setFilterDaerah(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-[var(--color-border-soft)] rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)]/15 transition-all text-gray-700"
            >
              <option value="">Semua Daerah/Kecamatan</option>
              {allRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-sekolah" className="text-xs font-bold text-slate-600">
              Filter Sekolah
            </label>
            <select
              id="filter-sekolah"
              value={filterSekolah}
              onChange={(e) => setFilterSekolah(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-[var(--color-border-soft)] rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)]/15 transition-all text-gray-700"
            >
              <option value="">Semua Sekolah</option>
              {allSchools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || filterStatus || filterKota || filterDaerah || filterSekolah || filterRole) && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors px-4 py-2 border border-[var(--color-border-soft)] rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Bersihkan Filter & Pencarian
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-[var(--color-border-soft)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-pale)] border-b border-[var(--color-border-soft)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)] whitespace-nowrap">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)] whitespace-nowrap">Sekolah</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)] whitespace-nowrap">Email</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--color-navy)] whitespace-nowrap">Role</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--color-navy)] whitespace-nowrap">Status</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--color-navy)] whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleBadge(u.role);

                  return (
                    <tr key={u.id} className="border-b border-[var(--color-border-soft)] last:border-0">
                      <td className="px-4 py-3 text-gray-800">{u.nama}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {u.sekolah ? u.sekolah : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.status ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                              statusColor[u.status] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {u.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="text-sm border border-[var(--color-border-soft)] text-[var(--color-navy)] px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(u.id, u.nama)}
                            disabled={deletingId === u.id}
                            className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition disabled:text-gray-400 disabled:border-gray-200"
                          >
                            {deletingId === u.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
