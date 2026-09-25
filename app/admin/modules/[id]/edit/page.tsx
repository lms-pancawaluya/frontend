"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getModuleById, updateModule, getModuleContents } from "@/services/module.service";
import { deleteContent, updateContent } from "@/services/content.service";
import { getCourseById } from "@/services/course.service";
import { validateExternalUrl } from "@/lib/link";
import { canManageCourse, getCourseModulePermissions } from "@/lib/rbac";
import { useApp } from "@/app/context/AppContext";

const aspekOptions = ["cageur", "bageur", "bener", "pinter", "singer", "umum"];

function dateInputValue(value?: string | null) {
  return value ? String(value).slice(0, 10) : "";
}

interface ContentItem {
  id: string;
  judul: string;
  tipe: string;
  konten: string;
  urutan: number;
}

export default function EditModulePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useApp();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
    urutan: 1,
    tanggalMulai: "",
    tanggalSelesai: "",
  });

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [courseEndDate, setCourseEndDate] = useState("");
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [contentMessage, setContentMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [editContentData, setEditContentData] = useState({
    judul: "",
    tipe: "teks",
    konten: "",
    urutan: 1,
  });

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

    // Guru read-only tidak boleh mengakses halaman edit modul.
    if (!perms.canEdit) {
      router.push(`/admin/modules/${id}`);
      return;
    }

    await Promise.resolve();
    setCheckingAccess(false);
    }

    checkAccess();
  }, [router, id]);

  useEffect(() => {
    if (checkingAccess) return;

    async function loadData() {
      // Ownership Module mewarisi parent Course (data canonical `createdBy`).
      let currentUser: { role?: string; id?: string } = {};
      try {
        const raw = localStorage.getItem("user");
        currentUser = raw ? JSON.parse(raw) : {};
      } catch {
        currentUser = {};
      }

      try {
        const [moduleData, contentsData] = await Promise.all([
          getModuleById(id),
          getModuleContents(id),
        ]);

        const courseId = moduleData?.courseId;
        if (courseId) {
          try {
            const course = await getCourseById(courseId);
            setCourseEndDate(dateInputValue(course?.tanggalSelesai));
            if (!canManageCourse(currentUser.role, currentUser.id, course)) {
              setAccessDenied(true);
              return;
            }
          } catch {
            // Biarkan BE menolak secara natural saat action; jangan blokir render.
          }
        }

        setFormData({
          judul: moduleData.judul,
          deskripsi: moduleData.deskripsi || "",
          aspekPancawaluya: moduleData.aspekPancawaluya,
          urutan: moduleData.urutan,
          tanggalMulai: dateInputValue(moduleData.tanggalMulai || moduleData.startDate || moduleData.waktuMulai),
          tanggalSelesai: dateInputValue(moduleData.tanggalSelesai || moduleData.endDate || moduleData.waktuSelesai),
        });

        setContents(contentsData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(t("Gagal memuat data modul.", "Failed to load module data."));
        }
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [id, checkingAccess, t]);

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
    if (formData.tanggalMulai && formData.tanggalSelesai && formData.tanggalSelesai <= formData.tanggalMulai) {
      setError(t("Tanggal selesai modul harus setelah tanggal mulai.", "Module end date must be after start date."));
      return;
    }
    if (formData.tanggalMulai && courseEndDate && formData.tanggalMulai >= courseEndDate) {
      setError(t("Tanggal mulai modul harus sebelum tanggal selesai Course.", "Module start date must be before the Course end date."));
      return;
    }
    setSaving(true);

    try {
      await updateModule(id, {
        ...formData,
        tanggalMulai: formData.tanggalMulai || null,
        tanggalSelesai: formData.tanggalSelesai || null,
      });
      router.push(`/admin/modules/${id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("Gagal memperbarui modul.", "Failed to update module."));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContent(contentId: string, judul: string) {
    const confirmed = window.confirm(t(`Yakin ingin menghapus konten "${judul}"?`, `Are you sure you want to delete the content "${judul}"?`));
    if (!confirmed) return;

    setDeletingId(contentId);

    try {
      await deleteContent(contentId);
      setContents((prev) => prev.filter((c) => c.id !== contentId));
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(t("Gagal menghapus konten.", "Failed to delete content."));
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleOpenEditContent(content: ContentItem) {
    setContentMessage(null);
    setEditingContentId(content.id);
    setEditContentData({
      judul: content.judul,
      tipe: content.tipe,
      konten: content.konten,
      urutan: content.urutan,
    });
  }

  function handleEditContentChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setEditContentData((prev) => ({
      ...prev,
      [name]: name === "urutan" ? Number(value) : value,
      ...(name === "tipe" && value === "link" ? { konten: "" } : {}),
    }));

    if (name === "tipe") setContentMessage(null);
  }

  async function handleUpdateContent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingContentId) return;

    if (editContentData.tipe === "link") {
      const urlError = validateExternalUrl(editContentData.konten);
      if (urlError) {
        setContentMessage({ type: "error", text: urlError });
        return;
      }
    }

    setSavingContent(true);
    setContentMessage(null);

    try {
      const updatedContent = await updateContent(editingContentId, editContentData);
      setContents((prev) =>
        prev.map((content) =>
          content.id === editingContentId
            ? { ...content, ...editContentData, ...updatedContent }
            : content
        )
      );
      setEditingContentId(null);
      setContentMessage({
        type: "success",
        text: t("Konten berhasil diperbarui.", "Content updated successfully."),
      });
    } catch (err) {
      setContentMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("Gagal memperbarui konten.", "Failed to update content."),
      });
    } finally {
      setSavingContent(false);
    }
  }

  if (checkingAccess || loadingData) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm dark:text-slate-400">
          <svg className="w-5 h-5 animate-spin text-emerald-700 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {t("Memuat data modul...", "Loading module data...")}
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="mx-auto mt-16 max-w-md p-6 text-center">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {t("Module ini berada pada Course yang bukan milik Anda, sehingga tidak dapat diedit. Hubungi Admin jika perlu.", "This module belongs to a Course that is not yours, so it cannot be edited. Contact an Admin if needed.")}
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/modules")}
          className="mt-4 text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← {t("Kembali ke daftar modul", "Back to module list")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6 dark:bg-slate-900/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Tombol Navigasi Kembali */}
        <div>
          <button
            onClick={() => router.push(`/admin/modules/${id}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:text-emerald-400"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors dark:bg-slate-700 dark:group-hover:bg-emerald-950/40 dark:text-slate-400 dark:group-hover:text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            {t("Kembali ke Detail Modul", "Back to Module Detail")}
          </button>
        </div>

        {/* Judul Halaman */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight dark:text-slate-100">
            {t("Edit Modul", "Edit Module")}
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            {t("Perbarui informasi modul pembelajaran Pancawaluya di bawah ini.", "Update the Pancawaluya learning module information below.")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Form Edit Modul */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 dark:text-slate-100">
              <svg className="w-5 h-5 text-emerald-700 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-.01M13 12h-.01M13 8h-.01M5 20h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2zm7-14V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3m3 0h-1.5" />
              </svg>
              {t("Informasi Modul", "Module Information")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                  {t("Judul Modul", "Module Title")}
                </label>
                <input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                  {t("Deskripsi", "Description")}
                </label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                    {t("Aspek Pancawaluya", "Pancawaluya Aspect")}
                  </label>
                  <select
                    name="aspekPancawaluya"
                    value={formData.aspekPancawaluya}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm capitalize focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {aspekOptions.map((aspek) => (
                      <option key={aspek} value={aspek} className="capitalize">
                        {aspek}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                    {t("Urutan Modul", "Module Order")}
                  </label>
                  <input
                    type="number"
                    name="urutan"
                    value={formData.urutan}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                    {t("Tanggal Mulai Modul (Opsional)", "Module Start Date (Optional)")}
                  </label>
                  <input
                    type="date"
                    name="tanggalMulai"
                    value={formData.tanggalMulai}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                    {t("Tanggal Selesai Modul (Opsional)", "Module End Date (Optional)")}
                  </label>
                  <input
                    type="date"
                    name="tanggalSelesai"
                    value={formData.tanggalSelesai}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("Kosongkan jadwal modul jika ingin mengikuti jadwal Course.", "Leave module schedule blank to follow Course schedule.")}
              </p>
            </div>

            <div className="flex justify-end pt-2 gap-3">
              <button
                type="button"
                onClick={() => router.push(`/admin/modules/${id}`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("Batal", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {saving ? t("Menyimpan...", "Saving...") : t("Simpan Perubahan", "Save Changes")}
              </button>
            </div>
          </div>
        </form>

        {/* Konten Pembelajaran */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 dark:text-slate-100">
              <svg className="w-5 h-5 text-emerald-700 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t("Konten Pembelajaran", "Learning Content")}
            </h2>
            <Link
              href={`/admin/modules/${id}/contents/new`}
              className="text-xs sm:text-sm bg-slate-900 text-white px-4 py-2 rounded-full font-semibold hover:bg-slate-800 transition shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {t("+ Tambah Konten", "+ Add Content")}
            </Link>
          </div>

          {contentMessage && (
            <div
              className={`text-sm px-4 py-3 rounded-xl border ${
                contentMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
              }`}
            >
              {contentMessage.text}
            </div>
          )}

          {contents.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("Belum ada konten untuk modul ini.", "No content for this module yet.")}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {[...contents]
                .sort((a, b) => a.urutan - b.urutan)
                .map((content) => (
                  <div
                    key={content.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <strong className="text-xs font-bold text-slate-400 dark:text-slate-500">#{content.urutan}</strong>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base dark:text-slate-100">
                          {content.judul}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                        {content.tipe}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6">
                      {editingContentId === content.id ? (
                        <form onSubmit={handleUpdateContent} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                              {t("Judul Konten", "Content Title")}
                            </label>
                            <input
                              type="text"
                              name="judul"
                              value={editContentData.judul}
                              onChange={handleEditContentChange}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                              {t("Tipe Konten", "Content Type")}
                            </label>
                            <select
                              name="tipe"
                              value={editContentData.tipe}
                              onChange={handleEditContentChange}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm capitalize focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              <option value="teks">{t("Teks", "Text")}</option>
                              <option value="video">{t("Video (YouTube)", "Video (YouTube)")}</option>
                              <option value="link">{t("Link", "Link")}</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                              {editContentData.tipe === "video"
                                ? t("Link Video YouTube", "YouTube Video Link")
                                : editContentData.tipe === "link"
                                ? t("URL Link", "Link URL")
                                : t("Isi Konten", "Content Body")}
                            </label>
                            {editContentData.tipe === "link" ? (
                              <input
                                type="url"
                                name="konten"
                                value={editContentData.konten}
                                onChange={handleEditContentChange}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                placeholder="https://contoh.com/materi"
                                aria-describedby="edit-content-link-help"
                                required
                              />
                            ) : (
                              <textarea
                                name="konten"
                                value={editContentData.konten}
                                onChange={handleEditContentChange}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                rows={editContentData.tipe === "video" ? 2 : 6}
                                required
                              />
                            )}
                            {editContentData.tipe === "link" && (
                              <p id="edit-content-link-help" className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                {t("Masukkan URL eksternal lengkap (http:// atau https://).", "Enter the full external URL (http:// or https://).")}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider dark:text-slate-300">
                              {t("Urutan", "Order")}
                            </label>
                            <input
                              type="number"
                              name="urutan"
                              value={editContentData.urutan}
                              onChange={handleEditContentChange}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              min={1}
                              required
                            />
                          </div>

                          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="submit"
                              disabled={savingContent}
                              className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              {savingContent ? t("Menyimpan...", "Saving...") : t("Simpan", "Save")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingContentId(null)}
                              disabled={savingContent}
                              className="text-xs text-gray-500 hover:underline disabled:opacity-50 dark:text-slate-400"
                            >
                              {t("Batal", "Cancel")}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {content.tipe === "video" ? (
                            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-800 ring-1 ring-slate-900/10">
                              <iframe
                                src={getYoutubeEmbedUrl(content.konten)}
                                className="w-full h-full"
                                allowFullScreen
                                title={content.judul}
                              />
                            </div>
                          ) : content.tipe === "link" ? (
                            <div className="space-y-3">
                              {content.konten ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t("Tautan Eksternal", "External Link")}</p>
                                  <p className="mt-1 text-sm text-slate-700 break-all dark:text-slate-300">{content.konten}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5 dark:text-slate-400 dark:border-slate-700">
                                  {t("URL link belum tersedia untuk materi ini.", "Link URL is not yet available for this material.")}
                                </p>
                              )}
                              {content.konten && (
                                <a
                                  href={content.konten}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition dark:bg-slate-700 dark:hover:bg-slate-600"
                                >
                                  {t("Buka Link", "Open Link")}
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="prose prose-slate prose-sm max-w-none">
                              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line dark:text-slate-300">
                                {content.konten}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => handleOpenEditContent(content)}
                              disabled={savingContent || deletingId === content.id}
                              className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              {t("Edit Konten", "Edit Content")}
                            </button>
                            <button
                              onClick={() => handleDeleteContent(content.id, content.judul)}
                              disabled={deletingId === content.id || savingContent}
                              className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                            >
                              {deletingId === content.id ? t("Menghapus...", "Deleting...") : t("Hapus", "Delete")}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getYoutubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  const videoId = match ? match[1] : "";
  return `https://www.youtube.com/embed/${videoId}`;
}
