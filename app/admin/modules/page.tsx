"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getModules, deleteModule } from "@/services/module.service";

interface Module {
  id: string;
  judul: string;
  deskripsi: string;
  aspekPancawaluya: string;
  urutan: number;
  _count: {
    contents: number;
    evaluations: number;
  };
}

const aspekColor: Record<string, string> = {
  cageur: "bg-green-100 text-green-700",
  bageur: "bg-blue-100 text-blue-700",
  bener: "bg-yellow-100 text-yellow-700",
  pinter: "bg-purple-100 text-purple-700",
  singer: "bg-red-100 text-red-700",
};

export default function AdminModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);
    if (currentUser?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function fetchModules() {
      try {
        const data = await getModules();
        setModules(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat daftar modul.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, [router]);

  async function handleDelete(id: string, judul: string) {
    const confirmed = window.confirm(`Yakin ingin menghapus modul "${judul}"?`);
    if (!confirmed) return;

    setDeletingId(id);

    try {
      await deleteModule(id);
      setModules((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal menghapus modul.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="text-center mt-16 text-gray-500">Memuat daftar modul...</p>;
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)]">
          Kelola Modul
        </h1>
        <Link
          href="/admin/modules/new"
          className="bg-[var(--color-navy)] text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition"
        >
          + Tambah Modul
        </Link>
      </div>

      {modules.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">Belum ada modul tersedia.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {modules
            .sort((a, b) => a.urutan - b.urutan)
            .map((mod) => (
              <div
                key={mod.id}
                className="border border-[var(--color-border-soft)] rounded-2xl p-5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md transition"
              >
                <Link
                  href={`/modules/${mod.id}`}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">#{mod.urutan}</span>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        aspekColor[mod.aspekPancawaluya] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {mod.aspekPancawaluya}
                    </span>
                  </div>
                  <p className="font-medium text-[var(--color-navy)] truncate">{mod.judul}</p>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{mod.deskripsi}</p>
                  <div className="text-xs text-gray-400 flex gap-3 mt-1">
                    <span>{mod._count.contents} konten</span>
                    <span>{mod._count.evaluations} evaluasi</span>
                  </div>
                </Link>

                <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/admin/modules/${mod.id}`}
                    className="text-sm border border-[var(--color-border-soft)] text-[var(--color-navy)] px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(mod.id, mod.judul)}
                    disabled={deletingId === mod.id}
                    className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition disabled:text-gray-400 disabled:border-gray-200"
                  >
                    {deletingId === mod.id ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}