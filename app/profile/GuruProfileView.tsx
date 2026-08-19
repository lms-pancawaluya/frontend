"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import { formatNipDisplay } from "@/lib/formatNip";

interface ProgressItem {
  status: string;
  completedAt: string;
  module: {
    judul: string;
    aspekPancawaluya: string;
  };
}

interface GuruProfileProps {
  profile: {
    id: string;
    nama: string;
    email: string;
    role: string;
    gelar?: string;
    nip?: string;
    sekolah?: string;
    alamatSekolah?: string;
    noHp?: string;
    fotoProfil?: string;
    progress?: ProgressItem[];
  };
  onRefresh: () => void;
}

interface SekolahData {
  nama: string;
  alamat: string;
}

const DATA_SEKOLAH_JABAR: Record<string, SekolahData[]> = {
  "Kota Bandung": [
    { nama: "SMA Negeri 1 Bandung", alamat: "Jl. Ir. H. Juanda No.93, Lb. Siliwangi, Kec. Coblong, Kota Bandung" },
    { nama: "SMA Negeri 2 Bandung", alamat: "Jl. Cihampelas No.173, Cipaganti, Kec. Coblong, Kota Bandung" },
    { nama: "SMA Negeri 3 Bandung", alamat: "Jl. Belitung No.8, Merdeka, Kec. Sumur Bandung, Kota Bandung" },
    { nama: "SMA Negeri 4 Bandung", alamat: "Jl. Gardujati No.20, Kebon Jeruk, Kec. Andir, Kota Bandung" },
    { nama: "SMA Negeri 5 Bandung", alamat: "Jl. Belitung No.8, Merdeka, Kec. Sumur Bandung, Kota Bandung" },
    { nama: "SMA Negeri 8 Bandung", alamat: "Jl. Solontongan No.3, Turangga, Kec. Lengkong, Kota Bandung" },
    { nama: "SMA Negeri 11 Bandung", alamat: "Jl. Kembar VII No.9, Cigereleng, Kec. Regol, Kota Bandung" },
    { nama: "SMK Negeri 1 Bandung", alamat: "Jl. Wastukencana No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung" },
    { nama: "SMK Negeri 3 Bandung", alamat: "Jl. Solontongan No.10, Turangga, Kec. Lengkong, Kota Bandung" },
  ],
  "Kab. Bandung": [
    { nama: "SMA Negeri 1 Baleendah", alamat: "Jl. R.A.A. Wiranatakoesoemah No.30, Baleendah, Kab. Bandung" },
    { nama: "SMA Negeri 1 Katapang", alamat: "Jl. Terusan Kopo KM.12.5, Katapang, Kab. Bandung" },
    { nama: "SMA Negeri 1 Margahayu", alamat: "Jl. KH. Wahid Hasyim No.387, Sulaiman, Kec. Margahayu, Kab. Bandung" },
    { nama: "SMA Negeri 1 Cileunyi", alamat: "Jl. Stasiun Cimekar, Cileunyi, Kab. Bandung" },
  ],
  "Kab. Bandung Barat": [
    { nama: "SMA Negeri 1 Lembang", alamat: "Jl. Raya Lembang No.137, Lembang, Kab. Bandung Barat" },
    { nama: "SMA Negeri 1 Padalarang", alamat: "Jl. Perintis Kemerdekaan No.2, Padalarang, Kab. Bandung Barat" },
    { nama: "SMA Negeri 1 Cisarua", alamat: "Jl. Kolonel Masturi No.64, Cisarua, Kab. Bandung Barat" },
  ],
  "Kota Cimahi": [
    { nama: "SMA Negeri 1 Cimahi", alamat: "Jl. Pasir Kumeli No.1, Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi" },
    { nama: "SMA Negeri 2 Cimahi", alamat: "Jl. Sriwijaya No.32, Setiamanah, Kec. Cimahi Tengah, Kota Cimahi" },
    { nama: "SMA Negeri 3 Cimahi", alamat: "Jl. Pesantren No.108, Cibabat, Kec. Cimahi Utara, Kota Cimahi" },
  ],
  "Kota Bogor": [
    { nama: "SMA Negeri 1 Bogor", alamat: "Jl. Ir. H. Juanda No.16, Paledang, Kec. Bogor Tengah, Kota Bogor" },
    { nama: "SMA Negeri 2 Bogor", alamat: "Jl. Keranji No.1, Budi Agung, Kec. Tanah Sereal, Kota Bogor" },
    { nama: "SMA Negeri 3 Bogor", alamat: "Jl. Pakuan No.4, Baranangsiang, Kec. Bogor Timur, Kota Bogor" },
  ],
  "Kab. Bogor": [
    { nama: "SMA Negeri 1 Cibinong", alamat: "Jl. Mayor Oking Jaya Atmaja No.73, Cibinong, Kab. Bogor" },
    { nama: "SMA Negeri 1 Ciawi", alamat: "Jl. Raya Tapos No.63, Ciawi, Kab. Bogor" },
  ],
  "Kota Depok": [
    { nama: "SMA Negeri 1 Depok", alamat: "Jl. Nusantara Raya No.317, Depok Jaya, Kec. Pancoran Mas, Kota Depok" },
    { nama: "SMA Negeri 2 Depok", alamat: "Jl. Limo Raya No.1, Limo, Kota Depok" },
  ],
  "Kota Bekasi": [
    { nama: "SMA Negeri 1 Bekasi", alamat: "Jl. KH. Agus Salim No.181, Bekasi Timur, Kota Bekasi" },
    { nama: "SMA Negeri 2 Bekasi", alamat: "Jl. Tangkuban Perahu Raya No.1, Kayuringin Jaya, Kota Bekasi" },
  ],
  "Kab. Bekasi": [
    { nama: "SMA Negeri 1 Cikarang Pusat", alamat: "Jl. Komplek Pemda Kab. Bekasi, Sukamahi, Cikarang Pusat" },
    { nama: "SMA Negeri 1 Cikarang Utara", alamat: "Jl. Fatahillah No.1, Cikarang Utara, Kab. Bekasi" },
  ],
  "Kota Sukabumi": [
    { nama: "SMA Negeri 1 Sukabumi", alamat: "Jl. R.E. Martadinata No.166, Cikole, Kota Sukabumi" },
    { nama: "SMA Negeri 2 Sukabumi", alamat: "Jl. Karamat No.93, Karamat, Kec. Gunungpuruh, Kota Sukabumi" },
  ],
  "Kab. Sukabumi": [
    { nama: "SMA Negeri 1 Cibadak", alamat: "Jl. Siliwangi No.123, Cibadak, Kab. Sukabumi" },
    { nama: "SMA Negeri 1 Palabuhanratu", alamat: "Jl. Raya Cisolok KM.1, Palabuhanratu, Kab. Sukabumi" },
  ],
  "Kab. Cianjur": [
    { nama: "SMA Negeri 1 Cianjur", alamat: "Jl. Pangeran Hidayatullah No.42, Skanagara, Kab. Cianjur" },
    { nama: "SMA Negeri 2 Cianjur", alamat: "Jl. Didi Prawiranataku No.1, Cianjur, Kab. Cianjur" },
  ],
  "Kab. Karawang": [
    { nama: "SMA Negeri 1 Karawang", alamat: "Jl. Ahmad Yani No.22, Nagasari, Kec. Karawang Barat, Kab. Karawang" },
    { nama: "SMA Negeri 2 Karawang", alamat: "Jl. Laks. L RE. Martadinata No.3, Karawang Barat, Kab. Karawang" },
  ],
  "Kab. Purwakarta": [
    { nama: "SMA Negeri 1 Purwakarta", alamat: "Jl. KK Singawinata No.83, Nagri Tengah, Kab. Purwakarta" },
  ],
  "Kab. Subang": [
    { nama: "SMA Negeri 1 Subang", alamat: "Jl. Ki Hajar Dewantara No.14, Karanganyar, Kab. Subang" },
  ],
  "Kab. Sumedang": [
    { nama: "SMA Negeri 1 Sumedang", alamat: "Jl. Prabu Geusan Ulun No.39, Regol Wetan, Kab. Sumedang" },
  ],
  "Kab. Garut": [
    { nama: "SMA Negeri 1 Garut", alamat: "Jl. Merdeka No.91, Jayaraga, Kec. Tarogong Kidul, Kab. Garut" },
  ],
  "Kota Tasikmalaya": [
    { nama: "SMA Negeri 1 Tasikmalaya", alamat: "Jl. Rumah Sakit No.28, Empangsari, Kec. Tawang, Kota Tasikmalaya" },
  ],
  "Kab. Tasikmalaya": [
    { nama: "SMA Negeri 1 Singaparna", alamat: "Jl. Pahlawan KHZ. Musthafa, Singaparna, Kab. Tasikmalaya" },
  ],
  "Kab. Ciamis": [
    { nama: "SMA Negeri 1 Ciamis", alamat: "Jl. Gunung Galunggung No.37, Ciamis, Kab. Ciamis" },
  ],
  "Kota Banjar": [
    { nama: "SMA Negeri 1 Banjar", alamat: "Jl. KH. Mustofa No.1, Banjar, Kota Banjar" },
  ],
  "Kab. Pangandaran": [
    { nama: "SMA Negeri 1 Pangandaran", alamat: "Jl. Merdeka No.182, Pananjung, Kab. Pangandaran" },
  ],
  "Kota Cirebon": [
    { nama: "SMA Negeri 1 Cirebon", alamat: "Jl. Wahidin Sudirohusodo No.81, Kejaksan, Kota Cirebon" },
  ],
  "Kab. Cirebon": [
    { nama: "SMA Negeri 1 Sumber", alamat: "Jl. Sultan Agung No.2, Sumber, Kab. Cirebon" },
  ],
  "Kab. Indramayu": [
    { nama: "SMA Negeri 1 Indramayu", alamat: "Jl. Soekarno Hatta No.2, Indramayu, Kab. Indramayu" },
  ],
  "Kab. Majalengka": [
    { nama: "SMA Negeri 1 Majalengka", alamat: "Jl. KH. Abdul Halim No.50, Majalengka, Kab. Majalengka" },
  ],
  "Kab. Kuningan": [
    { nama: "SMA Negeri 1 Kuningan", alamat: "Jl. Siliwangi No.55, Kuningan, Kab. Kuningan" },
  ],
};

