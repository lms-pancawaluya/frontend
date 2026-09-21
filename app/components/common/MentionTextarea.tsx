"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { searchCommentUsers } from "@/services/comment.service";
import type { CommentUserSearchUser } from "@/types/comment";

export interface MentionSelection {
  id: string;
  nama: string;
}

interface MentionTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /**
   * Dipanggil setiap kali daftar mention berubah. Mengirim ID user yang saat ini
   * di-mention pada teks (untuk dikirim sebagai `mentionedUserIds` ke BE).
   */
  onMentionsChange?: (mentions: MentionSelection[]) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const MAX_RESULTS = 10;
// Saat user baru mengetik `@` (tanpa query), tampilkan saran default dari BE.
const DEFAULT_SUGGESTION_LIMIT = 5;
const DEBOUNCE_MS = 250;

/**
 * Textarea dengan dukungan @mention autocomplete.
 *
 * - Saat user mengetik `@`, memanggil GET /api/comments/users/search
 *   (via `searchCommentUsers`). Query kosong (baru `@`) menampilkan maksimal 5
 *   saran default dari BE; setelah ada kata kunci, maksimal 10 user sesuai
 *   response BE.
 * - Memilih user menyisipkan `@nama` ke teks dan mencatat ID-nya untuk
 *   `mentionedUserIds`.
 * - Dropdown membuka ke atas bila ruang di bawah textarea tidak cukup, agar
 *   tetap terlihat saat composer berada dekat dasar layar.
 *
 * Semua data user berasal dari BE — tidak ada mock/hardcode.
 */
export default function MentionTextarea({
  id,
  value,
  onChange,
  onMentionsChange,
  rows = 3,
  placeholder,
  className = "",
  disabled = false,
  ariaLabel,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [results, setResults] = useState<CommentUserSearchUser[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentions, setMentions] = useState<MentionSelection[]>([]);
  // Arah buka dropdown: "down" (default) atau "up" bila ruang di bawah textarea
  // tidak cukup. Mencegah dropdown tersembunyi di luar viewport/terpotong
  // container saat composer berada di dekat dasar layar.
  const [placement, setPlacement] = useState<"down" | "up">("down");

  // Deteksi token `@query` tepat sebelum caret. Mengembalikan posisi `@` bila aktif.
  const detectMentionQuery = useCallback((text: string, caret: number) => {
    // Cari `@` terdekat sebelum caret tanpa newline di antaranya.
    const beforeCaret = text.slice(0, caret);
    const match = /@([^\s@]*)$/.exec(beforeCaret);
    if (!match) return null;
    const atIndex = beforeCaret.length - match[0].length;
    return { atIndex, kwd: match[1] };
  }, []);

  // Tentukan arah dropdown berdasarkan ruang tersisa di bawah textarea.
  const updatePlacement = useCallback(() => {
    const el = textareaRef.current;
    if (!el || typeof window === "undefined") return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setPlacement(spaceBelow < 240 && spaceAbove > spaceBelow ? "up" : "down");
  }, []);

  const syncMentionState = useCallback(
    (text: string, caret: number) => {
      const detected = detectMentionQuery(text, caret);
      if (!detected) {
        setQuery(null);
        setOpen(false);
        setResults([]);
        setError("");
        setLoading(false);
        return;
      }
      // Query boleh kosong (baru ketik `@`): BE mengembalikan saran default.
      updatePlacement();
      setQuery(detected.kwd);
      setOpen(true);
      setActiveIndex(0);
    },
    [detectMentionQuery, updatePlacement]
  );

  // Perbarui arah dropdown saat scroll/resize selama dropdown terbuka.
  useEffect(() => {
    if (!open) return;
    updatePlacement();
    window.addEventListener("scroll", updatePlacement, true);
    window.addEventListener("resize", updatePlacement);
    return () => {
      window.removeEventListener("scroll", updatePlacement, true);
      window.removeEventListener("resize", updatePlacement);
    };
  }, [open, updatePlacement]);

  // Debounced search ke BE saat query berubah. Query kosong (baru `@`) juga
  // dipanggil ke BE untuk saran default (opsi B) — dibatasi maks 5 hasil.
  // Error dari BE ditampilkan apa adanya (implementasi defensif, tanpa tebak).
  useEffect(() => {
    if (query === null) return;
    const kwd = query.trim();
    const limit = kwd ? MAX_RESULTS : DEFAULT_SUGGESTION_LIMIT;

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchCommentUsers(kwd);
        if (!active) return;
        const list = Array.isArray(data) ? (data as CommentUserSearchUser[]) : [];
        setResults(list.slice(0, limit));
      } catch (err) {
        if (!active) return;
        setResults([]);
        setError(err instanceof Error ? err.message : "Gagal mencari pengguna.");
      } finally {
        if (active) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const emitMentions = useCallback(
    (next: MentionSelection[]) => {
      setMentions(next);
      if (onMentionsChange) onMentionsChange(next);
    },
    [onMentionsChange]
  );

  const insertMention = useCallback(
    (user: CommentUserSearchUser) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const caret = textarea.selectionStart ?? value.length;
      const detected = detectMentionQuery(value, caret);
      if (!detected) return;

      const name = (user.nama || "").trim() || "Pengguna";
      const mentionText = `@${name} `;
      const nextValue = value.slice(0, detected.atIndex) + mentionText + value.slice(caret);

      onChange(nextValue);

      // Catat ID user (hindari duplikasi).
      const nextMentions = mentions.some((m) => m.id === user.id)
        ? mentions
        : [...mentions, { id: user.id, nama: name }];
      emitMentions(nextMentions);

      setOpen(false);
      setQuery(null);

      // Pindahkan caret ke akhir mention setelah React merender value baru.
      const nextCaret = detected.atIndex + mentionText.length;
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(nextCaret, nextCaret);
      });
    },
    [value, onChange, detectMentionQuery, mentions, emitMentions]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      onChange(next);
      syncMentionState(next, e.target.selectionStart ?? next.length);
    },
    [onChange, syncMentionState]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }

      const hasResults = results.length > 0;
      if (!hasResults) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const user = results[activeIndex];
        if (user) insertMention(user);
      }
    },
    [open, results, activeIndex, insertMention]
  );

  // Tutup dropdown saat klik di luar area komponen.
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (textareaRef.current && !textareaRef.current.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const showDropdown = open && query !== null;

  return (
    <div className="relative">
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listId : undefined}
        aria-activedescendant={
          showDropdown && results[activeIndex] ? `${listId}-option-${activeIndex}` : undefined
        }
        className={className}
      />

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Pilih pengguna untuk mention"
          className={`absolute z-20 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
            placement === "up" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {loading ? (
            <li className="px-3 py-2 text-xs text-slate-500">Mencari pengguna...</li>
          ) : error ? (
            <li className="px-3 py-2 text-xs text-rose-600">{error}</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500">Pengguna tidak ditemukan.</li>
          ) : (
            results.map((user, index) => (
              <li
                key={user.id}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  index === activeIndex ? "bg-slate-100" : "bg-white"
                }`}
              >
                {user.fotoProfil ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.fotoProfil}
                    alt={user.nama}
                    className="h-7 w-7 shrink-0 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-bold uppercase text-white">
                    {(user.nama || "U").charAt(0)}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold text-slate-800">
                    {user.gelar ? `${user.nama}, ${user.gelar}` : user.nama}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
