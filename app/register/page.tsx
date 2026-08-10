import RegisterForm from "../components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[var(--color-pale)] px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[var(--color-border-soft)] p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-block bg-[var(--color-pale)] text-[var(--color-navy)] text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-[var(--color-border-soft)]">
            Pancawaluya
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)]">
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