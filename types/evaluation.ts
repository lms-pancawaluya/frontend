export interface EvaluationOption {
  id: string;
  teksOpsi: string;
}

export interface EvaluationQuestion {
  id: string;
  pertanyaan: string;
  tipe?: string;
  options?: EvaluationOption[];
}

export interface EvaluationSummary {
  id: string;
  judul: string;
  tipe?: string;
  passingScore?: number;
  maxAttempts?: number;
}

export interface EvaluationDetailData extends EvaluationSummary {
  questions: EvaluationQuestion[];
}

export interface SubmitAnswerItem {
  questionId: string;
  jawaban: string;
}

export interface SubmitEvaluationResult {
  skor: number;
  isLolos: boolean;
  passingScore?: number;
  mustRepeat?: boolean;
  benar?: number;
  totalSoal?: number;
  sisaPercobaan?: number;
  pesan?: string;
}

export function isPreTest(tipe?: string) {
  return String(tipe || "").toLowerCase().replace(/[ _-]/g, "") === "pretest";
}

export function isPostTest(tipe?: string) {
  return String(tipe || "").toLowerCase().replace(/[ _-]/g, "") === "posttest";
}
