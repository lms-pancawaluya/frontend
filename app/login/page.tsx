import Link from "next/link";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[var(--color-pale)] px-4 relative overflow-hidden">
      
      {/* ================= ELEMEN DEKORATIF BACKGROUND ================= */}

      {/* 1. Siku Kuning L-Shape (Kiri Atas) */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-sm opacity-80 pointer-events-none" />

      {/* 2. Siku Kuning L-Shape (Kiri Bawah) */}
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-sm opacity-80 pointer-events-none" />

      {/* 3. Siku Kuning L-Shape (Kanan Atas) */}
      <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-sm opacity-80 pointer-events-none" />

      {/* 4. Pixel Grid Kotak Biru (Kanan Atas) */}
      <div className="absolute top-12 right-16 hidden sm:grid grid-cols-3 gap-2 opacity-25 pointer-events-none">
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
      </div>

      {/* 5. Loop Ring Lengkung Biru Besar (Kanan Bawah) */}
      <div className="absolute -bottom-16 -right-16 w-72 h-72 border-[24px] border-sky-400/20 rounded-full pointer-events-none" />

      {/* 6. Aksen Lingkaran Kuning & Ring Biru Floating (Sisi Kiri) */}
      <div className="absolute top-1/3 left-12 hidden md:block pointer-events-none opacity-70">
        <div className="w-7 h-7 bg-amber-400 rounded-full mb-4 shadow-sm" />
        <div className="w-12 h-12 border-4 border-sky-500 rounded-full" />
      </div>

      {/* 7. Pixel Grid Kotak Biru (Kiri Bawah) */}
      <div className="absolute bottom-16 left-20 hidden md:grid grid-cols-2 gap-2 opacity-20 pointer-events-none">
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
      </div>

      {/* ================= CARD UTAMA LOGIN ================= */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[var(--color-border-soft)] p-8 animate-fade-in relative z-10">
        <div className="text-center mb-6">
          <div className="inline-block bg-[var(--color-pale)] text-[var(--color-navy)] text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-[var(--color-border-soft)]">
            Pancawaluya
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)]">
            Selamat Datang
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Masuk untuk melanjutkan pembelajaran Anda
          </p>
        </div>

        <LoginForm />

        <p className="text-sm text-gray-500 text-center mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[var(--color-accent)] font-medium hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>

    </div>
  );
}