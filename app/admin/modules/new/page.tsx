"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createModule } from "@/services/module.service";

const aspekOptions = ["cageur", "bageur", "bener", "pinter", "singer"];

export default function NewModulePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
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
      await createModule(formData);
      router.push("/admin/modules");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal menambahkan modul.");
      }
    } finally {
      setLoading(false);
    }
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
      Tambah Modul Baru
    </h1>

    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="Modul Bageur - Percaya Diri & Kolaborasi"
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
          placeholder="Jelaskan isi modul ini secara singkat..."
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
        disabled={loading}
        className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400 mt-2"
      >
        {loading ? "Menyimpan..." : "Simpan Modul"}
      </button>
    </form>
  </div>
);
}