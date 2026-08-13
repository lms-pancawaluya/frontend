import Image from "next/image";
import Link from "next/link";
import RegisterForm from "../components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[var(--color-pale)] px-4 py-10 relative overflow-hidden">
      
      {/* ================= 0. BACKGROUND GAMBAR SAMAR ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-multiply">
        <Image
          src="/bg-classroom.jpg"
          alt="Classroom Background"
          fill
          priority
          className="object-cover object-center grayscale-[20%]"
        />
      </div>

      {/* Overlay Gradient Lembut untuk Menyatukan Warna Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--color-pale)] via-transparent to-[var(--color-pale)] opacity-80 pointer-events-none" />

      {/* ================= ELEMEN DEKORATIF BACKGROUND ================= */}

      {/* 1. Siku Kuning L-Shape (Kiri Atas) */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-sm opacity-80 pointer-events-none z-10" />

      {/* 2. Siku Kuning L-Shape (Kiri Bawah) */}
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-sm opacity-80 pointer-events-none z-10" />

      {/* 3. Siku Kuning L-Shape (Kanan Atas) */}
      <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-sm opacity-80 pointer-events-none z-10" />

      {/* 4. Pixel Grid Kotak Biru (Kanan Atas) */}
      <div className="absolute top-12 right-16 hidden sm:grid grid-cols-3 gap-2 opacity-25 pointer-events-none z-10">
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
      </div>

      {/* 5. Loop Ring Lengkung Biru Besar (Kanan Bawah) */}
      <div className="absolute -bottom-16 -right-16 w-72 h-72 border-[24px] border-sky-400/20 rounded-full pointer-events-none z-10" />

      {/* 6. Aksen Lingkaran Kuning & Ring Biru Floating (Sisi Kiri) */}
      <div className="absolute top-1/3 left-12 hidden md:block pointer-events-none opacity-70 z-10">
        <div className="w-7 h-7 bg-amber-400 rounded-full mb-4 shadow-sm" />
        <div className="w-12 h-12 border-4 border-sky-500 rounded-full" />
      </div>

      {/* 7. Pixel Grid Kotak Biru (Kiri Bawah) */}
      <div className="absolute bottom-16 left-20 hidden md:grid grid-cols-2 gap-2 opacity-20 pointer-events-none z-10">
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
        <div className="w-6 h-6 bg-sky-500 rounded-md"></div>
      </div>

      {/* ================= CARD UTAMA REGISTER ================= */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[var(--color-border-soft)] p-8 animate-fade-in relative z-20">
        <div className="text-center mb-6">
          <div className="inline-block bg-[var(--color-pale)] text-[var(--color-navy)] text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-[var(--color-border-soft)]">
            Pancawaluya
          </div>

          <h1 className="font-[family-name:var(--font-heading,var(--font-display))] text-2xl font-bold text-[var(--color-navy)] tracking-tight">
            Daftar Akun Guru
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Buat akun untuk mulai belajar Pancawaluya
          </p>
        </div>

        <RegisterForm />

        <p className="text-sm text-gray-500 text-center mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[var(--color-accent)] font-medium hover:underline">
            Login di sini
          </Link>
        </p>
      </div>

    </div>
  );
}