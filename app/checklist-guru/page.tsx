"use client";

import { useEffect, useState } from "react";
import {
  getTodayChecklist,
  uploadFotoBukti,
  submitTodayChecklist,
  TeacherChecklistItem,
} from "@/services/checklist.service";

export default function ChecklistGuruPage() {
  const [items, setItems] = useState<TeacherChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Load checklist hari ini
  const loadChecklist = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getTodayChecklist();

      // Validasi penanganan data array
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray((data as unknown as { items?: TeacherChecklistItem[] }).items)) {
        const asData = data as { items?: TeacherChecklistItem[] };
        setItems(asData.items || []);
      } else {
        setItems([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setItems([]);
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await loadChecklist();
    })();
  }, []);

  // Handle Checkbox
  const handleToggleCheck = (id: string) => {
    setItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  // Handle Catatan
  const handleCatatanChange = (id: string, catatan: string) => {
    setItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) =>
        item.id === id ? { ...item, catatan } : item
      )
    );
  };

  // Handle Upload Foto Bukti
  const handleFileUpload = async (id: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(id);
    setMessage(null);

    try {
      const uploadResult = await uploadFotoBukti(file);
      setItems((prev) =>
        (Array.isArray(prev) ? prev : []).map((item) =>
          item.id === id ? { ...item, fotoBuktiUrl: uploadResult.url } : item
        )
      );
      setMessage({ text: "Foto bukti berhasil diunggah!", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ text: msg, type: "error" });
    } finally {
      setUploadingId(null);
    }
  };

  // Handle Submit Checklist
  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const currentItems = Array.isArray(items) ? items : [];
      const payload = currentItems.map((item) => ({
        checklistItemId: item.id,
        isChecked: item.isChecked,
        fotoBuktiUrl: item.fotoBuktiUrl,
        catatan: item.catatan,
      }));

      await submitTodayChecklist(payload);
      setMessage({
        text: "Checklist harian berhasil disimpan!",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ text: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div
      className="min-h-screen p-4 sm:p-8 text-slate-700"
      style={{ backgroundColor: "#E3F2FD" }}
    >
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm">
        {/* Header Seksi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Penerapan Nilai Pancawaluya
            </h1>
            <p className="text-xs text-slate-500">
              Upload foto anda untuk setiap penerapan Nilai Pancawaluya
            </p>
          </div>
          <button
            onClick={loadChecklist}
            className="self-start sm:self-auto text-xs px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
          >
            Refresh Data
          </button>
        </div>

        {/* Banner Alert */}
        {message && (
          <div
            className={`p-3 mb-6 rounded-xl text-xs sm:text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Dynamic Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Memuat tugas checklist...
          </div>
        ) : safeItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Belum ada item checklist harian yang tersedia.
          </div>
        ) : (
          <div className="space-y-4">
            {safeItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-blue-50 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => handleToggleCheck(item.id)}
                      className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800 text-sm">
                      {item.deskripsi}
                    </span>
                  </label>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 bg-blue-100/70 text-blue-800 rounded-md">
                    {item.aspek}
                  </span>
                </div>

                {/* Upload Foto */}
                <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingId === item.id}
                    onChange={(e) =>
                      handleFileUpload(item.id, e.target.files?.[0])
                    }
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {uploadingId === item.id && (
                    <span className="text-xs text-amber-600 animate-pulse">
                      Mengunggah & validasi EXIF...
                    </span>
                  )}
                  {item.fotoBuktiUrl && (
                    <a
                      href={item.fotoBuktiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline font-medium flex items-center gap-1"
                    >
                      ✓ Lihat Foto Terunggah
                    </a>
                  )}
                </div>

                {/* Catatan Input */}
                <input
                  type="text"
                  placeholder="Tambah catatan (opsional)..."
                  value={item.catatan || ""}
                  onChange={(e) => handleCatatanChange(item.id, e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-6 py-3 rounded-xl font-medium text-white text-sm shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#0D47A1" }}
            >
              {submitting ? "Menyimpan..." : "Simpan Checklist"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}