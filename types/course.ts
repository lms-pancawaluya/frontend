export type CourseMode = "online" | "offline";

export interface CourseModule {
  id: string;
  judul: string;
  deskripsi?: string;
  aspekPancawaluya?: string;
  urutan?: number;
  isLocked?: boolean;
  flowStatus?: {
    preTest?: string;
    postTest?: string;
  };
  progressPercentage?: number;
  /** Per-stage completion flags provided by the backend (single source of truth). */
  preTestCompleted?: boolean;
  materialCompleted?: boolean;
  postTestCompleted?: boolean;
}

export interface Course {
  id: string;
  judul: string;
  deskripsi?: string;
  mode: CourseMode;
  hasCertificate?: boolean;
  lokasi?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  totalModules?: number;
  progressPercentage?: number;
}

export interface CourseDetail extends Course {
  modules?: CourseModule[];
}
