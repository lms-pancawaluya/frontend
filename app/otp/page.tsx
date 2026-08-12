"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Konfigurasi URL Backend Railway
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-72a3.up.railway.app";

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const canResend = timer === 0;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    const digitOnly = value.replace(/\D/g, "");
    if (!digitOnly && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = digitOnly.slice(-1);
    setOtp(newOtp);
    setError(null);

    if (digitOnly && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const digitsOnly = pastedText.replace(/\D/g, "").slice(0, 6);

    if (digitsOnly.length > 0) {
      const newOtp = [...otp];
      digitsOnly.split("").forEach((char, idx) => {
        newOtp[idx] = char;
      });

      setOtp(newOtp);
      setError(null);

      const nextFocusIndex = Math.min(digitsOnly.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Silakan masukkan 6 digit kode OTP secara lengkap.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Menembak langsung ke Backend Railway
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.pesan || data.message || "Kode OTP salah atau telah kadaluwarsa.");
      }

      router.push("/login?verified=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kode OTP salah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setTimer(60);
    setError(null);

    try {
      // Menembak langsung ke Backend Railway
      await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("Gagal mengirim ulang OTP", err);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[var(--color-border-soft)] p-8 animate-fade-in relative z-20">
      <div className="text-center mb-6">
        <div className="inline-block bg-[var(--color-pale)] text-[var(--color-navy)] text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-[var(--color-border-soft)]">
          Pancawaluya
        </div>

        <h1 className="font-[family-name:var(--font-heading,var(--font-display))] text-2xl font-bold text-[var(--color-navy)] tracking-tight">
          Verifikasi Kode OTP
        </h1>

        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Masukkan 6 digit kode verifikasi yang telah dikirim ke email{" "}
          <span className="font-semibold text-slate-800 break-all">{email || "Anda"}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 font-mono"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join("").length < 6}
          className="w-full bg-[var(--color-navy)] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Memverifikasi...</span>
            </>
          ) : (
            "Verifikasi OTP"
          )}
        </button>
      </form>

      <div className="text-center space-y-2 pt-5 border-t border-slate-100 mt-6 text-xs text-gray-500">
        <p>
          Tidak menerima kode?{" "}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              Kirim Ulang OTP
            </button>
          ) : (
            <span className="text-gray-400">
              Kirim ulang dalam <strong className="text-slate-700">{timer} detik</strong>
            </span>
          )}
        </p>
        <div>
          <Link href="/login" className="text-gray-400 hover:text-gray-600 text-xs font-medium transition">
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[var(--color-pale)] px-4 py-10 relative overflow-hidden">
      {/* BACKGROUND GAMBAR SAMAR */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-15 mix-blend-multiply">
        <Image
          src="/bg-classroom.jpg"
          alt="Classroom Background"
          fill
          priority
          className="object-cover object-center grayscale-[20%]"
        />
      </div>

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--color-pale)] via-transparent to-[var(--color-pale)] opacity-80 pointer-events-none" />

      {/* ELEMEN DEKORATIF BACKGROUND */}
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

      <div className="absolute bottom-16 left-20 hidden md:grid grid-cols-2 gap-2 opacity-20 pointer-events-none z-10">
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
      </div>

      {/* CARD UTAMA OTP */}
      <Suspense fallback={<p className="text-sm text-slate-500 z-20">Memuat halaman OTP...</p>}>
        <OtpContent />
      </Suspense>
    </div>
  );
}
