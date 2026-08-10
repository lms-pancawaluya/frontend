"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getModules, deleteModule } from "@/services/module.service";

interface Module {
  id: string;
  judul: string;
  aspekPancawaluya: string;
  urutan: number;
  _count: {
    contents: number;
    evaluations: number;
  };
}

export default function AdminModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    loadModules();
  }, [router]);

  async function loadModules() {
    try {
      const data = await getModules();
      setModules(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal memuat data modul.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, judul: string) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus modul "${judul}"? Tindakan ini tidak bisa dibatalkan.`
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await deleteModule(id);
      setModules((prev) => prev.filter((mod) => mod.id !== id));
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
  return <p className="text-center mt-16 text-gray-500">Memuat data modul...</p>;
}

return (
  <div className="max-w-5xl mx-auto p-6">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-1">
          Kelola Modul
        </h1>
        <p className="text-gray-500">Kelola modul pembelajaran Pancawaluya</p>
      </div>
      <Link
        href="/admin/modules/new"
        className="bg-[var(--color-navy)] text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition"
      >
        + Tambah Modul
      </Link>
    </div>

    {error && (
      <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200 mb-4">
        {error}
      </div>
    )}

    <div className="bg-white border border-[var(--color-border-soft)] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-pale)] border-b border-[var(--color-border-soft)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Urutan</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Judul</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Aspek</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Konten</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-navy)]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.id} className="border-b border-[var(--color-border-soft)] last:border-0">
                <td className="px-4 py-3 text-gray-600">{mod.urutan}</td>
                <td className="px-4 py-3 text-gray-800">{mod.judul}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">
                  {mod.aspekPancawaluya}
                </td>
                <td className="px-4 py-3 text-gray-600">{mod._count.contents}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    href={`/admin/modules/${mod.id}`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(mod.id, mod.judul)}
                    disabled={deletingId === mod.id}
                    className="text-red-600 hover:underline disabled:text-gray-400"
                  >
                    {deletingId === mod.id ? "Menghapus..." : "Hapus"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {modules.length === 0 && (
          <p className="text-center text-gray-500 py-8">Belum ada modul.</p>
        )}
      </div>
    </div>
  </div>
);
}