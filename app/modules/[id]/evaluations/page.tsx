"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getModuleEvaluations } from "@/services/evaluation.service";
import { isPreTest, isPostTest, type EvaluationSummary } from "@/types/evaluation";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ModuleEvaluationsIndexPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const moduleId = params.id as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirectToTarget() {
      try {
        const evaluations = (await getModuleEvaluations(moduleId)) as EvaluationSummary[];

        if (!evaluations || evaluations.length === 0) {
          setError("Belum ada Pre-Test atau Post-Test yang dibuat untuk modul ini.");
          return;
        }

        // Sequencing: Pre-Test → Learning Material → Post-Test.
        // `?stage=post` dipakai setelah seluruh material selesai agar langsung
        // menuju Post-Test; default (masuk dari awal modul) menuju Pre-Test.
        const preTest = evaluations.find((e) => isPreTest(e.tipe));
        const postTest = evaluations.find((e) => isPostTest(e.tipe));
        const wantsPostStage = searchParams.get("stage") === "post";

        const target = wantsPostStage
          ? postTest || preTest || evaluations[0]
          : preTest || postTest || evaluations[0];

        router.replace(`/modules/${moduleId}/evaluations/${target.id}`);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Gagal mengambil data asesmen modul."));
      }
    }

    if (moduleId) {
      redirectToTarget();
    }
  }, [moduleId, router, searchParams]);

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
        Memuat asesmen modul...
      </div>
    </div>
  );
}
