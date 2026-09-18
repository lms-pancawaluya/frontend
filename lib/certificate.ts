/**
 * Helpers for Guru-side certificate eligibility on a Course.
 *
 * The backend is the single source of truth for course completion/eligibility.
 * This helper only READS the backend-reported per-stage completion flags
 * (see lib/moduleStages.ts) — it never computes completion itself (no counting
 * of materials, no click-detection, no navigation inference).
 *
 * A course is considered eligible when the backend says it offers a certificate
 * (`hasCertificate`) AND every module reports its stages as completed
 * (unavailable stages are reported as completed by the backend, so an all-true
 * set means the module is finished per the backend).
 */

import type { CourseModule } from "@/types/course";
import type { ModuleStageProgress } from "@/lib/moduleStages";

/**
 * Returns true when the backend reports every module of the course as fully
 * completed (preTest, material, and postTest flags all `true`).
 * Returns false when there is no module data — the backend must confirm
 * completion, so an unknown state is treated as not eligible.
 */
export function isCourseCompletedByBackend(
  modules: CourseModule[],
  stageProgress: Record<string, ModuleStageProgress>
): boolean {
  if (!Array.isArray(modules) || modules.length === 0) return false;

  return modules.every((module) => {
    const progress = stageProgress[module.id] || {};
    return (
      progress.preTestCompleted === true &&
      progress.materialCompleted === true &&
      progress.postTestCompleted === true
    );
  });
}
