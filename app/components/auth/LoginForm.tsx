"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth.service";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        placeholder="nama@sekolah.sch.id"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        placeholder="Masukkan password"
        required
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400"
    >
      {loading ? "Memproses..." : "Login"}
    </button>
  </form>
);
}