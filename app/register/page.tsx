import RegisterForm from "../components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <div className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Pancawaluya
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Akun Guru</h1>
          <p className="text-sm text-gray-500 mt-1">
            Buat akun untuk mulai belajar Pancawaluya
          </p>
        </div>

        <RegisterForm />

        <p className="text-sm text-gray-500 text-center mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}