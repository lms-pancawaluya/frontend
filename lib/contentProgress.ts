/**
 * Helpers for reading Guru-side per-material (content) progress.
 *
 * The backend is the single source of truth for material completion. These
 * helpers only read the payloads the backend returns from:
 *   - GET /api/progress            (list progress per module)
 *   - GET /api/progress/:moduleId  (progress detail for one module)
 *
 * Shapes (per BE contract):
 *   - `materialProgress`: array of material progress entries for a module.
 *   - `materialDetail`:   detail per content id (id → progressPercent/completed).
 *
 * The frontend must NOT compute completion itself. It reads whatever the
 * backend provides and never invents local completion state.
 */

export interface MaterialProgressEntry {
  /** Content id of the material. */
  contentId: string | null;
  /** Playback/completion percentage 0–100 as reported by the backend. */
  progressPercent?: number;
  /** Backend-reported completion flag for this material. */
  completed?: boolean;
  /** Backend-reported status string, when present. */
  status?: string;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readContentId(record: Record<string, unknown>): string | null {
  const candidates = [record.contentId, record.content_id, record.id];
  for (const value of candidates) {
    if (typeof value === "string" && value) return value;
  }
  const content = toRecord(record.content);
  if (content) {
    const nestedId = content.id ?? content.contentId ?? content.content_id;
    if (typeof nestedId === "string" && nestedId) return nestedId;
  }
  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function parseEntry(raw: unknown): MaterialProgressEntry | null {
  const record = toRecord(raw);
  if (!record) return null;

  const progressPercent = readNumber(record, ["progressPercent", "progress_percent", "percent"]);
  const completed = readBoolean(record, ["completed", "isCompleted", "is_completed", "selesai"]);
  const statusValue = record.status;

  const entry: MaterialProgressEntry = { contentId: readContentId(record) };
  if (progressPercent !== undefined) entry.progressPercent = progressPercent;
  if (completed !== undefined) entry.completed = completed;
  if (typeof statusValue === "string") entry.status = statusValue;

  return entry;
}

/**
 * Extracts the `materialProgress` array from a progress payload (either a
 * single module progress object or a list item that nests the module).
 * Returns entries keyed by content id (skipping entries without one).
 */
export function readMaterialProgress(source: unknown): Record<string, MaterialProgressEntry> {
  const result: Record<string, MaterialProgressEntry> = {};

  const collect = (list: unknown) => {
    if (!Array.isArray(list)) return;
    list.forEach((raw) => {
      const entry = parseEntry(raw);
      if (entry?.contentId) result[entry.contentId] = entry;
    });
  };

  const record = toRecord(source);
  if (!record) return result;

  collect(record.materialProgress);
  collect(record.material_progress);

  // Payload dapat membungkus module di dalam `module`/`modul`.
  const nested = toRecord(record.module) ?? toRecord(record.modul);
  if (nested) {
    collect(nested.materialProgress);
    collect(nested.material_progress);
  }

  return result;
}

/**
 * Extracts `materialDetail` (detail per content id) from a progress payload.
 * Tolerant of both a keyed map and an array of per-content entries.
 */
export function readMaterialDetail(source: unknown): Record<string, MaterialProgressEntry> {
  const result: Record<string, MaterialProgressEntry> = {};

  const collectFromValue = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach((raw) => {
        const entry = parseEntry(raw);
        if (entry?.contentId) result[entry.contentId] = { ...(result[entry.contentId] || {}), ...entry };
      });
      return;
    }
    const map = toRecord(value);
    if (!map) return;
    Object.entries(map).forEach(([key, raw]) => {
      const entry = parseEntry(raw) ?? { contentId: key };
      const contentId = entry.contentId || key;
      result[contentId] = { ...(result[contentId] || {}), ...entry, contentId };
    });
  };

  const record = toRecord(source);
  if (!record) return result;

  collectFromValue(record.materialDetail);
  collectFromValue(record.material_detail);

  const nested = toRecord(record.module) ?? toRecord(record.modul);
  if (nested) {
    collectFromValue(nested.materialDetail);
    collectFromValue(nested.material_detail);
  }

  return result;
}

/** Merges materialProgress and materialDetail into a single content-id map. */
export function readMaterialStatus(source: unknown): Record<string, MaterialProgressEntry> {
  const merged: Record<string, MaterialProgressEntry> = {};
  const progress = readMaterialProgress(source);
  const detail = readMaterialDetail(source);

  Object.entries(detail).forEach(([id, entry]) => {
    merged[id] = { ...entry };
  });
  Object.entries(progress).forEach(([id, entry]) => {
    merged[id] = { ...(merged[id] || {}), ...entry };
  });

  return merged;
}

/** A material is complete when the backend says so. */
export function isMaterialEntryCompleted(entry?: MaterialProgressEntry): boolean {
  if (!entry) return false;
  if (entry.completed === true) return true;
  if (typeof entry.status === "string") {
    const status = entry.status.toLowerCase();
    if (status === "selesai" || status === "completed" || status === "complete") return true;
  }
  return entry.progressPercent !== undefined && entry.progressPercent >= 100;
}

/** Clamps a percentage into the 0–100 range and rounds it. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
