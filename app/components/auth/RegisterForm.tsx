"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/auth.service";

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama!");
      return;
    }

    setLoading(true);

    try {
      await registerUser(formData.nama, formData.email, formData.password);
      alert("Registrasi berhasil! Silakan login.");
      router.push("/login");
    } catch (err) {
  if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registrasi gagal, silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    } {
      setLoading(false);
    }
  }

return (
  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
    {error && (
      <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
        {error}
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Nama Lengkap</label>
      <input
        type="text"
        name="nama"
        value={formData.nama}
        onChange={handleChange}
        className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        placeholder="Nama Guru"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Email</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        placeholder="nama@sekolah.sch.id"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Password</label>
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Konfirmasi Password</label>
      <input
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        required
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400"
    >
      {loading ? "Memproses..." : "Daftar"}
    </button>
  </form>
);
}