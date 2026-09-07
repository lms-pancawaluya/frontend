import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

/**
 * Shared fetch wrapper — injects ngrok-skip-browser-warning on every request
 * to the backend. Drop-in replacement for `fetch(url, init)`.
 */
export function fetchApi(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("ngrok-skip-browser-warning", "true");
  return fetch(url, { ...init, headers });
}

/** Backend base URL from env */
export { API_URL };

export default api;