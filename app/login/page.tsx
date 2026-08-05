import LoginForm from "../components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <div className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Pancawaluya
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Selamat Datang</h1>
          <p className="text-sm text-gray-500 mt-1">
            Masuk untuk melanjutkan pembelajaran Anda
          </p>
        </div>

        <LoginForm />

        <p className="text-sm text-gray-500 text-center mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-blue-600 font-medium hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}