const DAFTAR_GELAR = [
  "",
  "S.Pd.",
  "S.Pd.I.",
  "S.S.",
  "S.Si.",
  "S.T.",
  "S.Kom.",
  "S.E.",
  "S.Sos.",
  "M.Pd.",
  "M.Pd.I.",
  "M.Si.",
  "M.T.",
  "M.Kom.",
  "M.M.",
  "Dr.",
];

const getProfileFormData = (profile: GuruProfileProps["profile"]) => {
  let currentGelar = profile.gelar;
  let currentNip = profile.nip;

  if (typeof window !== "undefined") {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (!currentGelar) currentGelar = parsed.gelar || "";
        if (!currentNip) currentNip = parsed.nip || "";
      } catch {
        // Abaikan error parse
      }
    }
  }

  return {
    nama: profile.nama || "",
    gelar: currentGelar || "",
    email: profile.email || "",
    nip: currentNip || "",
    sekolah: profile.sekolah || "",
    alamatSekolah: profile.alamatSekolah || "",
    noHp: profile.noHp || "",
  };
};

const getInitialProfileState = (profile: GuruProfileProps["profile"]) => {
  const initialData = getProfileFormData(profile);
  const currentSchool = profile.sekolah || "";

  if (!currentSchool) {
    return {
      formData: initialData,
      selectedDaerah: "",
      ketikManual: false,
    };
  }

  let foundDaerah = "";
  let foundAlamat = profile.alamatSekolah || "";

  for (const [daerah, listSekolah] of Object.entries(DATA_SEKOLAH_JABAR)) {
    const item = listSekolah.find((s) => s.nama === currentSchool);
    if (item) {
      foundDaerah = daerah;
      if (!foundAlamat) foundAlamat = item.alamat;
      break;
    }
  }

  if (foundDaerah) {
    return {
      formData: { ...initialData, alamatSekolah: foundAlamat },
      selectedDaerah: foundDaerah,
      ketikManual: false,
    };
  }

  return {
    formData: initialData,
    selectedDaerah: "",
    ketikManual: true,
  };
};

