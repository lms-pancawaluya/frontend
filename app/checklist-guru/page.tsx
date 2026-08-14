"use client";

import { useEffect, useState } from "react";
import {
  getTodayChecklist,
  uploadFotoBukti,
  submitTodayChecklist,
} from "@/services/checklist.service";

interface ChecklistItem {
  id: string;
  aspek: string;
  deskripsi: string;
  urutan?: number;
  isChecked: boolean;
  fotoBuktiUrl?: string | null;
  catatan?: string;
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | ""; text: string }>({
    type: "",
    text: "",
  });

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const res = await getTodayChecklist();

      // Penanganan fleksibel untuk format return array langsung atau wrapper object
      if (Array.isArray(res)) {
        setItems(res);
      } else if (res && Array.isArray(res.data)) {
        setItems(res.data);
      } else if (res && Array.isArray(res.items)) {
        setItems(res.items);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Gagal memuat checklist" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChecklist();
  }, []);

  const handleToggleCheck = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isChecked: !updated[index].isChecked };
      return updated;
    });
  };

  const handleCatatanChange = (index: number, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], catatan: value };
      return updated;
    });
  };

  const handleFileUpload = async (index: number, file?: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    const currentItem = items[index];
    const itemId = currentItem.id || String(index);
    
    setUploadingId(itemId);
    setMessage({ type: "", text: "" });

    try {
      const uploadRes = await uploadFotoBukti(file);
      const fileUrl = uploadRes?.url || uploadRes?.data?.url || null;

      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], fotoBuktiUrl: fileUrl };
        return updated;
      });

      setMessage({ type: "success", text: "Foto bukti berhasil diunggah!" });
    } catch (err: any) {
      alert(`Gagal Unggah Foto: ${err?.message || "Terjadi kesalahan"}`);
    } finally {
      setUploadingId(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = items.map((item) => ({
        checklistItemId: item.id,
        isChecked: Boolean(item.isChecked),
        fotoBuktiUrl: item.fotoBuktiUrl || null,
        catatan: item.catatan || "",
      }));

      await submitTodayChecklist(payload);
      setMessage({ type: "success", text: "Checklist berhasil disimpan!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Gagal menyimpan checklist" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <svg className="w-5 h-5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat checklist hari ini...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Checklist Harian Guru
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Lengkapi tugas harian dan unggah foto bukti langsung (kamera HP dengan lokasi & waktu aktif).
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                : "bg-rose-50 text-rose-800 border border-rose-200/60"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {Array.isArray(items) && items.length > 0 ? (
            items.map((item, index) => {
              const currentId = item.id || String(index);
              const isUploadingThis = uploadingId === currentId;

              return (
                <div
                  key={currentId}
                  className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      id={`check-${currentId}`}
                      checked={item.isChecked || false}
                      onChange={() => handleToggleCheck(index)}
                      className="w-5 h-5 mt-0.5 accent-emerald-600 rounded-lg cursor-pointer"
                    />
                    <label htmlFor={`check-${currentId}`} className="flex-1 cursor-pointer">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 mb-1 border border-slate-200/50">
                        {item.aspek}
                      </span>
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {item.deskripsi}
                      </p>
                    </label>
                  </div>

                  <div className="pl-8 space-y-3">
                    <input
                      type="text"
                      placeholder="Tambahkan catatan pengerjaan (opsional)"
                      value={item.catatan || ""}
                      onChange={(e) => handleCatatanChange(index, e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        <span>{isUploadingThis ? "Mengunggah..." : "Upload Foto Bukti"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={isUploadingThis}
                          onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                        />
                      </label>

                      {item.fotoBuktiUrl && (
                        <a
                          href={item.fotoBuktiUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold underline truncate max-w-[240px]"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Lihat Bukti Terunggah
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs">
              Belum ada item checklist harian yang tersedia.
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !Array.isArray(items) || items.length === 0}
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-sm disabled:opacity-50"
        >
          {submitting ? "Menyimpan Checklist..." : "Simpan Seluruh Checklist"}
        </button>
      </div>
    </div>
  );
}