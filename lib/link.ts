/**
 * Shared helpers for external Link learning materials.
 * Backend stores a plain external URL in `konten` for `tipe: "link"`.
 */

/** Returns the normalized URL when `value` is a valid http(s) URL, otherwise null. */
export function parseExternalUrl(value: string): string | null {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  return url.toString();
}

/** Returns an error message when the value is not a valid external URL, otherwise "". */
export function validateExternalUrl(value: string): string {
  if (!(value || "").trim()) return "URL wajib diisi.";
  if (!parseExternalUrl(value)) return "Masukkan URL yang valid (contoh: https://contoh.com).";
  return "";
}
