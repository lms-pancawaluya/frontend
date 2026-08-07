"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getModuleEvaluations,
  getEvaluationDetail,
  submitEvaluation,
} from "@/services/evaluation.service";

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

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchEvaluation() {
      try {
        const evaluations = await getModuleEvaluations(moduleId);

        if (evaluations.length === 0) {
          setError("Belum ada evaluasi untuk modul ini.");
          return;
        }

        const detail = await getEvaluationDetail(evaluations[0].id);
        setEvaluation(detail);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat evaluasi.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEvaluation();
  }, [moduleId]);

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!evaluation) return;

    const jawaban = evaluation.questions.map((q) => ({
      questionId: q.id,
      jawaban: answers[q.id] || "",
    }));

    setSubmitting(true);
    setError("");

    try {
      await submitEvaluation(evaluation.id, jawaban);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal mengirim jawaban.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-center mt-16">Memuat evaluasi...</p>;
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <h1 className="text-xl font-bold text-green-700 mb-2">
            Jawaban Terkirim! ✅
          </h1>
          <p className="text-green-600 text-sm mb-6">
            Terima kasih sudah menyelesaikan evaluasi ini.
          </p>
          <button
            onClick={() => router.push(`/modules/${moduleId}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Kembali ke Modul
          </button>
        </div>
      </div>
    );
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
        onClick={() => router.push(`/modules/${moduleId}`)}
        className="text-sm text-blue-600 hover:underline mb-6"
      >
        ← Kembali ke modul
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-8">{evaluation.judul}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {evaluation.questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <p className="font-medium text-gray-800 mb-4">
              {index + 1}. {q.pertanyaan}
            </p>

            {q.tipe === "pilihan_ganda" ? (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      required
                    />
                    {opt.teksOpsi}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={4}
                placeholder="Tulis jawaban Anda..."
                required
              />
            )}
          </div>
        ))}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {submitting ? "Mengirim..." : "Kirim Jawaban"}
        </button>
      </form>
    </div>
  );
}