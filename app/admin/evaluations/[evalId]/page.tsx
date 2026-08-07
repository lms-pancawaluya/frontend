"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvaluationDetail, addQuestion } from "@/services/evaluation.service";

interface Option {
  id: string;
  teksOpsi: string;
}

interface Question {
  id: string;
  pertanyaan: string;
  tipe: string;
  options: Option[];
}

interface EvaluationDetail {
  id: string;
  judul: string;
  questions: Question[];
}

interface OptionInput {
  teksOpsi: string;
  isCorrect: boolean;
}

export default function EvaluationDetailAdminPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.evalId as string;

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pertanyaan, setPertanyaan] = useState("");
  const [tipe, setTipe] = useState("pilihan_ganda");
  const [options, setOptions] = useState<OptionInput[]>([
    { teksOpsi: "", isCorrect: true },
    { teksOpsi: "", isCorrect: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadEvaluation();
  }, [evalId]);

  async function loadEvaluation() {
    try {
      const data = await getEvaluationDetail(evalId);
      setEvaluation(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal memuat detail evaluasi.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOptionTextChange(index: number, value: string) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, teksOpsi: value } : opt))
    );
  }

  function handleCorrectChange(index: number) {
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, isCorrect: i === index }))
    );
  }

  function handleAddOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, { teksOpsi: "", isCorrect: false }]);
  }

  function handleRemoveOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setPertanyaan("");
    setTipe("pilihan_ganda");
    setOptions([
      { teksOpsi: "", isCorrect: true },
      { teksOpsi: "", isCorrect: false },
    ]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (tipe === "pilihan_ganda") {
      const emptyOption = options.some((opt) => opt.teksOpsi.trim() === "");
      if (emptyOption) {
        setFormError("Semua opsi jawaban harus diisi.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const questionData =
        tipe === "pilihan_ganda"
          ? { pertanyaan, tipe, options }
          : { pertanyaan, tipe };

      await addQuestion(evalId, questionData);
      resetForm();
      await loadEvaluation();
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Gagal menambahkan soal.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-center mt-16">Memuat evaluasi...</p>;
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200">
          {error || "Evaluasi tidak ditemukan."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline mb-6"
      >
        ← Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{evaluation.judul}</h1>

      <div className="mb-8">
        <h2 className="font-semibold text-gray-800 mb-3">
          Soal yang Sudah Ada ({evaluation.questions.length})
        </h2>

        {evaluation.questions.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada soal.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {evaluation.questions.map((q, index) => (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {index + 1}. {q.pertanyaan}
                </p>
                <span className="text-xs text-gray-400 capitalize">
                  {q.tipe.replace("_", " ")}
                  {q.tipe === "pilihan_ganda" && ` • ${q.options.length} opsi`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="font-semibold text-gray-800 mb-4">Tambah Soal Baru</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Pertanyaan</label>
            <textarea
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipe Soal</label>
            <select
              value={tipe}
              onChange={(e) => setTipe(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="esai">Esai</option>
            </select>
          </div>

          {tipe === "pilihan_ganda" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Opsi Jawaban (pilih 1 sebagai jawaban benar)
              </label>
              <div className="flex flex-col gap-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectChange(index)}
                    />
                    <input
                      type="text"
                      value={opt.teksOpsi}
                      onChange={(e) => handleOptionTextChange(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                      placeholder={`Opsi ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 text-xs hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-blue-600 text-sm hover:underline mt-2"
                >
                  + Tambah Opsi
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400 mt-2"
          >
            {submitting ? "Menyimpan..." : "Tambah Soal"}
          </button>
        </form>
      </div>
    </div>
  );
}