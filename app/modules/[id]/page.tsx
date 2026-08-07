"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleById, getModuleContents } from "@/services/module.service";
import { startModule, completeModule, getProgress } from "@/services/progress.service";

interface ModuleDetail {
  id: string;
  judul: string;
  deskripsi: string;
  aspekPancawaluya: string;
  urutan: number;
}

interface ContentItem {
  id: string;
  judul: string;
  tipe: string;
  konten: string;
  urutan: number;
}

const aspekColor: Record<string, string> = {
  cageur: "bg-green-100 text-green-700",
  bageur: "bg-blue-100 text-blue-700",
  bener: "bg-yellow-100 text-yellow-700",
  pinter: "bg-purple-100 text-purple-700",
  singer: "bg-red-100 text-red-700",
};

function getYoutubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  const videoId = match ? match[1] : "";
  return `https://www.youtube.com/embed/${videoId}`;
}

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
  async function fetchData() {
    try {
      const [moduleData, contentsData, progressData] = await Promise.all([
        getModuleById(id),
        getModuleContents(id),
        getProgress(),
      ]);
      setModule(moduleData);
      setContents(contentsData);

      // Cek apakah modul ini sudah pernah diselesaikan sebelumnya
      const existingProgress = progressData.find(
        (p: { module: { id: string }; status: string }) => p.module.id === id
      );

      if (existingProgress && existingProgress.status === "selesai") {
        setCompleted(true);
      } else {
        // Tandai modul sebagai "sedang dipelajari" (hanya kalau belum selesai)
        startModule(id).catch((err) => {
          console.error("Gagal memulai modul:", err);
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal memuat detail modul.");
      }
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, [id]);

  async function handleComplete() {
    setCompleting(true);
    try {
      await completeModule(id);
      setCompleted(true);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal menyelesaikan modul.");
      }
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return <p className="text-center mt-16">Memuat modul...</p>;
  }

  if (error || !module) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200">
          {error || "Modul tidak ditemukan."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => router.push("/modules")}
        className="text-sm text-blue-600 hover:underline mb-6"
      >
        ← Kembali ke daftar modul
      </button>

      <span
        className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mb-3 capitalize ${
          aspekColor[module.aspekPancawaluya] || "bg-gray-100 text-gray-700"
        }`}
      >
        {module.aspekPancawaluya}
      </span>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">{module.judul}</h1>

      <p className="text-gray-600 leading-relaxed mb-8">{module.deskripsi}</p>

      <h2 className="font-semibold text-gray-800 mb-4">Materi Pembelajaran</h2>

      {contents.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">
            Konten pembelajaran untuk modul ini belum tersedia.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {contents
            .sort((a, b) => a.urutan - b.urutan)
            .map((content) => (
              <div
                key={content.id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="font-medium text-gray-800 mb-3">{content.judul}</h3>

                {content.tipe === "video" ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={getYoutubeEmbedUrl(content.konten)}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {content.konten}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push(`/modules/${id}/evaluation`)}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Kerjakan Evaluasi
        </button>
        <button
          onClick={handleComplete}
          disabled={completing || completed}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {completed ? "✓ Selesai" : completing ? "Menyimpan..." : "Selesaikan Modul"}
        </button>
      </div>
    </div>
  );
}