"use client";

import { useState, useEffect, useCallback } from "react";
import AdminProfileView from "./AdminProfileView";
import GuruProfileView from "./GuruProfileView";

export default function ProfilePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token tidak ditemukan, silakan login kembali.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.sukses) {
        setProfile(json.data);
      } else {
        setError(json.pesan || "Gagal memuat profil");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[var(--color-pale)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-navy)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[var(--color-pale)] p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 text-center max-w-md">
          <p className="text-red-600 font-medium text-sm mb-4">{error}</p>
          <a
            href="/login"
            className="inline-block bg-[var(--color-navy)] text-white text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-pale)] py-10 px-4">
      {profile?.role === "admin" ? (
        <AdminProfileView profile={profile} onRefresh={fetchProfile} />
      ) : (
        <GuruProfileView profile={profile} onRefresh={fetchProfile} />
      )}
    </div>
  );
}