const getProfileStateKey = (profile: GuruProfileProps["profile"]) =>
  JSON.stringify({
    id: profile.id,
    nama: profile.nama,
    email: profile.email,
    gelar: profile.gelar,
    nip: profile.nip,
    sekolah: profile.sekolah,
    alamatSekolah: profile.alamatSekolah,
    noHp: profile.noHp,
    fotoProfil: profile.fotoProfil,
  });

export default function GuruProfileView(props: GuruProfileProps) {
  return <GuruProfileViewContent key={getProfileStateKey(props.profile)} {...props} />;
}

function GuruProfileViewContent({ profile, onRefresh }: GuruProfileProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const getToken = () => localStorage.getItem("token") || "";

  const [initialProfileState] = useState(() => getInitialProfileState(profile));
  const [formData, setFormData] = useState(initialProfileState.formData);
  const [selectedDaerah, setSelectedDaerah] = useState<string>(initialProfileState.selectedDaerah);
  const [ketikManual, setKetikManual] = useState<boolean>(initialProfileState.ketikManual);

  const [activeTab, setActiveTab] = useState<"profil" | "progres" | "keamanan">("profil");

  const [passwordData, setPasswordData] = useState({
    passwordLama: "",
    passwordBaru: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const namaLengkapBerGelar = formData.gelar 
    ? `${formData.nama}, ${formData.gelar}` 
    : formData.nama;

  const totalModul = profile.progress?.length || 0;

  const handleNoHpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
    setFormData((prev) => ({ ...prev, noHp: value }));
  };

  const handleDaerahChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const daerah = e.target.value;
    setSelectedDaerah(daerah);
    setFormData((prev) => ({ ...prev, sekolah: "", alamatSekolah: "" }));
  };

  const handleSekolahSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const namaSekolah = e.target.value;
    const listSekolah = DATA_SEKOLAH_JABAR[selectedDaerah] || [];
    const itemTarget = listSekolah.find((s) => s.nama === namaSekolah);

    setFormData((prev) => ({
      ...prev,
      sekolah: namaSekolah,
      alamatSekolah: itemTarget ? itemTarget.alamat : "",
    }));
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Nama Lengkap" });
      return;
    }
    if (!formData.email.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Email" });
      return;
    }
    if (!formData.sekolah.trim()) {
      setMessage({ type: "error", text: "Mohon pilih atau isi asal Sekolah Anda" });
      return;
    }
    if (!formData.noHp.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Nomor HP" });
      return;
    }

    if (!formData.email.trim().toLowerCase().endsWith("@gmail.com")) {
      setMessage({
        type: "error",
        text: "Email harus berakhiran @gmail.com (contoh: nama@gmail.com)",
      });
      return;
    }

    if (!formData.noHp.startsWith("08")) {
      setMessage({
        type: "error",
        text: "Nomor HP harus diawali dengan 08",
      });
      return;
    }
    if (formData.noHp.length < 10) {
      setMessage({
        type: "error",
        text: "Nomor HP minimal 10 digit",
      });
      return;
    }

    setSavingProfile(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/users/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      const existingUser = localStorage.getItem("user");
      const parsedUser = existingUser ? JSON.parse(existingUser) : {};
      const updatedUser = {
        ...parsedUser,
        nama: formData.nama,
        gelar: formData.gelar,
        email: formData.email,
        nip: formData.nip,
        sekolah: formData.sekolah,
        alamatSekolah: formData.alamatSekolah,
        noHp: formData.noHp,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (json.sukses) {
        setMessage({ type: "success", text: json.pesan || "Profil berhasil diperbarui" });
        onRefresh();
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal memperbarui profil" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/users/profile/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(passwordData),
      });

      const json = await res.json();
      if (json.sukses) {
        setMessage({ type: "success", text: json.pesan || "Password berhasil diubah" });
        setPasswordData({ passwordLama: "", passwordBaru: "" });
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal mengubah password" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleFotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran file maksimal 5MB" });
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("foto", file);

    setUploadingFoto(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/upload/foto-profil`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formDataUpload,
      });

      const json = await res.json();
      if (json.sukses) {
        setMessage({ type: "success", text: "Foto profil berhasil diperbarui" });
        onRefresh();
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal mengunggah foto" });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengunggah foto profil" });
    } finally {
      setUploadingFoto(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* BANNER UTAMA — gradient navy → hijau, selaras dengan Dashboard */}
      <div className="relative bg-gradient-to-r from-[#002B66] via-[#0047A5] to-[#109B51] rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden">
        {/* Glow efek — aksen biru muda & emas khas Disdik Jabar */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#419AD6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-[#F3BF10]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Badge Atas */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-amber-300 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#F3BF10] animate-pulse" />
              LMS Panca Waluya Jabar
            </span>
          </div>

          {/* Profil Header & Foto */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
                  {profile.fotoProfil ? (
                    <Image src={profile.fotoProfil} alt="Foto Profil" fill className="object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-[#419AD6]">
                      {profile.nama?.charAt(0) || "G"}
                    </span>
                  )}
                  {uploadingFoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-medium">
                      Mengunggah...
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-white hover:bg-slate-50 text-[#0047A5] p-2 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFotoUpload} disabled={uploadingFoto} />
                </label>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {namaLengkapBerGelar}
                </h1>
                <p className="text-xs sm:text-sm text-slate-100/90 flex items-center gap-1.5 font-medium">
                  <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V5" />
                  </svg>
                  {formData.sekolah || "Sekolah Belum Diatur"}
                </p>
                <p className="text-[11px] text-slate-200/70 font-mono">
                  NIP: {formData.nip ? formatNipDisplay(formData.nip) : "Belum diatur"}
                </p>
              </div>
            </div>
          </div>

          {/* 3 WIDGET KARTU DI DALAM BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Peran Akun</p>
              <p className="text-lg font-bold text-white mt-1 capitalize">{profile.role || "Pendidik"}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Total Modul Dikelola</p>
              <p className="text-lg font-bold text-white mt-1">{totalModul} Modul</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Status Verifikasi NIP</p>
              <p className="text-lg font-bold text-white mt-1">
                {formData.nip ? "Terverifikasi" : "Belum Set"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT MESSAGES */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium border flex items-center gap-3 transition-all ${
            message.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs" 
              : "bg-rose-50 text-rose-800 border-rose-200 shadow-xs"
          }`}
        >
          {message.type === "success" ? (
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB NAVIGATION PILL STYLE */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl inline-flex gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("profil")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "profil"
              ? "bg-white text-slate-900 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Data Pribadi & Instansi
        </button>

        <button
          onClick={() => setActiveTab("progres")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "progres"
              ? "bg-white text-slate-900 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Progres Modul ({totalModul})
        </button>

        <button
          onClick={() => setActiveTab("keamanan")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "keamanan"
              ? "bg-white text-slate-900 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Keamanan Akun
        </button>
      </div>

      {/* TAB 1: DATA PRIBADI & INSTANSI */}
      {activeTab === "profil" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Informasi Profil Pendidik</h2>
            <p className="text-xs text-slate-500 mt-0.5">Kelola data personal dan instansi pendidikan di Jawa Barat.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  placeholder="Masukkan Nama Lengkap"
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gelar Akademik</label>
                <select
                  value={formData.gelar}
                  onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none bg-white cursor-pointer transition-all"
                >
                  <option value="">-- Tanpa Gelar --</option>
                  {DAFTAR_GELAR.filter(Boolean).map((gelar, idx) => (
                    <option key={idx} value={gelar}>
                      {gelar}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi (@gmail.com)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contoh@gmail.com"
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                <input
                  type="text"
                  value={formatNipDisplay(formData.nip)}
                  disabled
                  readOnly
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-500 cursor-not-allowed outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">NIP terverifikasi secara resmi.</p>
              </div>
            </div>

            {/* BOX PILIH SEKOLAH & WILAYAH DISDIK JABAR */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#0047A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V5" />
                  </svg>
                  Instansi Sekolah Wilayah Jawa Barat
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setKetikManual(!ketikManual);
                    setSelectedDaerah("");
                    setFormData((prev) => ({ ...prev, sekolah: "", alamatSekolah: "" }));
                  }}
                  className="text-xs text-[#0047A5] hover:text-[#002B66] font-semibold transition-colors"
                >
                  {ketikManual ? "Pilih dari Daftar Wilayah" : "Sekolah tidak ada? Ketik manual"}
                </button>
              </div>

              {!ketikManual ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Kabupaten / Kota</label>
                      <select
                        value={selectedDaerah}
                        onChange={handleDaerahChange}
                        className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none bg-white cursor-pointer text-slate-700"
                      >
                        <option value="">-- Pilih Kab/Kota --</option>
                        {Object.keys(DATA_SEKOLAH_JABAR).map((kota, idx) => (
                          <option key={idx} value={kota}>
                            {kota}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Nama Sekolah</label>
                      <select
                        value={formData.sekolah}
                        disabled={!selectedDaerah}
                        onChange={handleSekolahSelect}
                        className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none bg-white cursor-pointer text-slate-700 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Pilih Sekolah --</option>
                        {selectedDaerah &&
                          DATA_SEKOLAH_JABAR[selectedDaerah]?.map((s, idx) => (
                            <option key={idx} value={s.nama}>
                              {s.nama}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {formData.alamatSekolah && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Alamat Sekolah</label>
                      <textarea
                        value={formData.alamatSekolah}
                        readOnly
                        rows={2}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-600 outline-none resize-none cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Nama Sekolah</label>
                    <input
                      type="text"
                      value={formData.sekolah}
                      onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
                      placeholder="Contoh: SMA Negeri 1 Bandung"
                      required
                      className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Alamat Sekolah</label>
                    <input
                      type="text"
                      value={formData.alamatSekolah}
                      onChange={(e) => setFormData({ ...formData, alamatSekolah: e.target.value })}
                      placeholder="Masukkan jalan, kecamatan, kabupaten/kota"
                      className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp/HP Aktif</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={13}
                value={formData.noHp}
                onChange={handleNoHpChange}
                placeholder="081234567890"
                required
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all"
              />
            </div>

            {/* BUTTON UTAMA — navy Disdik Jabar */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-[#0047A5] hover:bg-[#002B66] text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60"
              >
                {savingProfile ? "Memproses..." : "Simpan Perubahan Profil"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PROGRES MODUL */}
      {activeTab === "progres" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Progres Pembelajaran Panca Waluya</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sertifikasi & kelengkapan modul karakter Sunda.</p>
          </div>

          {profile.progress && profile.progress.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.progress.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:shadow-md transition-all space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] bg-[#109B51]/10 text-[#109B51] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-[#109B51]/20">
                        {item.module.aspekPancawaluya || "Panca Waluya"}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">
                        {item.module.judul}
                      </h3>
                    </div>
                    <span className="text-[10px] bg-[#109B51] text-white font-bold px-2 py-0.5 rounded-md capitalize shrink-0">
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Progres Kelulusan</span>
                      <span className="font-bold text-[#109B51]">100%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#109B51] h-full w-full rounded-full" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-100">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Selesai: {item.completedAt ? new Date(item.completedAt).toLocaleDateString("id-ID") : "-"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">Belum ada modul yang diselesaikan</p>
              <p className="text-xs text-slate-400 mt-1">Selesaikan modul pelatihan Anda untuk memperbarui progres di sini.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KEAMANAN AKUN */}
      {activeTab === "keamanan" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Keamanan & Kata Sandi</h2>
            <p className="text-xs text-slate-500 mt-0.5">Jaga kerahasiaan kata sandi akun LMS Anda secara berkala.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Saat Ini</label>
              <input
                type="password"
                value={passwordData.passwordLama}
                onChange={(e) => setPasswordData({ ...passwordData, passwordLama: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Baru</label>
              <input
                type="password"
                value={passwordData.passwordBaru}
                onChange={(e) => setPasswordData({ ...passwordData, passwordBaru: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
              >
                {savingPassword ? "Memperbarui..." : "Update Password Akun"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}