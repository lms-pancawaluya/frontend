"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getModuleById } from "@/services/module.service";
import { getCourseById } from "@/services/course.service";
import { isMaterialLocked, isPostTestLocked, readModuleStageProgress } from "@/lib/moduleStages";
import { getScheduleStatus, type ScheduleStatus } from "@/lib/schedule";
import { useApp } from "@/app/context/AppContext";

interface ModuleStageGuardProps {
  moduleId: string;
  stage: "material" | "postTest";
  children: ReactNode;
}

export default function ModuleStageGuard({ moduleId, stage, children }: ModuleStageGuardProps) {
  const router = useRouter();
  const { t } = useApp();
  const [status, setStatus] = useState<"checking" | "allowed" | "blocked" | "schedule_locked" | "error">("checking");
  const [scheduleLockReason, setScheduleLockReason] = useState<ScheduleStatus>("open");
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    let isMounted = true;

    async function checkStage() {
      setStatus("checking");
      try {
        const moduleData = await getModuleById(moduleId);
        if (!isMounted) return;

        if (!moduleData) {
          setStatus("error");
          return;
        }

        const cId = moduleData.courseId || moduleData.id_course || moduleData.course_id || null;
        if (cId) setCourseId(String(cId));

        let courseData = null;
        if (cId) {
          try {
            courseData = await getCourseById(String(cId));
          } catch {
            courseData = null;
          }
        }

        const schedStatus = getScheduleStatus(moduleData, courseData);
        if (schedStatus !== "open") {
          setScheduleLockReason(schedStatus);
          setStatus("schedule_locked");
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

  if (status === "schedule_locked") {
    const isNotStarted = scheduleLockReason === "not_started";
    return (
      <div className="mx-auto mt-16 max-w-md p-6 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/40">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 mb-3">
            {isNotStarted ? t("Belum Dibuka", "Not Opened Yet") : t("Sudah Ditutup", "Closed")}
          </span>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
            {isNotStarted
              ? t("Modul ini belum dapat diakses karena jadwal pembelajaran belum dimulai.", "This module cannot be accessed yet because the schedule has not started.")
              : t("Masa akses modul ini telah berakhir.", "The access period for this module has ended.")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(courseId ? `/modules/courses/${courseId}` : "/modules")}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← {t("Kembali ke detail course", "Back to course detail")}
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {t("Gagal memuat status tahapan modul. Silakan coba lagi.", "Failed to load module stage status. Please try again.")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium">{t("Memeriksa akses materi...", "Checking material access...")}</p>
    </div>
  );
}
