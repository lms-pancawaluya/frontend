// lib/mention.ts
//
// Helper untuk menampilkan teks komentar dengan mention yang jelas & konsisten.
//
// Sumber data mention tetap dari BE (field `mentions` pada komentar). Helper ini
// hanya memecah teks menjadi segmen agar token `@Nama` dapat disorot.

import type { ReactNode } from "react";
import { createElement } from "react";

export interface MentionTextSegment {
  text: string;
  isMention: boolean;
}

/**
 * Memecah teks menjadi segmen biasa dan segmen mention (`@Nama`).
 * Token mention: `@` diikuti satu atau lebih karakter non-spasi.
 */
export function splitMentionSegments(text: string): MentionTextSegment[] {
  if (!text) return [];

  const segments: MentionTextSegment[] = [];
  const regex = /@[^\s@]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), isMention: false });
    }
    segments.push({ text: match[0], isMention: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isMention: false });
  }

  return segments;
}

/**
 * Render teks komentar dengan mention disorot. Mengembalikan array node React
 * yang aman (tanpa dangerouslySetInnerHTML).
 */
export function renderCommentText(text: string, mentionClassName: string): ReactNode[] {
  return splitMentionSegments(text).map((segment, index) =>
    segment.isMention
      ? createElement(
          "span",
          {
            key: index,
            className: mentionClassName,
          },
          segment.text
        )
      : createElement("span", { key: index }, segment.text)
  );
}
