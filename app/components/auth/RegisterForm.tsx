"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-72a3.up.railway.app";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper untuk format otomatis NIP: YYYY-MM-DD-YYYY-MM-X-NNN
  const formatNIP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 18);
    const parts = [];

    if (digits.length > 0) parts.push(digits.slice(0, 4));   // Tahun Lahir (YYYY)
    if (digits.length > 4) parts.push(digits.slice(4, 6));   // Bulan Lahir (MM)
    if (digits.length > 6) parts.push(digits.slice(6, 8));   // Tanggal Lahir (DD)
    if (digits.length > 8) parts.push(digits.slice(8, 12));  // Tahun TMT (YYYY)
    if (digits.length > 12) parts.push(digits.slice(12, 14)); // Bulan TMT (MM)
    if (digits.length > 14) parts.push(digits.slice(14, 15)); // Jenis Kelamin (X)
    if (digits.length > 15) parts.push(digits.slice(15, 18)); // No. Urut (NNN)

    return parts.join("-");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "nip") {
      setFormData((prev) => ({ ...prev, nip: formatNIP(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.nama,
          nip: formData.nip, // Mengirim format ber-strip atau bisa gunakan .replace(/\D/g, "") jika backend butuh angka saja
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.pesan || data.message || "Gagal mendaftar. Silakan coba lagi.");
      }

      router.push(`/otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* NAMA LENGKAP */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Nama Lengkap
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            name="nama"
            required
            value={formData.nama}
            onChange={handleChange}
            placeholder="Nama lengkap Anda"
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
          />
        </div>
      </div>

      {/* NIP (AUTO FORMATTING WITH DASHES) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          NIP (Nomor Induk Pegawai)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
            </svg>
          </div>
          <input
            type="text"
            name="nip"
            maxLength={24} // 18 digit + 6 strip
            required
            value={formData.nip}
            onChange={handleChange}
            placeholder="Nomor Induk Pegawai"
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
          />
        </div>
      </div>

      {/* EMAIL */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="nama@gmail.com"
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Buat password"
            className="w-full pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium transition"
          >
            {showPassword ? "Sembunyi" : "Lihat"}
          </button>
        </div>
      </div>

      {/* KONFIRMASI PASSWORD */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Konfirmasi Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Ulangi password Anda"
            className="w-full pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium transition"
          >
            {showConfirmPassword ? "Sembunyi" : "Lihat"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-navy)] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed mt-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Mendaftarkan...</span>
          </>
        ) : (
          "Daftar"
        )}
      </button>
    </form>
  );
}
