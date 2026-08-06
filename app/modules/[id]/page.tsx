"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleById } from "@/services/module.service";

interface ModuleDetail {
  id: string;
  judul: string;
  deskripsi: string;
  aspekPancawaluya: string;
  urutan: number;
}

const aspekColor: Record<string, string> = {
  cageur: "bg-green-100 text-green-700",
  bageur: "bg-blue-100 text-blue-700",
  bener: "bg-yellow-100 text-yellow-700",
  pinter: "bg-purple-100 text-purple-700",
  singer: "bg-red-100 text-red-700",
};

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchModule() {
      try {
        const data = await getModuleById(id);
        setModule(data);
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

    fetchModule();
  }, [id]);

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

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-sm text-gray-500">
          Konten pembelajaran untuk modul ini akan muncul di sini.
        </p>
      </div>
    </div>
  );
}