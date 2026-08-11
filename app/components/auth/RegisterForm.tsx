"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    // Reset error jika pengguna mulai mengetik ulang password / konfirmasi password
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi Kesesuaian Password di Frontend
    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi password tidak cocok dengan password di atas.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://backend-production-72a3.up.railway.app/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama: formData.nama,
            email: formData.email,
            password: formData.password,
            role: "guru",
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.sukses !== false) {
        alert("Registrasi berhasil! Silakan login.");
        router.push("/login");
      } else {
        setError(data.pesan || "Registrasi gagal, periksa kembali data Anda.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pesan Error Umum */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
          {error}
        </div>
      )}

      {/* Input Nama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama Lengkap
        </label>
        <input
          type="text"
          name="nama"
          value={formData.nama}
          onChange={handleChange}
          placeholder="Nama lengkap Anda"
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm disabled:opacity-50"
          required
          disabled={loading}
        />
      </div>

      {/* Input Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="nama@email.com"
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm disabled:opacity-50"
          required
          disabled={loading}
        />
      </div>

      {/* Input Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Buat password"
            className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm disabled:opacity-50"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            disabled={loading}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
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
                strokeWidth={1.8}
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

      {/* Input Konfirmasi Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Konfirmasi Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Ulangi password Anda"
            className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
              isPasswordMismatch
                ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                : "border-[var(--color-border-soft)] focus:ring-[var(--color-accent)]"
            }`}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors"
            aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
            disabled={loading}
          >
            {showConfirmPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
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
                strokeWidth={1.8}
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
        {/* Teks Peringatan Real-time saat mengetik */}
        {isPasswordMismatch && (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">
            Password tidak cocok!
          </p>
        )}
      </div>

      {/* Tombol Submit */}
      <button
        type="submit"
        disabled={loading || isPasswordMismatch}
        className="w-full bg-[var(--color-navy)] text-white font-medium py-2.5 rounded-xl hover:opacity-90 transition shadow-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Memproses..." : "Daftar"}
      </button>
    </form>
  );
}