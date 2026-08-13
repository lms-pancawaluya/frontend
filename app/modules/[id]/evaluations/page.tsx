"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getModuleEvaluations } from "@/services/evaluation.service";

export default function ModuleEvaluationsIndexPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirectFirstEvaluation() {
      try {
        // Fetch daftar evaluasi berdasarkan moduleId
        const evaluations = await getModuleEvaluations(moduleId);

        if (evaluations && evaluations.length > 0) {
          // Ambil ID dari evaluasi pertama dan redirect
          const targetId = evaluations[0].id;
          router.replace(`/modules/${moduleId}/evaluations/${targetId}`);
        } else {
          setError("Belum ada evaluasi yang dibuat untuk modul ini.");
        }
      } catch (err: any) {
        setError(err.message || "Gagal mengambil data evaluasi modul.");
      }
    }

    if (moduleId) {
      redirectFirstEvaluation();
    }
  }, [moduleId, router]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="text-slate-500 text-sm animate-pulse">
        Memuat evaluasi modul...
      </div>
    </div>
  );
}