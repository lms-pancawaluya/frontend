export type ScheduleStatus = "open" | "not_started" | "closed";

export interface ScheduleSource {
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  waktuMulai?: string | null;
  waktuSelesai?: string | null;
}

export function parseScheduleDate(value?: string | null, isEnd = false): Date | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T${isEnd ? "23:59:59.999" : "00:00:00.000"}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getEffectiveSchedule(
  moduleSchedule?: ScheduleSource | null,
  courseSchedule?: ScheduleSource | null
): { startDate: Date | null; endDate: Date | null; isInherited: boolean } {
  const modStart = parseScheduleDate(
    moduleSchedule?.tanggalMulai || moduleSchedule?.startDate || moduleSchedule?.waktuMulai
  );
  const modEnd = parseScheduleDate(
    moduleSchedule?.tanggalSelesai || moduleSchedule?.endDate || moduleSchedule?.waktuSelesai,
    true
  );

  const courseStart = parseScheduleDate(
    courseSchedule?.tanggalMulai || courseSchedule?.startDate || courseSchedule?.waktuMulai
  );
  const courseEnd = parseScheduleDate(
    courseSchedule?.tanggalSelesai || courseSchedule?.endDate || courseSchedule?.waktuSelesai,
    true
  );

  const startDate = modStart || courseStart;
  const endDate = modEnd || courseEnd;
  const isInherited = !modStart && !modEnd;

  return { startDate, endDate, isInherited };
}

export function getScheduleStatus(
  moduleSchedule?: ScheduleSource | null,
  courseSchedule?: ScheduleSource | null,
  now = new Date()
): ScheduleStatus {
  const { startDate, endDate } = getEffectiveSchedule(moduleSchedule, courseSchedule);

  if (startDate && now < startDate) {
    return "not_started";
  }
  if (endDate && now > endDate) {
    return "closed";
  }
  return "open";
}
