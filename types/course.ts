export type CourseMode = "online" | "offline";

export interface CourseModule {
  id: string;
  judul: string;
  deskripsi?: string;
  aspekPancawaluya?: string;
  urutan?: number;
  isLocked?: boolean;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  startDate?: string;
  endDate?: string;
  waktuMulai?: string;
  waktuSelesai?: string;
  flowStatus?: {
    preTest?: string;
    postTest?: string;
  };
  progressPercentage?: number;
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
  /** Scope sekolah Course. `null` = Global Course (lintas sekolah). */
  schoolId?: string | null;
  /** ID user pembuat Course (owner). Dipakai untuk scope manage Pengajar. */
  createdBy?: string | null;
  isGlobal?: boolean;
}

export interface CourseDetail extends Course {
  modules?: CourseModule[];
}
