"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUsers } from "@/services/user.service";
import { getModules } from "@/services/module.service";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);

    if (currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function fetchSummary() {
      try {
        const [users, modules] = await Promise.all([getUsers(), getModules()]);
        setTotalUsers(users.length);
        setTotalModules(modules.length);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat ringkasan data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [router]);

  if (loading) {
    return <p className="text-center mt-16">Memuat dashboard admin...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Admin</h1>
      <p className="text-gray-500 mb-8">
        Kelola akun guru dan modul pembelajaran Pancawaluya
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded border border-red-200 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-500 mb-1">Total Pengguna</p>
          <p className="text-3xl font-bold text-gray-800">{totalUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-500 mb-1">Total Modul</p>
          <p className="text-3xl font-bold text-gray-800">{totalModules}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="bg-blue-600 text-white rounded-xl p-6 hover:bg-blue-700 transition"
        >
          <h2 className="font-semibold mb-1">Kelola Akun Guru →</h2>
          <p className="text-sm text-blue-100">
            Lihat dan kelola daftar pengguna terdaftar
          </p>
        </Link>
        <Link
          href="/admin/modules"
          className="bg-green-600 text-white rounded-xl p-6 hover:bg-green-700 transition"
        >
          <h2 className="font-semibold mb-1">Kelola Modul →</h2>
          <p className="text-sm text-green-100">
            Tambah, edit, atau hapus modul Pancawaluya
          </p>
        </Link>
      </div>
    </div>
  );
}