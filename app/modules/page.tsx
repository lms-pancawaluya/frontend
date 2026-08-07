"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getModules } from "@/services/module.service";
import { getProgress } from "@/services/progress.service";

interface Module {
  id: string;
  judul: string;
  deskripsi: string;
  aspekPancawaluya: string;
  urutan: number;
  _count: {
    contents: number;
    evaluations: number;
  };
}

const aspekColor: Record<string, string> = {
  cageur: "bg-green-100 text-green-700",
  bageur: "bg-blue-100 text-blue-700",
  bener: "bg-yellow-100 text-yellow-700",
  pinter: "bg-purple-100 text-purple-700",
  singer: "bg-red-100 text-red-700",
};

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchModules() {
      try {
        const [modulesData, progressData] = await Promise.all([
          getModules(),
          getProgress(),
        ]);

        setModules(modulesData);

        const selesaiIds = progressData
          .filter((p: { status: string }) => p.status === "selesai")
          .map((p: { module: { id: string } }) => p.module.id);

        setCompletedIds(selesaiIds);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat daftar modul.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, []);

  if (loading) {
    return <p className="text-center mt-16">Memuat modul...</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Modul Pancawaluya</h1>
      <p className="text-gray-500 mb-8">
        Pilih modul untuk mulai belajar dan mengerjakan evaluasi
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map((mod) => {
          const isCompleted = completedIds.includes(mod.id);

          return (
            <Link
              key={mod.id}
              href={`/modules/${mod.id}`}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition block relative"
            >
              {isCompleted && (
                <span className="absolute top-4 right-4 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  ✓ Selesai
                </span>
              )}

              <span
                className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mb-3 capitalize ${
                  aspekColor[mod.aspekPancawaluya] || "bg-gray-100 text-gray-700"
                }`}
              >
                {mod.aspekPancawaluya}
              </span>
              <h2 className="font-semibold text-gray-800 mb-2 pr-16">{mod.judul}</h2>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {mod.deskripsi}
              </p>
              <div className="text-xs text-gray-400 flex gap-3">
                <span>{mod._count.contents} konten</span>
                <span>{mod._count.evaluations} evaluasi</span>
              </div>
            </Link>
          );
        })}
      </div>

      {modules.length === 0 && (
        <p className="text-center text-gray-500 mt-8">Belum ada modul tersedia.</p>
      )}
    </div>
  );
}