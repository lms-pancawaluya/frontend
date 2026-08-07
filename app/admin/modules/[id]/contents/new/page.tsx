"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createContent } from "@/services/content.service";

export default function NewContentPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [formData, setFormData] = useState({
    judul: "",
    tipe: "teks",
    konten: "",
    urutan: 1,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      await createContent(moduleId, formData);
      router.push(`/admin/modules/${moduleId}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal menambahkan konten.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        onClick={() => router.push(`/admin/modules/${moduleId}`)}
        className="text-sm text-blue-600 hover:underline mb-6"
      >
        ← Kembali ke edit modul
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tambah Konten Baru</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Judul Konten</label>
          <input
            type="text"
            name="judul"
            value={formData.judul}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Pengantar Konsep Bageur"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipe Konten</label>
          <select
            name="tipe"
            value={formData.tipe}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="teks">Teks</option>
            <option value="video">Video (YouTube)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {formData.tipe === "video" ? "Link Video YouTube" : "Isi Konten"}
          </label>
          <textarea
            name="konten"
            value={formData.konten}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={formData.tipe === "video" ? 2 : 6}
            placeholder={
              formData.tipe === "video"
                ? "https://youtu.be/..."
                : "Tulis isi materi pembelajaran di sini..."
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Urutan</label>
          <input
            type="number"
            name="urutan"
            value={formData.urutan}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            min={1}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400 mt-2"
        >
          {loading ? "Menyimpan..." : "Simpan Konten"}
        </button>
      </form>
    </div>
  );
}