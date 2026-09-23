"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getModuleEvaluations } from "@/services/evaluation.service";
import { getModuleById } from "@/services/module.service";
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
        const [moduleData, evaluationsRes] = await Promise.all([
          getModuleById(moduleId).catch(() => null),
          getModuleEvaluations(moduleId).catch(() => []),
        ]);

        const courseId = moduleData?.courseId || moduleData?.course_id;
        const courseDetailUrl = courseId ? `/modules/courses/${courseId}` : "/modules";
        const evaluations = Array.isArray(evaluationsRes) ? (evaluationsRes as EvaluationSummary[]) : [];

        if (!evaluations || evaluations.length === 0) {
          router.replace(courseDetailUrl);
          return;
        }

        const preTest = evaluations.find((e) => isPreTest(e.tipe));
        const postTest = evaluations.find((e) => isPostTest(e.tipe));
        const wantsPostStage = searchParams.get("stage") === "post";

        const target = wantsPostStage
          ? postTest || preTest || evaluations[0]
          : preTest || postTest || evaluations[0];

        if (!target) {
          router.replace(courseDetailUrl);
          return;
        }

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
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="text-slate-500 text-sm animate-pulse dark:text-slate-400">
        Memuat asesmen modul...
      </div>
    </div>
  );
}
