export interface Option {
  id: string;
  teksOpsi: string;
}

export interface Question {
  id: string;
  pertanyaan: string;
  options: Option[];
}

export interface MiniQuiz {
  id: string;
  judul: string;
  timestampSeconds: number;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

export interface JawabanItem {
  questionId: string;
  optionId: string;
}

export interface SubmitAttemptResponse {
  sukses: boolean;
  pesan: string;
  data: {
    attemptNumber: number;
    skor: number;
    isLolos: boolean;
    benar: number;
    totalSoal: number;
    passingScore: number;
    sisaPercobaan: number;
    mustRepeat: boolean;
  };
}

export interface QuizHistoryResponse {
  sukses: boolean;
  data: {
    isLolos: boolean;
    jumlahPercobaan: number;
    sisaPercobaan: number;
    maxAttempts: number;
    passingScore: number;
  };
}

export interface LockStatusResponse {
  sukses: boolean;
  data: {
    isLocked: boolean;
    alasan: string | null;
  };
}