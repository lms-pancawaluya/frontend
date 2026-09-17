/**
 * Sequential stage gating helpers for Guru-side Module learning flow.
 *
 * The backend is the single source of truth for per-stage completion on a
 * Module:
 *   - `preTestCompleted`
 *   - `materialCompleted`
 *   - `postTestCompleted`
 *
 * The frontend must NOT compute completion itself (e.g. by counting materials,
 * detected by a button click, or inferred from page navigation). It only reads
 * the flags the backend provides.
 *
 * Stages that are not available for a Module are reported as completed by the
 * backend, so the frontend simply relies on the given flags and never applies
 * its own availability/bypass rules.
 */

export interface ModuleStageProgress {
  preTestCompleted?: boolean;
  materialCompleted?: boolean;
  postTestCompleted?: boolean;
}

/**
 * Reads the per-stage completion flags from any backend payload shape that may
 * carry them (a Module entity from GET /api/modules/:id, or a progress item
 * from GET /api/progress, whose module may be nested under `module`).
 *
 * Only the camelCase fields are read, matching the backend contract.
 */
export function readModuleStageProgress(source: unknown): ModuleStageProgress {
  if (!source || typeof source !== "object") return {};

  const record = source as Record<string, unknown>;
  const nested =
    record.module && typeof record.module === "object"
      ? (record.module as Record<string, unknown>)
      : undefined;

  const readFlag = (key: keyof ModuleStageProgress): boolean | undefined => {
    const value = record[key] ?? nested?.[key];
    return typeof value === "boolean" ? value : undefined;
  };

  const progress: ModuleStageProgress = {};
  const preTestCompleted = readFlag("preTestCompleted");
  const materialCompleted = readFlag("materialCompleted");
  const postTestCompleted = readFlag("postTestCompleted");

  if (preTestCompleted !== undefined) progress.preTestCompleted = preTestCompleted;
  if (materialCompleted !== undefined) progress.materialCompleted = materialCompleted;
  if (postTestCompleted !== undefined) progress.postTestCompleted = postTestCompleted;

  return progress;
}

/** Resolves the module id that a progress item belongs to. */
export function readProgressModuleId(source: unknown): string | null {
  if (!source || typeof source !== "object") return null;
  const record = source as Record<string, unknown>;

  const directId = record.moduleId ?? record.modulId;
  if (typeof directId === "string" && directId) return directId;

  const nested = record.module ?? record.modul;
  if (nested && typeof nested === "object") {
    const nestedId = (nested as Record<string, unknown>).id;
    if (typeof nestedId === "string" && nestedId) return nestedId;
  }

  return null;
}

/**
 * Learning Material is locked until the Pre-Test is marked completed by the
 * backend. An unavailable Pre-Test is reported as completed by the backend, so
 * no special-casing is needed here.
 */
export function isMaterialLocked(progress: ModuleStageProgress): boolean {
  return progress.preTestCompleted !== true;
}

/**
 * Post-Test is locked until the Learning Material is marked completed by the
 * backend. An unavailable Material is reported as completed by the backend.
 */
export function isPostTestLocked(progress: ModuleStageProgress): boolean {
  return progress.materialCompleted !== true;
}
