"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUsers, deleteUser } from "@/services/user.service";

interface UserItem {
  id: string;
  nama: string;
  email: string;
  role: string;
  createdAt: string;
  modulSelesai: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    async function fetchUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat data pengguna.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]);

  async function handleDelete(id: string, nama: string) {
    const confirmed = window.confirm(`Yakin ingin menghapus akun guru "${nama}"?`);
    if (!confirmed) return;

    setDeletingId(id);

    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal menghapus pengguna.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
  return <p className="text-center mt-16 text-gray-500">Memuat data pengguna...</p>;
}

if (error) {
  return (
    <div className="max-w-md mx-auto mt-16 p-4">
      <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
        {error}
      </div>
    </div>
  );
}

return (
  <div className="max-w-5xl mx-auto p-6">
    <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-2">
      Kelola Akun Guru
    </h1>
    <p className="text-gray-500 mb-8">
      Daftar seluruh pengguna terdaftar di sistem
    </p>

    <div className="bg-white border border-[var(--color-border-soft)] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-pale)] border-b border-[var(--color-border-soft)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Email</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Role</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-navy)]">Modul Selesai</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-navy)]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-border-soft)] last:border-0">
                <td className="px-4 py-3 text-gray-800">{u.nama}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.modulSelesai}</td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? (
                    <span className="text-xs text-gray-400 block text-right">—</span>
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-sm border border-[var(--color-border-soft)] text-[var(--color-navy)] px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(u.id, u.nama)}
                        disabled={deletingId === u.id}
                        className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition disabled:text-gray-400 disabled:border-gray-200"
                      >
                        {deletingId === u.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}