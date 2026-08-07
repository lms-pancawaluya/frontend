"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getModules } from "@/services/module.service";
import { getProgress } from "@/services/progress.service";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [totalModules, setTotalModules] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));

    async function fetchProgress() {
      try {
        const [modulesData, progressData] = await Promise.all([
          getModules(),
          getProgress(),
        ]);

        setTotalModules(modulesData.length);

        const selesai = progressData.filter(
          (p: { status: string }) => p.status === "selesai"
        );
        setCompletedCount(selesai.length);
      } catch (err) {
        console.error("Gagal memuat progress:", err);
      } finally {
        setLoadingProgress(false);
      }
    }

    fetchProgress();
  }, [router]);

  if (!user) {
    return <p className="text-center mt-16">Memuat...</p>;
  }

  const progressPercent =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Selamat datang, {user.nama}! 👋
      </h1>
      <p className="text-gray-500 mb-8">
        Ini adalah dashboard Guru untuk memulai pembelajaran Pancawaluya.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Progress Belajar</h2>

        {loadingProgress ? (
          <p className="text-sm text-gray-500">Memuat progress...</p>
        ) : (
          <>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                {completedCount} dari {totalModules} modul selesai
              </span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}
      </div>

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