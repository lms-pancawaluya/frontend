"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) {
    return <p className="text-center mt-16">Memuat...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Selamat datang, {user.nama}! 👋
      </h1>
      <p className="text-gray-500 mb-8">
        Ini adalah dashboard Guru untuk memulai pembelajaran Pancawaluya.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-800 mb-3">Informasi Akun</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Nama:</span> {user.nama}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Role:</span> {user.role}</p>
        </div>
      </div>
    </div>
  );
}