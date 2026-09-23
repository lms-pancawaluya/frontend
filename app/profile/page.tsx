"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminProfileView from "./AdminProfileView";
import GuruProfileView from "./GuruProfileView";
import { API_URL, fetchApi } from "@/lib/api";

interface ProfileData {
  id: string;
  nama: string;
  email: string;
  role: string;
  gelar?: string;
  nip?: string;
  sekolah?: string;
  noHp?: string;
  fotoProfil?: string;
}

// Sidebar mengarah ke /profile?tab=personal|progress|security (lihat Sidebar.tsx →
// getProfileSubItems). Nilai query-nya beda penamaan dari tab internal GuruProfileView
// ("profil" | "progres" | "keamanan"), jadi dipetakan di sini.
export type GuruProfileTab = "profil" | "progres" | "keamanan";

const TAB_QUERY_MAP: Record<string, GuruProfileTab> = {
  personal: "profil",
  progress: "progres",
  security: "keamanan",
};

function parseProfileTabParam(tabParam: string | null): GuruProfileTab {
  if (!tabParam) return "profil";
  return TAB_QUERY_MAP[tabParam] ?? "profil";
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageWithTab />
    </Suspense>
  );
}

// Membaca ?tab= dan menjadikannya bagian dari `key`, supaya setiap kali menu Sidebar
// (Data Pribadi & Instansi / Progress Pembelajaran / Keamanan Akun) diklik, GuruProfileView
// remount dengan tab aktif yang benar — tanpa useEffect+setState tambahan.
function ProfilePageWithTab() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = parseProfileTabParam(tabParam);

  return <ProfilePageContent key={tabParam ?? "personal"} initialTab={initialTab} />;
}

function ProfilePageContent({ initialTab }: { initialTab: GuruProfileTab }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
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
      const res = await fetchApi(`${API_URL}/api/users/profile/me`, {
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
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      await fetchProfile();
    };

    void loadProfile();
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 text-center max-w-md dark:bg-slate-900 dark:border-red-800">
          <p className="text-red-600 font-medium text-sm mb-4 dark:text-red-400">{error}</p>
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

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-pale)] py-10 px-4">
      {profile.role === "admin" ? (
        <AdminProfileView profile={profile} onRefresh={fetchProfile} />
      ) : (
        <GuruProfileView
          profile={profile}
          onRefresh={fetchProfile}
          initialTab={profile.role === "pengajar" ? "profil" : initialTab}
          hideProgress={profile.role === "pengajar"}
        />
      )}
    </div>
  );
}
