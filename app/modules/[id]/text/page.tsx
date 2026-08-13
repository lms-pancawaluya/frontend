"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleContents } from "@/services/module.service";

interface ModuleContent {
  id?: string;
  judul?: string;
  tipe?: string;
  konten?: string;
}

export default function ModuleTextPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [textContent, setTextContent] = useState<ModuleContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadText() {
      try {
        const contents = (await getModuleContents(moduleId)) as ModuleContent[];
        const txt = contents.find((c) => c.tipe === "teks" || c.tipe === "text");
        setTextContent(txt || contents[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadText();
  }, [moduleId]);

  if (loading) return <div className="text-center py-20 text-xs text-slate-500">Memuat teks...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => router.push(`/modules/${moduleId}/video`)}
        className="text-xs font-semibold text-slate-500 hover:underline"
      >
        ← Kembali ke Video Pembelajaran
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">{textContent?.judul || "Materi Bacaan"}</h1>
        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line space-y-4">
          {textContent?.konten || "Konten bacaan tidak ditemukan."}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => router.push(`/modules/${moduleId}/evaluation`)}
          className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-800 transition"
        >
          Lanjut ke Evaluasi & Feedback →
        </button>
      </div>
    </div>
  );
}
