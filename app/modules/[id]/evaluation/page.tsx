"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { completeModule } from "@/services/progress.service";

export default function ModuleEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState({ kritik: "", saran: "" });
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);

  // Mock evaluasi pilihan ganda
  const sampleQuestions = [
    {
      id: "ev-1",
      pertanyaan: "Apakah tujuan utama dari penerapakan konsep pembelajaran ini?",
      options: [
        { id: "a", text: "Meningkatkan kualitas karakter dan pembelajaran peserta didik." },
        { id: "b", text: "Hanya memenuhi kewajiban administratif guru." },
      ],
      correct: "a",
    },
    {
      id: "ev-2",
      pertanyaan: "Bagaimana peran pendidik dalam membentuk suasana kelas yang aman?",
      options: [
        { id: "a", text: "Mengabaikan komunikasi antar peserta didik." },
        { id: "b", text: "Menciptakan ruang dialog yang terbuka dan suportif." },
      ],
      correct: "b",
    },
  ];

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hitung Skor Sederhana
    let correctCount = 0;
    sampleQuestions.forEach((q) => {
      if (answers[q.id] === q.correct) correctCount++;
    });

    const calculatedScore = Math.round((correctCount / sampleQuestions.length) * 100);
    const isPassed = calculatedScore >= 80;

    setScoreResult({
      skor: calculatedScore,
      isLolos: isPassed,
    });
    setSubmitted(true);

    if (isPassed) {
      await completeModule(moduleId).catch(console.error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => router.push(`/modules/${moduleId}/text`)}
        className="text-xs font-semibold text-slate-500 hover:underline"
      >
        ← Kembali ke Materi Teks
      </button>

      {!submitted ? (
        <form onSubmit={handleSubmitEvaluation} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h1 className="text-xl font-bold text-slate-900">Evaluasi Pemahaman Modul</h1>
            <p className="text-xs text-slate-500">Jawab pertanyaan berikut untuk mengukur tingkat pemahaman Anda.</p>

            <div className="space-y-4 pt-2">
              {sampleQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-xs font-bold text-slate-800">{idx + 1}. {q.pertanyaan}</p>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt.id}
                          onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt.id }))}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Kritik dan Saran */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Kritik & Saran</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Kritik untuk modul ini:</label>
                <textarea
                  rows={2}
                  value={feedback.kritik}
                  onChange={(e) => setFeedback((p) => ({ ...p, kritik: e.target.value }))}
                  placeholder="Tulis kritik terkait penyampaian materi..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Saran pengembangan:</label>
                <textarea
                  rows={2}
                  value={feedback.saran}
                  onChange={(e) => setFeedback((p) => ({ ...p, saran: e.target.value }))}
                  placeholder="Tulis saran perbaikan untuk pengembangan selanjutnya..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-lg hover:bg-slate-800 transition"
          >
            Kirim Evaluasi & Lihat Hasil
          </button>
        </form>
      ) : (
        /* SCORE SCREEN HALAMAN EVALUASI */
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
          {scoreResult?.isLolos ? (
            <>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                ✓
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                  Selesai & Lolos
                </span>
                <h2 className="text-3xl font-black text-slate-900">Skor Evaluasi: {scoreResult.skor}</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Selamat! Anda telah menyelesaikan seluruh tahapan pembelajaran dalam modul ini dengan sukses.
                </p>
              </div>
              <button
                onClick={() => router.push("/modules")}
                className="w-full py-3.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition"
              >
                Kembali ke Katalog Modul
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                ✕
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-3 py-1 rounded-full uppercase tracking-wider">
                  Belum Lolos
                </span>
                <h2 className="text-3xl font-black text-slate-900">Skor Evaluasi: {scoreResult.skor}</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Skor minimal lulus adalah 80%. Silakan pelajari ulang materi video dari awal untuk dapat mengulang evaluasi.
                </p>
              </div>
              <button
                onClick={() => router.push(`/modules/${moduleId}/video`)}
                className="w-full py-3.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-rose-700 transition"
              >
                Ulangi Pembelajaran dari Video
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}