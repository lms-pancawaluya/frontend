"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { formatNipInput } from "@/lib/formatNip";

export default function RegisterForm() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    email: "",
    password: "",
    konfirmasiPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handler khusus untuk NIP (Auto Format)
  const handleNipChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNipInput(e.target.value);
    setFormData((prev) => ({ ...prev, nip: formatted }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validasi Password
    if (formData.password !== formData.konfirmasiPassword) {
      setErrorMsg("Konfirmasi password tidak cocok");
      return;
    }

    // 2. Validasi NIP (18 angka murni)
    const rawNip = formData.nip.replace(/\D/g, "");
    if (rawNip.length < 18) {
      setErrorMsg("NIP harus terdiri dari 18 digit angka");
      return;
    }

    // 3. Validasi Email
    if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
      setErrorMsg("Email harus menggunakan akhiran @gmail.com");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.nama,
          nip: rawNip,
          email: formData.email,
          password: formData.password,
          role: "GURU",
        }),
      });

      const json = await res.json();

      if (json.sukses) {
        // Otomatis pindah ke halaman OTP sambil membawa parameter email
        router.push(`/otp?email=${encodeURIComponent(formData.email)}`);
      } else {
        setErrorMsg(json.pesan || "Gagal melakukan pendaftaran");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      {/* Input Nama Lengkap */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Nama Lengkap
        </label>
        <input
          type="text"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          placeholder="Nama lengkap Anda"
          required
          className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
        />
      </div>

      {/* Input NIP */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          NIP (Nomor Induk Pegawai)
        </label>
        <input
          type="text"
          value={formData.nip}
          onChange={handleNipChange}
          placeholder="1985-03-30-2010-01-1-002"
          maxLength={24}
          required
          className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none tracking-wide font-mono"
        />
      </div>

      {/* Input Email */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="guru@gmail.com"
          required
          className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
        />
      </div>

      {/* Input Password */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Buat password"
            required
            className="w-full text-sm border border-slate-200 rounded-xl p-2.5 pr-10 focus:ring-2 focus:ring-sky-500 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
      </div>

      {/* Input Konfirmasi Password */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Konfirmasi Password
        </label>
        <div className="relative">
          <input
            type={showKonfirmasiPassword ? "text" : "password"}
            value={formData.konfirmasiPassword}
            onChange={(e) => setFormData({ ...formData, konfirmasiPassword: e.target.value })}
            placeholder="Ulangi password Anda"
            required
            className="w-full text-sm border border-slate-200 rounded-xl p-2.5 pr-10 focus:ring-2 focus:ring-sky-500 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowKonfirmasiPassword(!showKonfirmasiPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            {showKonfirmasiPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
      </div>

      {/* Tombol Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-[var(--color-navy)] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Mendaftar..." : "Daftar"}
      </button>
    </form>
  );
}