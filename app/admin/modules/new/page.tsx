"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createModule } from "@/services/module.service";
import { getCourses } from "@/services/course.service";
import { getCourseModulePermissions } from "@/lib/rbac";
import type { Course } from "@/types/course";

const aspekOptions = ["cageur", "bageur", "bener", "pinter", "singer", "umum"];

function NewModuleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId") || "";

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [formData, setFormData] = useState({
    courseId: preselectedCourseId,
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
    urutan: 1,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAccess() {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);
    const perms = getCourseModulePermissions(currentUser?.role);

    // Guru read-only tidak boleh mengakses halaman tambah modul.
    if (!perms.canCreate) {
      router.push("/admin/modules");
      return;
    }

    await Promise.resolve();
    setCheckingAccess(false);
    }

    checkAccess();
  }, [router]);

  useEffect(() => {
    if (checkingAccess) return;

    async function fetchCourses() {
      const data = await getCourses();
      setCourses(data);
      setLoadingCourses(false);
    }
    fetchCourses();
  }, [checkingAccess]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "urutan" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.courseId) {
      setError("Pilih course terlebih dahulu — setiap modul harus terhubung ke sebuah course.");
      return;
    }

    setLoading(true);

    try {
      await createModule(formData);
      router.push("/admin/modules");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal menambahkan modul.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingAccess) {
    return <p className="text-center mt-16 text-gray-500">Memeriksa akses...</p>;
  }

  return (
  <div className="max-w-xl mx-auto p-6">
    <button
      onClick={() => router.push("/admin/modules")}
      className="text-sm text-[var(--color-accent)] hover:underline mb-6"
    >
      ← Kembali ke daftar modul
    </button>

    <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-6">
      Tambah Modul Baru
    </h1>

    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Course</label>
        <select
          name="courseId"
          value={formData.courseId}
          onChange={handleChange}
          disabled={loadingCourses}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          required
        >
          <option value="" disabled>
            {loadingCourses ? "Memuat daftar course..." : "Pilih course"}
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.judul}
            </option>
          ))}
        </select>
        {!loadingCourses && courses.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Belum ada course. Buat course terlebih dahulu sebelum menambah modul.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Judul Modul</label>
        <input
          type="text"
          name="judul"
          value={formData.judul}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          placeholder="Modul Bageur - Percaya Diri & Kolaborasi"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Deskripsi</label>
        <textarea
          name="deskripsi"
          value={formData.deskripsi}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          rows={4}
          placeholder="Jelaskan isi modul ini secara singkat..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Aspek Pancawaluya</label>
        <select
          name="aspekPancawaluya"
          value={formData.aspekPancawaluya}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 capitalize focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        >
          {aspekOptions.map((aspek) => (
            <option key={aspek} value={aspek} className="capitalize">
              {aspek}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Urutan</label>
        <input
          type="number"
          name="urutan"
          value={formData.urutan}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          min={1}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || loadingCourses}
        className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400 mt-2"
      >
        {loading ? "Menyimpan..." : "Simpan Modul"}
      </button>
    </form>
  </div>
);
}

export default function NewModulePage() {
  return (
    <Suspense fallback={<p className="text-center mt-16 text-gray-500">Memuat halaman...</p>}>
      <NewModuleForm />
    </Suspense>
  );
}
