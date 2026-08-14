"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form States
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | ""; text: string }>({
    type: "",
    text: "",
  });

  // Step 1: Kirim Email OTP
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await forgotPassword(email);
      setMessage({
        type: "success",
        text: `Kode OTP 6 digit telah dikirim ke ${email}`,
      });
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg || "Gagal mengirim OTP" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verifikasi OTP
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setMessage({ type: "error", text: "Kode OTP harus berisi 6 digit angka." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await verifyResetOtp(email, otpCode);
      setMessage({
        type: "success",
        text: "Kode OTP valid. Silakan buat password baru Anda.",
      });
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg || "Kode OTP tidak valid" });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Simpan Password Baru
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordBaru.length < 6) {
      setMessage({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await resetPassword(email, passwordBaru);
      setMessage({
        type: "success",
        text: "Password berhasil diperbarui! Mengalihkan ke halaman login...",
      });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg || "Gagal mereset password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[var(--color-pale)] px-4 py-10 relative overflow-hidden">
      
      {/* ================= BACKGROUND GAMBAR SAMAR ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-multiply">
        <Image
          src="/bg-classroom.jpg"
          alt="Classroom Background"
          fill
          priority
          className="object-cover object-center grayscale-[20%]"
        />
      </div>

      {/* Overlay Gradient Lembut */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--color-pale)] via-transparent to-[var(--color-pale)] opacity-80 pointer-events-none" />

      {/* ================= ELEMEN DEKORATIF BACKGROUND ================= */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-sm opacity-80 pointer-events-none z-10" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-sm opacity-80 pointer-events-none z-10" />
      <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-sm opacity-80 pointer-events-none z-10" />

      <div className="absolute top-12 right-16 hidden sm:grid grid-cols-3 gap-2 opacity-25 pointer-events-none z-10">
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
      </div>

      <div className="absolute -bottom-16 -right-16 w-72 h-72 border-[24px] border-sky-400/20 rounded-full pointer-events-none z-10" />

      <div className="absolute top-1/3 left-12 hidden md:block pointer-events-none opacity-70 z-10">
        <div className="w-7 h-7 bg-amber-400 rounded-full mb-4 shadow-sm" />
        <div className="w-12 h-12 border-4 border-sky-500 rounded-full" />
      </div>

      {/* ================= CARD UTAMA RESET PASSWORD ================= */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[var(--color-border-soft)] p-8 animate-fade-in relative z-20 space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-1">
          <h1 className="font-[family-name:var(--font-heading,var(--font-display))] text-2xl font-bold text-[var(--color-navy)] tracking-tight">
            Lupa Password
          </h1>
          <p className="text-xs text-gray-500">
            {step === 1 && "Langkah 1: Masukkan email terdaftar Anda"}
            {step === 2 && "Langkah 2: Masukkan kode OTP 6 digit dari email"}
            {step === 3 && "Langkah 3: Buat password baru untuk akun Anda"}
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 px-4">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            1
          </span>
          <div className={`h-1 w-12 rounded transition-all ${step >= 2 ? "bg-[var(--color-navy)]" : "bg-slate-200"}`} />
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 2 ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            2
          </span>
          <div className={`h-1 w-12 rounded transition-all ${step >= 3 ? "bg-[var(--color-navy)]" : "bg-slate-200"}`} />
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 3 ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            3
          </span>
        </div>

        {/* Alert Message */}
        {message.text && (
          <div
            className={`p-3 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            <span>{message.text}</span>
          </div>
        )}

        {/* FORM STEP 1: Email */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Terdaftar</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  placeholder="Masukkan email terdaftar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-navy)] focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-navy)] hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? "Mengirim Kode..." : "Kirim Kode OTP"}
            </button>
          </form>
        )}

        {/* FORM STEP 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kode OTP (6 Digit)</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-navy)] focus:bg-white transition-all text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-navy)] hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : "Verifikasi OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-gray-500 hover:text-slate-800 font-medium transition-colors"
            >
              Ubah Email
            </button>
          </form>
        )}

        {/* FORM STEP 3: Password Baru */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password Baru</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Masukkan password baru"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  className="w-full text-xs pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-navy)] focus:bg-white transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {showPassword ? "Sembunyi" : "Lihat"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Konfirmasi Password Baru</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Ulangi password baru"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-navy)] focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-navy)] hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? "Menyimpan Password..." : "Simpan Password Baru"}
            </button>
          </form>
        )}

        {/* Footer Back Link */}
        <p className="text-sm text-gray-500 text-center pt-2">
          Kembali ke{" "}
          <Link
            href="/login"
            className="text-[var(--color-accent)] font-medium hover:underline transition-colors"
          >
            Halaman Login
          </Link>
        </p>

      </div>
    </div>
  );
}