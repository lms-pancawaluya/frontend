"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getModuleById, getModuleContents } from "@/services/module.service";

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

export default function AdminModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [moduleData, contentsData] = await Promise.all([
          getModuleById(id),
          getModuleContents(id),
        ]);
        setModule(moduleData);
        setContents(contentsData);
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

  if (loading) {
    return <p className="text-center mt-16 text-gray-500">Memuat modul...</p>;
  }

  if (error || !module) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error || "Modul tidak ditemukan."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/admin/modules")}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          ← Kembali ke daftar modul
        </button>

        <Link
          href={`/admin/modules/${module.id}/edit`}
          className="text-sm bg-[var(--color-navy)] text-white px-4 py-2 rounded-full font-medium hover:opacity-90 transition"
        >
          Edit Modul
        </Link>
      </div>

      <span
        className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mb-3 capitalize ${
          aspekColor[module.aspekPancawaluya] || "bg-gray-100 text-gray-700"
        }`}
      >
        {module.aspekPancawaluya}
      </span>

      <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-4">
        {module.judul}
      </h1>

      <p className="text-gray-600 leading-relaxed mb-6">{module.deskripsi}</p>

      <div className="text-sm text-gray-500 mb-8">
        <span className="font-medium text-[var(--color-navy)]">Urutan:</span> {module.urutan}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--color-navy)]">Konten Pembelajaran</h2>
          <Link
            href={`/admin/modules/${module.id}/contents/new`}
            className="text-sm bg-[var(--color-navy)] text-white px-3 py-1.5 rounded-full hover:opacity-90 transition"
          >
            + Tambah Konten
          </Link>
        </div>

        {contents.length === 0 ? (
          <div className="bg-[var(--color-pale)] border border-[var(--color-border-soft)] rounded-2xl p-5">
            <p className="text-sm text-gray-500">Belum ada konten untuk modul ini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {contents
              .sort((a, b) => a.urutan - b.urutan)
              .map((content) => (
                <div
                  key={content.id}
                  className="bg-white border border-[var(--color-border-soft)] rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[var(--color-navy)]">
                      {content.urutan}. {content.judul}
                    </h3>
                    <span className="text-xs text-gray-400 capitalize">{content.tipe}</span>
                  </div>

                  {content.tipe === "video" ? (
                    <div className="aspect-video rounded-xl overflow-hidden">
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
      </div>

      <div className="border-t border-[var(--color-border-soft)] pt-6">
        <Link
          href={`/admin/modules/${module.id}/evaluations`}
          className="text-sm font-medium text-[var(--color-accent)] hover:underline inline-flex items-center gap-2"
        >
          Edit Evaluasi
          <span className="text-[var(--color-accent)]">→</span>
        </Link>
      </div>
    </div>
  );
}
