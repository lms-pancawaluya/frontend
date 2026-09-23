"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getModuleById } from "@/services/module.service";
import { isMaterialLocked, isPostTestLocked, readModuleStageProgress } from "@/lib/moduleStages";

interface ModuleStageGuardProps {
  /** Module yang sedang diakses. */
  moduleId: string;
  /** Stage yang dilindungi. */
  stage: "material" | "postTest";
  children: ReactNode;
}

/**
 * Guards direct access to a Guru learning stage so a Guru cannot bypass the
 * required sequence by opening the route directly (a disabled card button is
 * not enough).
 *
 * The prerequisite is validated against the per-stage completion flags the
 * backend provides on the Module (GET /api/modules/:id). The flags are the
 * single source of truth — no local completion state is used.
 *
 * When the prerequisite is not met the Guru is redirected to the existing
 * Pre-Test entry route (`/modules/:id/evaluations`, which itself resolves to
 * the module's Pre-Test). While the status is still loading, no children are
 * rendered so no unlocked stage is ever shown prematurely.
 */
export default function ModuleStageGuard({ moduleId, stage, children }: ModuleStageGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "allowed" | "blocked" | "error">("checking");

  useEffect(() => {
    if (!moduleId) return;
    let isMounted = true;

    async function checkStage() {
      setStatus("checking");
      try {
        const moduleData = await getModuleById(moduleId);
        if (!isMounted) return;

        // Data modul gagal diambil (mis. 404/non-ok). Tampilkan error alih-alih
        // salah mengarahkan Guru ke Pre-Test.
        if (!moduleData) {
          setStatus("error");
          return;
        }

        const progress = readModuleStageProgress(moduleData);
        const locked = stage === "material" ? isMaterialLocked(progress) : isPostTestLocked(progress);

        if (locked) {
          setStatus("blocked");
          router.replace(`/modules/${moduleId}/evaluations`);
        } else {
          setStatus("allowed");
        }
      } catch (err) {
        console.error("Gagal memvalidasi tahapan modul:", err);
        if (isMounted) setStatus("error");
      }
    }

    checkStage();
    return () => {
      isMounted = false;
    };
  }, [moduleId, stage, router]);

  if (status === "allowed") {
    return <>{children}</>;
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Gagal memuat status tahapan modul. Silakan coba lagi.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium">Memeriksa akses materi...</p>
    </div>
  );
}
