"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { cekNipGuru, cariSekolah, SekolahItem } from "@/services/registration.service";

interface FormValues {
  nip: string;
  namaGuru: string;
  npsnSekolah: string;
  namaSekolah: string;
  kotaKab: string;
  kecamatan: string;
}

export default function RegisterGuruForm() {
  const { register, setValue, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      nip: "",
      namaGuru: "",
      npsnSekolah: "",
      namaSekolah: "",
      kotaKab: "",
      kecamatan: "",
    },
  });

  // State Kontrol UI
  const [isNipFound, setIsNipFound] = useState(false);
  const [checkingNip, setCheckingNip] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Autocomplete Sekolah
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [schoolOptions, setSchoolOptions] = useState<SekolahItem[]>([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const watchNip = watch("nip");

  // Handler 1: Cek Nip saat Event onBlur / Klik Tombol
  const handleCekNip = async () => {
    if (!watchNip || watchNip.trim() === "") return;

    setCheckingNip(true);
    setToastMessage(null);

    try {
      const res = await cekNipGuru(watchNip);
      if (res.success && res.data) {
        // Auto-fill form
        setValue("namaGuru", res.data.namaGuru);
        setValue("npsnSekolah", res.data.npsnSekolah);
        setValue("namaSekolah", res.data.namaSekolah);
        setValue("kotaKab", res.data.kotaKab);
        setValue("kecamatan", res.data.kecamatan);

        setIsNipFound(true);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsNipFound(false);
        setToastMessage(
          "Data NIP tidak ditemukan di master data. Silakan isi data nama & sekolah secara manual."
        );
        // Reset field yang terkait agar dapat diisi manual
        setValue("namaGuru", "");
        setValue("npsnSekolah", "");
        setValue("namaSekolah", "");
        setValue("kotaKab", "");
        setValue("kecamatan", "");
      } else {
        setToastMessage("Terjadi kesalahan saat memeriksa NIP.");
      }
    } finally {
      setCheckingNip(false);
    }
  };

  // Handler 2: Debounce Search Sekolah (~300ms)
  const fetchSekolah = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSchoolOptions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearchingSchool(true);
    try {
      const res = await cariSekolah(query);
      if (res.success) {
        setSchoolOptions(res.data || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Gagal mengambil data sekolah:", error);
    } finally {
      setIsSearchingSchool(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!isNipFound) {
        void fetchSekolah(schoolSearchQuery);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [schoolSearchQuery, isNipFound, fetchSekolah]);

  // Handler ketika user memilih sekolah dari dropdown
  const handleSelectSekolah = (sekolah: SekolahItem) => {
    setValue("npsnSekolah", sekolah.npsn);
    setValue("namaSekolah", sekolah.nama);
    setValue("kotaKab", sekolah.kotaKab);
    setValue("kecamatan", sekolah.kecamatan);
    setSchoolSearchQuery(sekolah.nama);
    setShowDropdown(false);
  };

  const onSubmit = (data: FormValues) => {
    console.log("Data Pendaftaran disubmit:", data);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Registrasi Data Guru</h2>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start justify-between gap-2">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="font-bold text-amber-600 hover:text-amber-900"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* NIP Input */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">NIP</label>
          <div className="flex gap-2">
            <input
              {...register("nip")}
              type="text"
              placeholder="Masukkan NIP"
              onBlur={handleCekNip}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5]"
            />
            <button
              type="button"
              onClick={handleCekNip}
              disabled={checkingNip}
              className="px-4 py-2.5 bg-[#0047A5] hover:bg-[#00367d] text-white font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              {checkingNip ? "Memeriksa..." : "Cek NIP"}
            </button>
          </div>
        </div>

        {/* Nama Guru */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Nama Guru</label>
          <input
            {...register("namaGuru")}
            type="text"
            disabled={isNipFound}
            placeholder="Nama lengkap guru"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5]"
          />
        </div>

        {/* Pencarian Sekolah (Autocomplete UI) - Hanya aktif jika NIP tidak ditemukan */}
        {!isNipFound ? (
          <div className="relative">
            <label className="block font-semibold text-slate-700 mb-1">Cari Sekolah</label>
            <input
              type="text"
              value={schoolSearchQuery}
              onChange={(e) => setSchoolSearchQuery(e.target.value)}
              placeholder="Ketik minimal 3 karakter nama sekolah..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5]"
            />

            {/* Dropdown Options */}
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto py-1">
                {isSearchingSchool ? (
                  <p className="p-3 text-slate-400 text-center">Mencari sekolah...</p>
                ) : schoolOptions.length > 0 ? (
                  schoolOptions.map((sekolah) => (
                    <button
                      type="button"
                      key={sekolah.id}
                      onClick={() => handleSelectSekolah(sekolah)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                    >
                      <p className="font-bold text-slate-800">{sekolah.nama}</p>
                      <p className="text-[10px] text-slate-500">
                        NPSN: {sekolah.npsn} | {sekolah.kecamatan}, {sekolah.kotaKab}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-slate-400 text-center">Sekolah tidak ditemukan</p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Detail Sekolah (Readonly Fields) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">NPSN Sekolah</label>
            <input
              {...register("npsnSekolah")}
              type="text"
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Sekolah</label>
            <input
              {...register("namaSekolah")}
              type="text"
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
            <input
              {...register("kotaKab")}
              type="text"
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
            <input
              {...register("kecamatan")}
              type="text"
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-3 bg-[#109B51] hover:bg-[#0e8344] text-white font-bold rounded-xl transition-all shadow-md"
        >
          Lanjutkan Pendaftaran
        </button>
      </form>
    </div>
  );
}