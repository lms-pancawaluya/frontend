"use client";

import React from "react";

export interface QuizAttemptResult {
  skor: number;
  isLolos: boolean;
  passingScore: number;
  sisaPercobaan: number;
  mustRepeat: boolean;
  pesan?: string;
}

interface QuizScoreScreenProps {
  result: QuizAttemptResult;
  onNext: () => void;
  onRetry: () => void;
  onRepeatVideo: () => void;
}

export const QuizScoreScreen: React.FC<QuizScoreScreenProps> = ({
  result,
  onNext,
  onRetry,
  onRepeatVideo,
}) => {
  const { skor, isLolos, passingScore, sisaPercobaan, mustRepeat, pesan } = result;

  // KONDISI C: GAGAL 3 KALI BERTURUT-TURUT
  if (!isLolos && (mustRepeat || sisaPercobaan <= 0)) {
    return (
      <div className="text-center space-y-5 py-3">
        {/* Lencana Warning */}
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
          ✕
        </div>

        <div>
          <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            Kesempatan Habis
          </span>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-3">
            {skor} <span className="text-sm font-normal text-slate-500">/ 100</span>
          </h3>
          <p className="text-xs text-rose-600 font-medium mt-2 max-w-xs mx-auto leading-relaxed">
            {pesan ||
              "Kamu telah gagal 3 kali. Kuis di-reset dan kamu wajib mempelajari ulang materi dari awal."}
          </p>
        </div>

        {/* Tombol Aksi: Tonton Ulang Materi */}
        <button
          onClick={onRepeatVideo}
          className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-rose-200"
        >
          Tonton Ulang Materi
        </button>
      </div>
    );
  }

  // KONDISI A: KELULUSAN (isLolos: true)
  if (isLolos) {
    return (
      <div className="text-center space-y-5 py-3">
        {/* Lencana Lulus */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
          ✓
        </div>

        <div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            Lulus
          </span>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-3">
            {skor} <span className="text-sm font-normal text-slate-500">/ 100</span>
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-2 max-w-xs mx-auto leading-relaxed">
            {pesan || "Selamat! Kamu lulus mini kuis ini. Lanjut ke materi berikutnya!"}
          </p>
        </div>

        {/* Tombol Aksi: Lanjut ke Materi Selanjutnya */}
        <button
          onClick={onNext}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-200"
        >
          Lanjut ke Materi Selanjutnya
        </button>
      </div>
    );
  }

  // KONDISI B: GAGAL TAPI MASIH ADA KESEMPATAN (isLolos: false & sisaPercobaan > 0)
  return (
    <div className="text-center space-y-5 py-3">
      {/* Lencana Belum Lulus */}
      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
        !
      </div>

      <div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider">
          Belum Lulus
        </span>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-3">
          {skor} <span className="text-sm font-normal text-slate-500">/ 100</span>
        </h3>
        <p className="text-xs text-slate-600 font-medium mt-2 max-w-xs mx-auto leading-relaxed">
          Skor minimal lulus adalah {passingScore || 80}. Sisa kesempatan kamu:{" "}
          <span className="font-bold text-amber-600">{sisaPercobaan} kali</span>.
        </p>
      </div>

      {/* Tombol Aksi: Coba Lagi */}
      <button
        onClick={onRetry}
        className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber-200"
      >
        Coba Lagi
      </button>
    </div>
  );
};