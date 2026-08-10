"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/services/checklist.service";

interface ChecklistItem {
  id: string;
  aspek: string;
  deskripsi: string;
  urutan: number;
  isActive: boolean;
  createdAt?: string;
}

const PANCAWALUYA_ASPECTS = [
  { key: "cageur", label: "Cageur", desc: "Sehat Fisik & Mental", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "bageur", label: "Bageur", desc: "Percaya Diri & Kolaborasi", badgeColor: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "bener", label: "Bener", desc: "Disiplin & Integritas", badgeColor: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "pinter", label: "Pinter", desc: "Tertib & Taat Norma", badgeColor: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: "singer", label: "Singer", desc: "Responsif & Kepemimpinan", badgeColor: "bg-rose-100 text-rose-800 border-rose-200" },
];

export default function AdminChecklistPage() {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal / Form state for adding item
  const [addingAspect, setAddingAspect] = useState<string | null>(null);
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [newUrutan, setNewUrutan] = useState<number>(1);

  // State for editing item
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [editUrutan, setEditUrutan] = useState<number>(1);

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

    fetchItems();
  }, [router]);

  async function fetchItems() {
    try {
      setLoading(true);
      const data = await getChecklistItems();
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal memuat item checklist.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdd(aspekKey: string) {
    const aspectItems = items.filter((i) => i.aspek.toLowerCase() === aspekKey.toLowerCase());
    const maxUrutan = aspectItems.reduce((max, i) => (i.urutan > max ? i.urutan : max), 0);
    setAddingAspect(aspekKey);
    setNewDeskripsi("");
    setNewUrutan(maxUrutan + 1);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addingAspect || !newDeskripsi.trim()) return;

    try {
      setSubmitting(true);
      await createChecklistItem({
        aspek: addingAspect,
        deskripsi: newDeskripsi.trim(),
        urutan: Number(newUrutan),
      });
      setAddingAspect(null);
      setNewDeskripsi("");
      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambah item checklist");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenEdit(item: ChecklistItem) {
    setEditingItem(item);
    setEditDeskripsi(item.deskripsi);
    setEditUrutan(item.urutan);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem || !editDeskripsi.trim()) return;

    try {
      setSubmitting(true);
      await updateChecklistItem(editingItem.id, {
        aspek: editingItem.aspek,
        deskripsi: editDeskripsi.trim(),
        urutan: Number(editUrutan),
        isActive: editingItem.isActive,
      });
      setEditingItem(null);
      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui item checklist");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(item: ChecklistItem) {
    try {
      await updateChecklistItem(item.id, {
        aspek: item.aspek,
        deskripsi: item.deskripsi,
        urutan: item.urutan,
        isActive: !item.isActive,
      });
      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status aktif");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus item checklist ini?")) return;

    try {
      await deleteChecklistItem(id);
      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus item checklist");
    }
  }

  if (loading) {
    return <p className="text-center mt-16 text-gray-500">Memuat item checklist...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-[var(--color-navy)] hover:underline font-medium">
              ← Kembali ke Admin Dashboard
            </Link>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)]">
            Kelola Item Checklist
          </h1>
          <p className="text-sm text-gray-500">
            Kelola template daftar periksa harian untuk guru berbasis 5 Nilai Pancawaluya
          </p>
        </div>

        <Link
          href="/admin/checklist/report"
          className="bg-[var(--color-navy)] text-white text-sm px-4 py-2 rounded-full font-medium hover:opacity-90 transition flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Lihat Laporan Konsistensi
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {PANCAWALUYA_ASPECTS.map((aspect) => {
          const aspectItems = items
            .filter((i) => i.aspek.toLowerCase() === aspect.key.toLowerCase())
            .sort((a, b) => a.urutan - b.urutan);

          return (
            <div
              key={aspect.key}
              className="bg-white border border-[var(--color-border-soft)] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-[var(--color-border-soft)]">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${aspect.badgeColor}`}>
                    {aspect.label}
                  </span>
                  <span className="text-xs text-gray-500">{aspect.desc}</span>
                </div>

                <button
                  onClick={() => handleOpenAdd(aspect.key)}
                  className="text-xs bg-[var(--color-pale)] hover:bg-[var(--color-accent)]/10 text-[var(--color-navy)] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] transition flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Item
                </button>
              </div>

              {/* Form Tambah Inline */}
              {addingAspect === aspect.key && (
                <form
                  onSubmit={handleCreateSubmit}
                  className="bg-[var(--color-pale)] p-4 rounded-xl mb-4 border border-[var(--color-border-soft)] space-y-3"
                >
                  <h4 className="text-xs font-semibold text-[var(--color-navy)] uppercase">
                    Tambah Item Baru ({aspect.label})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={newDeskripsi}
                        onChange={(e) => setNewDeskripsi(e.target.value)}
                        placeholder="Masukkan deskripsi aktivitas checklist..."
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={newUrutan}
                        onChange={(e) => setNewUrutan(Number(e.target.value))}
                        placeholder="Urutan"
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingAspect(null)}
                      className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="text-xs bg-[var(--color-navy)] text-white font-medium px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? "Menyimpan..." : "Simpan Item"}
                    </button>
                  </div>
                </form>
              )}

              {/* List Items */}
              {aspectItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center italic">
                  Belum ada item checklist untuk aspek {aspect.label}.
                </p>
              ) : (
                <div className="space-y-2">
                  {aspectItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 rounded-xl border transition ${
                        item.isActive ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200 opacity-70"
                      }`}
                    >
                      {editingItem?.id === item.id ? (
                        /* Edit Form Inline */
                        <form onSubmit={handleEditSubmit} className="w-full space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editDeskripsi}
                              onChange={(e) => setEditDeskripsi(e.target.value)}
                              className="flex-1 text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                              required
                            />
                            <input
                              type="number"
                              value={editUrutan}
                              onChange={(e) => setEditUrutan(Number(e.target.value))}
                              className="w-20 text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                              min="1"
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingItem(null)}
                              className="text-xs text-gray-500 px-2 py-1"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={submitting}
                              className="text-xs bg-[var(--color-navy)] text-white px-3 py-1 rounded-lg"
                            >
                              Simpan Perubahan
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Normal View Item */
                        <>
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md mt-0.5">
                              #{item.urutan}
                            </span>
                            <span className="text-sm text-gray-800 font-medium">
                              {item.deskripsi}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              }`}
                            >
                              {item.isActive ? "✅ Aktif" : "❌ Nonaktif"}
                            </button>

                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
                            >
                              Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
