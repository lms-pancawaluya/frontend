"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getModuleById, updateModule, getModuleContents } from "@/services/module.service";
import { deleteContent } from "@/services/content.service";

const aspekOptions = ["cageur", "bageur", "bener", "pinter", "singer"];

interface ContentItem {
  id: string;
  judul: string;
  tipe: string;
  konten: string;
  urutan: number;
}

export default function EditModulePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
    urutan: 1,
  });

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [moduleData, contentsData] = await Promise.all([
          getModuleById(id),
          getModuleContents(id),
        ]);

        setFormData({
          judul: moduleData.judul,
          deskripsi: moduleData.deskripsi,
          aspekPancawaluya: moduleData.aspekPancawaluya,
          urutan: moduleData.urutan,
        });

        setContents(contentsData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat data modul.");
        }
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "urutan" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateModule(id, formData);
      router.push("/admin/modules");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal memperbarui modul.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContent(contentId: string, judul: string) {
    const confirmed = window.confirm(`Yakin ingin menghapus konten "${judul}"?`);
    if (!confirmed) return;

    setDeletingId(contentId);

    try {
      await deleteContent(contentId);
      setContents((prev) => prev.filter((c) => c.id !== contentId));
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal menghapus konten.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loadingData) {
  return <p className="text-center mt-16 text-gray-500">Memuat data modul...</p>;
}

return (
  <div className="max-w-xl mx-auto p-6">
    <button
      onClick={() => router.push("/admin/modules")}
      className="text-sm text-[var(--color-accent)] hover:underline mb-6"
    >
      ← Kembali ke daftar modul
    </button>

    <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-6">
      Edit Modul
    </h1>

    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-10">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Judul Modul</label>
        <input
          type="text"
          name="judul"
          value={formData.judul}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Deskripsi</label>
        <textarea
          name="deskripsi"
          value={formData.deskripsi}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Aspek Pancawaluya</label>
        <select
          name="aspekPancawaluya"
          value={formData.aspekPancawaluya}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 capitalize focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        >
          {aspekOptions.map((aspek) => (
            <option key={aspek} value={aspek} className="capitalize">
              {aspek}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Urutan</label>
        <input
          type="number"
          name="urutan"
          value={formData.urutan}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          min={1}
          required
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400 mt-2"
      >
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>

    <div className="border-t border-[var(--color-border-soft)] pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-[var(--color-navy)]">Konten Pembelajaran</h2>
        <Link
          href={`/admin/modules/${id}/contents/new`}
          className="text-sm bg-[var(--color-navy)] text-white px-3 py-1.5 rounded-full hover:opacity-90 transition"
        >
          + Tambah Konten
        </Link>
      </div>

      {contents.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada konten untuk modul ini.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {contents
            .sort((a, b) => a.urutan - b.urutan)
            .map((content) => (
              <div
                key={content.id}
                className="border border-[var(--color-border-soft)] rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {content.judul}
                  </p>
                  <span className="text-xs text-gray-400 capitalize">
                    {content.tipe} • urutan {content.urutan}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteContent(content.id, content.judul)}
                  disabled={deletingId === content.id}
                  className="text-red-600 text-sm hover:underline disabled:text-gray-400"
                >
                  {deletingId === content.id ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  </div>
);
}