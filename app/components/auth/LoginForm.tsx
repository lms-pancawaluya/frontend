"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth.service";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("1. Mulai proses login...");

    try {
      const data = await loginUser(email, password);
      console.log("2. Login berhasil, data diterima:", data);

      if (data.user.role === "admin") {
        console.log("3. Redirect ke /admin");
        router.push("/admin");
      } else {
        console.log("3. Redirect ke /dashboard");
        router.push("/dashboard");
      }
    } catch (err) {
      console.log("X. Terjadi error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login gagal, silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 text-sm"
          placeholder="nama@gmail.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 text-sm"
            placeholder="Masukkan password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12c1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7-1.274-4.057-5.065-7-9.542-7-4.477 0-8.268 2.943-9.542 7z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400 mt-2"
      >
        {loading ? "Memproses..." : "Login"}
      </button>
    </form>
  );
}