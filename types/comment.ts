// types/comment.ts
//
// Tipe untuk Discussion/Comment Course-level.
//
// Contract BE (final):
//   GET    /api/comments/course/:courseId     → nested (root memiliki replies[])
//   GET    /api/comments/users/search?q=:kwd  → daftar user untuk mention
//   POST   /api/comments                      → { courseId, komentar, parentId?, mentionedUserIds? }
//   DELETE /api/comments/:id
//
// Catatan: `moduleId` dipertahankan sebagai field legacy (discussion lama
// module-level) sampai seluruh consumer dimigrasikan. Jalur utama adalah
// Course-level.

/** Role user yang dipakai di seluruh aplikasi. */
export type CommentUserRole = "admin" | "pengajar" | "guru" | string;

/** User penulis komentar (field `user` pada response comment). */
export interface CommentUser {
  id?: string;
  nama?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: CommentUserRole;
  gelar?: string;
  foto?: string;
  fotoProfil?: string;
  avatar?: string;
}

/**
 * User hasil pencarian untuk mention.
 * Contract: id, nama, fotoProfil, role, gelar.
 */
export interface CommentMentionUser {
  id: string;
  nama: string;
  fotoProfil?: string;
  role?: CommentUserRole;
  gelar?: string;
}

/**
 * Entri mention pada sebuah komentar. Bentuk defensif: BE dapat mengirim
 * `user` (objek user lengkap) dan/atau `userId`/`mentionedUserId`.
 */
export interface CommentMention {
  userId?: string;
  mentionedUserId?: string;
  id?: string;
  user?: CommentMentionUser;
}

/** Komentar diskusi (Course-level), termasuk balasan bersarang. */
export interface Comment {
  id: string;
  courseId?: string;
  /** @deprecated Discussion module-level lama. Dipertahankan untuk kompatibilitas. */
  moduleId?: string;
  parentId?: string | null;
  /** @deprecated alias lama untuk parentId. */
  parentCommentId?: string | null;
  komentar?: string;
  /** @deprecated alias lama untuk `komentar`. */
  isi?: string;
  /** @deprecated alias lama untuk `komentar`. */
  pesan?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: CommentUser;
  /** @deprecated alias lama untuk `user`. */
  author?: CommentUser;
  /** @deprecated alias lama untuk `user`. */
  pengirim?: CommentUser;
  mentions?: CommentMention[];
  replies?: Comment[];
}

/** Payload untuk membuat komentar/balasan (Course-level, jalur utama). */
export interface CreateCommentInput {
  courseId: string;
  komentar: string;
  parentId?: string | null;
  mentionedUserIds?: string[];
}

/** Hasil pencarian user untuk mention. */
export type CommentUserSearchResult = CommentMentionUser[];
