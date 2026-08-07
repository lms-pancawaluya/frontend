"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getModuleEvaluations, createEvaluation } from "@/services/evaluation.service";

interface EvaluationItem {
  id: string;
  judul: string;
  _count: {
    questions: number;
  };
}

export default function ModuleEvaluationsPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, [moduleId]);

  async function loadEvaluations() {
    try {
      const data = await getModuleEvaluations(moduleId);
      setEvaluations(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal memuat daftar evaluasi.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const newEvaluation = await createEvaluation(moduleId, newTitle);
      router.push(`/admin/evaluations/${newEvaluation.id}`);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal membuat evaluasi.");
      }
      setCreating(false);
    }
  }

  if (loading) {
    return <p className="text-center mt-16">Memuat evaluasi...</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        onClick={() => router.push(`/admin/modules/${moduleId}`)}
        className="text-sm text-blue-600 hover:underline mb-6"
      >
        ← Kembali ke edit modul
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kelola Evaluasi</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
          >
            + Buat Evaluasi
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-3"
        >
          <label className="text-sm font-medium">Judul Evaluasi</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Evaluasi Modul Bageur"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {creating ? "Membuat..." : "Buat & Lanjut Tambah Soal"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 text-sm hover:underline"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {evaluations.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada evaluasi untuk modul ini.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {evaluations.map((evaluasi) => (
            <Link
              key={evaluasi.id}
              href={`/admin/evaluations/${evaluasi.id}`}
              className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{evaluasi.judul}</p>
                <span className="text-xs text-gray-400">
                  {evaluasi._count.questions} soal
                </span>
              </div>
              <span className="text-blue-600 text-sm">Kelola →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}