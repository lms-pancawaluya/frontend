# LMS Pancawaluya — Frontend

Frontend web untuk platform pembelajaran **LMS Pancawaluya**, ditujukan bagi Guru SMA di lingkungan Dinas Pendidikan Provinsi Jawa Barat. Aplikasi membantu guru mempelajari dan menerapkan **5 nilai Pancawaluya**:

| Aspek | Deskripsi |
|---|---|
| **Cageur** | Sehat secara fisik dan mental |
| **Bageur** | Percaya diri dan mampu berkolaborasi |
| **Bener** | Disiplin dan menjunjung integritas |
| **Pinter** | Tertib dan taat pada norma |
| **Singer** | Responsif dan memiliki jiwa kepemimpinan |

Aplikasi mengenal dua peran pengguna (field `role` pada data user):

- **`guru`** — mengakses modul pembelajaran (video + mini-quiz, materi teks, evaluasi), mengelola profil, dan melihat progres belajar.
- **`admin`** — mengelola modul, konten, evaluasi, mini-quiz, akun guru, item checklist, serta memantau progres & hasil evaluasi guru.

> Ini adalah **frontend saja**. Seluruh data berasal dari backend API eksternal; frontend tidak berisi logika server/basis data.

> **Arah pengembangan berikutnya — Helpdesk V1:** Helpdesk/Ticketing V1 adalah target produk saat ini. **Sudah diimplementasikan (sisi guru, commit 1):** halaman `/helpdesk` untuk melihat daftar tiket milik guru dan membuat tiket baru (`services/helpdesk.service.js`). **Belum** ada: detail tiket, balasan, manajemen tiket oleh admin, dan pembaruan status. Lihat `handoff.md` untuk detail. Jangan menyalahartikan fitur feedback (Saran & Kritik) sebagai helpdesk.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Next.js `16.3.0` (App Router, Turbopack) |
| Bahasa | TypeScript `^5` (sebagian service ditulis dalam JavaScript) |
| UI / Styling | Tailwind CSS `v4` via `@tailwindcss/postcss` |
| Library React | `react` / `react-dom` `19.2.8` |
| HTTP | `fetch` native (browser) |
| Linting | ESLint `^9` + `eslint-config-next` `16.3.0` |
| Runtime | Node.js `>=20.9.0` (persyaratan `next@16.3.0`) |

**Font**: `Fraunces` (display/heading) dan `Inter` (body), dimuat via `next/font/google` di `app/layout.tsx`.

**Dependency `axios` (`^1.19.0`)**: terpasang di `package.json` dan hanya diimpor oleh `lib/api.ts`. File `lib/api.ts` sendiri **tidak diimpor di mana pun** — instance Axios tidak dipakai. Semua request aktif menggunakan `fetch`.

---

## Fitur

### Fitur Guru

- **Dashboard** (`/dashboard`) — ringkasan progres: jumlah modul selesai vs total modul, progress bar, dan info akun.
- **Katalog modul** (`/modules`) — daftar modul dengan badge "Selesai" berdasarkan progres (`status === "selesai"`).
- **Alur pembelajaran per modul** (rute yang tertaut dari UI):
  1. **Video** (`/modules/[id]/video`) — YouTube via IFrame API, dengan **mini-quiz pop-up** yang terpicu pada `timestampSeconds` tertentu. Video tidak dapat di-fast-forward melewati bagian yang belum ditonton; navigasi ke materi teks terbuka setelah video selesai.
  2. **Materi teks** (`/modules/[id]/text`) — menampilkan konten bertipe `teks`/`text`.
  3. **Evaluasi** (`/modules/[id]/evaluation`) — soal pilihan ganda, skor dihitung lokal (lulus jika ≥ 80%); jika lulus memanggil `completeModule`.
- **Profil guru** (`/profile`) — edit nama, gelar, email, asal sekolah (dropdown data sekolah Jawa Barat atau input manual) + alamat, no. HP; upload foto profil (maks. 5MB); ganti password; melihat daftar modul selesai. NIP **read-only**.
- **Bantuan / Tiket** (`/helpdesk`) — melihat daftar tiket milik guru (nomor, subjek, kategori, status, tanggal dibuat) + membuat tiket baru via modal (subjek, kategori, deskripsi). Setiap tiket dapat diklik untuk membuka **modal detail tiket** (tanpa navigasi ke rute baru): menampilkan informasi tiket read-only (nomor, subjek, kategori, deskripsi, status, tanggal), percakapan (balasan beserta nama & peran pengirim, pesan, waktu), dan **form balasan** (POST balasan lalu memuat ulang percakapan tanpa refresh). **Batas 2 pesan berturut-turut** dari guru — jika guru sudah mengirim 2 pesan tanpa balasan admin/pengajar, form balasan diganti peringatan (enforcement sisi frontend saja). Tiket berstatus `resolved`/`closed` tidak dapat dibalas. Status tiket hanya **ditampilkan** (guru tidak mengubah status; backend yang mengatur). Dilengkapi **Panduan Singkat** (Quick Tutorial): accordion statis berisi 4 topik — tanpa API. Rute lama `/helpdesk/[ticketId]` redirect ke `/helpdesk`. Bagian dari **Helpdesk V1** (sisi guru).
- **Lupa password** (`/forgot-password`) — alur 3 langkah: kirim email → verifikasi OTP → password baru.

### Fitur Admin

Panel admin berada di `/admin/*`.

- **Dashboard admin** (`/admin`) — menu navigasi ke manajemen modul, akun guru, item checklist, tiket bantuan (helpdesk), dan halaman monitoring. Hero banner menggunakan gradien Disdik biru→hijau (`#0047A5` → `#109B51`) dengan badge pill translusen, tombol CTA kuning, dan dekorasi geometris — konsisten visual dengan hero banner Guru dashboard sebagai identitas visual LMS Panca Waluya.
- **Kelola tiket bantuan (Helpdesk)** (`/admin/helpdesk`) — melihat seluruh tiket guru, menggunakan server-side filters untuk status (open, in_progress, resolved, closed) & kategori, meninjau detail tiket (informasi tiket, info guru pengirim, percakapan lengkap), membalas tiket (mengubah status otomatis ke `in_progress` jika dibalas), dan mengubah status tiket secara manual via dropdown PATCH status.
- **Kelola modul** (`/admin/modules`, `/admin/modules/new`, `/admin/modules/[id]`, `/admin/modules/[id]/edit`) — CRUD modul (judul, deskripsi, `aspekPancawaluya`, `urutan`).
- **Kelola konten modul** — tambah (`/admin/modules/[id]/contents/new`) & edit/hapus konten (inline pada halaman edit modul); tipe konten `teks` atau `video`.
- **Kelola evaluasi** (`/admin/modules/[id]/evaluations`, `/admin/modules/[id]/evaluations/[evalId]`) — buat evaluasi (judul), tambah/hapus soal **pilihan ganda & esai**; **edit hanya untuk pilihan ganda** (UI menolak edit soal esai dengan pesan eksplisit). Soal pilihan ganda: 2–6 opsi, tepat 1 jawaban benar.
- **Kelola mini-quiz** (`/admin/modules/[id]/quiz/[contentId]`) — CRUD mini-quiz per konten video (judul, `timestampSeconds`, `passingScore` default 80, `maxAttempts` default 3) dan soal **pilihan ganda** (2–6 opsi, 1 benar).
- **Kelola akun guru** (`/admin/users`, `/admin/users/[id]`) — daftar guru dengan fitur pencarian global (nama, NIP, email) berbasis API query parameter (`GET /api/users?search=...`), edit (email, sekolah, status: `aktif`/`nonaktif`/`pensiun`/`wafat`), reset password, hapus.
- **Kelola item checklist** (`/admin/checklist`) — CRUD item template daily checklist per 5 aspek Pancawaluya + toggle aktif/nonaktif.
- **Monitoring guru** (`/admin/checklist/report`) — tabel progres modul tiap guru + skor hasil evaluasi (progress bar berwarna per persentase). Lihat catatan di [Status Proyek](#status-proyek) mengenai label menu.

---

## Routing

Semua route berupa App Router. Sebagian besar halaman adalah **client component** (`"use client"`); pengecualian server component: `/login`, `/register`, `Footer`, `Logo`.

### Rute Publik / Autentikasi

| Rute | Fungsi |
|---|---|
| `/` | Landing page — hero + 5 nilai Pancawaluya |
| `/login` | Form login (Email/NIP + password) |
| `/register` | Registrasi guru (nama, NIP, email, password) |
| `/otp?email=` | Verifikasi OTP 6 digit + resend (cooldown 60 dtk) |
| `/forgot-password` | Reset password 3 langkah |

### Rute Guru

| Rute | Fungsi |
|---|---|
| `/dashboard` | Ringkasan progres (redirect admin → `/admin`) |
| `/modules` | Katalog modul |
| `/modules/[id]` | Detail modul |
| `/modules/[id]/video` | Video + mini-quiz |
| `/modules/[id]/text` | Materi teks |
| `/modules/[id]/evaluation` | Evaluasi (soal statis, skor lokal) — **rute yang tertaut dari alur** |
| `/helpdesk` | Bantuan/Tiket guru — daftar tiket + buat tiket + detail modal + Panduan Singkat (Helpdesk V1) |
| `/helpdesk/[ticketId]` | Deprecated — redirect ke `/helpdesk` (Helpdesk V1) |
| `/profile` | Profil (view guru/admin sesuai `role`) |

### Rute Admin

| Rute | Fungsi |
|---|---|
| `/admin` | Dashboard admin |
| `/admin/modules` | Daftar modul + hapus |
| `/admin/modules/new` | Tambah modul |
| `/admin/modules/[id]` | Detail modul + daftar konten |
| `/admin/modules/[id]/edit` | Edit modul + kelola konten inline |
| `/admin/modules/[id]/contents/new` | Tambah konten |
| `/admin/modules/[id]/evaluations` | Daftar & buat evaluasi |
| `/admin/modules/[id]/evaluations/[evalId]` | Kelola soal evaluasi |
| `/admin/modules/[id]/quiz/[contentId]` | Kelola mini-quiz konten video |
| `/admin/users` | Daftar akun guru |
| `/admin/users/[id]` | Edit akun guru + reset password |
| `/admin/checklist` | Kelola item checklist |
| `/admin/checklist/report` | Monitoring progres & evaluasi guru |
| `/admin/helpdesk` | Kelola tiket bantuan (Helpdesk) |

### Rute yang ada namun tidak tertaut dari UI

| Rute / File | Catatan |
|---|---|
| `/guru` | Duplikat `DashboardPage` guru; tidak ada tautan navigasi |
| `/pembelajaran/[contentId]` | Halaman video alternatif (`VideoPlayerWithQuiz` + `ContentLockGuard`); tidak tertaut |
| `/modules/[id]/evaluations` & `/[evaluationId]` | Hanya tercapai via URL langsung; submit jawaban belum terhubung (lihat Status Proyek) |

---

## Autentikasi & Otorisasi

Autentikasi berbasis **JWT** yang divalidasi backend. Frontend hanya melakukan proteksi di sisi klien.

### Sesi

- **Login** (`app/components/auth/LoginForm.tsx`) — POST `/api/auth/login` (fetch langsung). Token disimpan ke `localStorage` (`token`) dan objek user ke `localStorage` (`user`). Token juga ditulis ke cookie `token` (`path=/; max-age=86400; SameSite=Lax`). Redirect berdasarkan `role` (case-insensitive): `ADMIN` → `/admin`, selain itu → `/dashboard`.
- **Registrasi** (`RegisterForm.tsx`) — POST `/api/auth/register` (nama, nip, email, password), lalu redirect ke `/otp?email=`.
- **Logout** (`logoutUser` di `auth.service.js`) — menghapus `token` & `user` dari `localStorage` dan `dispatch` event `"authChange"`.
- **Sinkronisasi Header** — `Header.tsx` membaca `localStorage` dan mendengarkan event `"authChange"` untuk memperbarui navigasi tanpa reload.

> Cookie `token` di-set saat login namun **tidak dibaca** oleh kode frontend, dan **tidak ada** `middleware.ts`. Seluruh proteksi murni client-side.

### Proteksi halaman (client-side)

- **Halaman admin yang memeriksa role**: memeriksa `localStorage` `user` (sebagian juga `token`) di `useEffect`; jika `role !== "admin"` → redirect `/dashboard`; jika data tidak ada → `/login`. Diterapkan pada: `/admin`, `/admin/modules`, `/admin/modules/[id]/evaluations`, `/admin/modules/[id]/evaluations/[evalId]`, `/admin/users`, `/admin/users/[id]`, `/admin/checklist`, `/admin/checklist/report`.
- **Halaman admin tanpa guard eksplisit**: `/admin/modules/new`, `/admin/modules/[id]`, `/admin/modules/[id]/edit`, `/admin/modules/[id]/contents/new`, `/admin/modules/[id]/quiz/[contentId]` tidak melakukan cek role di file halaman.
- **Halaman guru** (`/modules*`, dsb.) tidak melakukan redirect guard; request API akan gagal bila token tidak ada. `/dashboard` & `/guru` mengarahkan user `admin` ke `/admin`.

---

## Integrasi API

### Pola service

Sebagian besar request melewati fungsi di `services/*.js` menggunakan `fetch` dengan header `Authorization: Bearer <token>` (token dari `localStorage`). Pola umum:

```js
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getModules() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/api/modules`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal mengambil data modul");
  return result.data;
}
```

### Format response backend

Konsisten dalam Bahasa Indonesia:

```json
{ "sukses": true, "pesan": "opsional", "data": {} }
```

### Grup endpoint yang direferensikan frontend

| Grup | Endpoint | Method |
|---|---|---|
| **Auth** | `/api/auth/register`, `/api/auth/login`, `/api/auth/me` | POST / POST / GET |
| | `/api/auth/verify-otp`, `/api/auth/resend-otp` | POST |
| | `/api/auth/forgot-password`, `/api/auth/verify-reset-otp`, `/api/auth/reset-password` | POST |
| **Modul** | `/api/modules`, `/api/modules/:id` | GET, POST / GET, PUT, DELETE |
| | `/api/modules/:id/contents` | GET |
| **Konten** | `/api/modules/:moduleId/contents` | POST |
| | `/api/contents/:id` | PUT, DELETE |
| **Evaluasi** | `/api/modules/:moduleId/evaluations` | GET, POST |
| | `/api/modules/:moduleId/evaluations/:evaluationId` | GET |
| | `/api/modules/:moduleId/evaluations/:evaluationId/questions` | POST |
| | `/api/modules/:moduleId/evaluations/questions/:questionId` | PUT, DELETE |
| **Mini-quiz** | `/api/mini-quizzes/content/:contentId` | GET, POST |
| | `/api/mini-quizzes/content/:contentId/check-lock` | GET |
| | `/api/mini-quizzes/:quizId` | PUT, DELETE |
| | `/api/mini-quizzes/:quizId/questions` | POST |
| | `/api/mini-quizzes/questions/:questionId` | PUT, DELETE |
| | `/api/mini-quizzes/:quizId/attempt`, `/api/mini-quizzes/:quizId/my-attempts` | POST / GET |
| **Konten (langsung)** | `/api/contents/:contentId` | GET |
| **Progress** | `/api/progress`, `/api/progress/:moduleId/complete` | GET / POST |
| **User** | `/api/users`, `/api/users/:id` | GET / GET, PUT, DELETE |
| | `/api/users/:id/reset-password` | PUT |
| | `/api/users/profile/me`, `/api/users/profile/me/password` | GET, PUT / PUT |
| | `/api/upload/foto-profil` | POST |
| **Monitoring admin** | `/api/admin/users/:userId/progress`, `/api/admin/users/:userId/evaluations` | GET |
| **Checklist (admin)** | `/api/checklist/items`, `/api/checklist/items/:id` | GET, POST / PUT, DELETE |
| **Helpdesk (guru)** | `/api/helpdesk/tickets`, `/api/helpdesk/tickets/my`, `/api/helpdesk/tickets/:id`, `/api/helpdesk/tickets/:id/replies` | POST / GET / GET / POST |

> Beberapa fungsi service **terdefinisi namun belum dipanggil UI** (lihat Status Proyek): `submitEvaluation` (`/api/modules/:moduleId/evaluations/:evaluationId/submit`), `sendModuleFeedback` (`/api/feedbacks/module/:moduleId`), `startModule` (`/api/progress/:moduleId/start`), serta seluruh checklist harian guru (`/api/checklist/today`, `/api/checklist/history`, `/api/upload/foto-bukti`) dan `/api/checklist/report`.

### Base URL yang di-hardcode

Sebagian kode memuat base URL backend `https://backend-production-72a3.up.railway.app`, bukan sepenuhnya dari environment:

- **Mengabaikan `NEXT_PUBLIC_API_URL` sepenuhnya** (konstanta `API_BASE_URL` hardcode): `app/modules/[id]/video/page.tsx`, `app/pembelajaran/[contentId]/page.tsx`, `app/components/mini-quiz/VideoPlayerWithQuiz.tsx`, `app/components/mini-quiz/VideoInteractiveQuiz.tsx`, `app/components/mini-quiz/ContentLockGuard.tsx`.
- **Menggunakan env dengan fallback hardcode** (`process.env.NEXT_PUBLIC_API_URL || "…railway.app"`): `LoginForm.tsx`, `RegisterForm.tsx`, `app/otp/page.tsx`, `services/evaluation.service.js`, `services/miniQuiz.service.js`.

Service lain (`auth`, `module`, `content`, `progress`, `user`) memakai `process.env.NEXT_PUBLIC_API_URL` tanpa fallback (`checklist.service.js` fallback ke string kosong).

---

## Environment Setup

Satu variabel environment publik dibutuhkan:

| Variable | Deskripsi |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL backend API |

File `.env*` **tidak di-commit** (`.gitignore`), sehingga `.env.local` harus dibuat manual saat setup:

```env
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend-host.example.com
```

> Karena beberapa berkas meng-hardcode base URL (lihat bagian API), mengubah `NEXT_PUBLIC_API_URL` **tidak** akan memengaruhi request pada berkas yang mengabaikan env tersebut. Untuk mengganti backend sepenuhnya, base URL hardcode juga perlu disesuaikan di kode.

`next.config.ts` mengizinkan `next/image` memuat gambar remote dari host: `ftmqfmyaspfmqvzmugkk.supabase.co` (path storage publik) dan `disdik.jabarprov.go.id`.

---

## Instalasi & Pengembangan

### Prasyarat

- Node.js **>= 20.9.0**
- npm
- Backend API yang dapat diakses

### Langkah

```bash
# 1. Install dependencies
npm install

# 2. Buat .env.local (lihat Environment Setup)

# 3. Jalankan development server (port 3001)
npm run dev
# buka http://localhost:3001
```

### Skrip npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server, port `3001`, Turbopack |
| `npm run build` | Build produksi (Turbopack) |
| `npm start` | Menjalankan server produksi (`next start`, port default 3000) |
| `npm run lint` | ESLint |

**CI**: `.github/workflows/ci.yml` menjalankan `npm ci`, `npm run lint`, `npm test --if-present` (belum ada test), dan `npm run build` pada Node 20 untuk push/PR ke `main`.

---

## Development Notes

- **Bahasa field API konsisten Bahasa Indonesia**: `sukses`, `pesan`, `data`; entitas memakai `judul`, `deskripsi`, `aspekPancawaluya`, `urutan`, `tipe` (`teks`/`video`), `skor`, `isLolos`, `passingScore`, `maxAttempts`, `timestampSeconds`, dll.
- **Pola halaman**: `useState` + `useEffect` untuk fetch, dengan state `loading`/`error`.
- **Error handling**: `catch (err)` bertipe `unknown`, dicek `err instanceof Error` sebelum akses `err.message`.
- **Konfirmasi hapus**: memakai `window.confirm()` / `alert()` bawaan browser.
- **YouTube**: video di-embed via IFrame API; ID diekstrak dengan regex sederhana.
- **NIP**: `lib/formatNip.ts` memformat NIP ke pola `YYYY-MM-DD-YYYY-MM-X-NNN` (maks. 18 digit); NIP read-only pada profil.
- **Data sekolah**: daftar sekolah Jawa Barat di-hardcode dalam `app/profile/GuruProfileView.tsx`.
- **Tema**: warna tema didefinisikan sebagai CSS variables di `app/globals.css` (`--color-navy`, `--color-accent`, `--color-pale`, `--color-border-soft`, `--color-biru-muda`) plus util `.btn-primary`, `.btn-secondary`, `.alert-error`.
- **Keamanan**: JWT disimpan di `localStorage` (rentan XSS); proteksi route hanya client-side. Validasi keamanan sesungguhnya menjadi tanggung jawab backend.
- **Aturan dokumentasi (wajib)**: setiap perubahan fitur/bug fix/UI/integrasi API **wajib** memperbarui `README.md` **dan** `handoff.md` di task yang sama.
- **Artefak repo**: `handoff.md` (referensi mendalam untuk agen/developer) dan `repomix-output.xml` (snapshot repo) merupakan catatan pengembangan, bukan bagian runtime aplikasi.

---

## Status Proyek

Ringkasan; detail lengkap ada di `handoff.md`.

**Sudah berjalan:** auth (login/register/OTP/reset password), sinkronisasi header, dashboard guru & admin, katalog modul, CRUD admin (modul, konten, evaluasi, mini-quiz, akun guru, item checklist), manajemen profil, monitoring admin (progres + hasil evaluasi + baca feedback), dan mini-quiz interaktif pada video (gating + anti fast-forward).

**Sebagian / catatan penting:**

- **Evaluasi guru belum tersambung penuh.** `/modules/[id]/evaluation` memakai soal **mock hardcode** dengan skor lokal; `/modules/[id]/evaluations/[evaluationId]` menampilkan soal dari API tetapi **submit hanya `console.log` + alert** (belum memanggil `submitEvaluation`).
- **Edit soal evaluasi** hanya untuk tipe `pilihan_ganda`; soal `esai` belum bisa diedit (tombol dinonaktifkan).
- **Mini-quiz video default LULUS saat API gagal** (`{ skor:100, isLolos:true }`) — perlu diperbaiki.
- **Feedback (Saran & Kritik):** `ModuleFeedbackForm` + `sendModuleFeedback` sudah dibuat tetapi **belum dipasang** di alur guru (admin tetap bisa membaca feedback lama).
- **Label menu monitoring:** halaman berada di `/admin/checklist/report` namun isinya monitoring modul/evaluasi (bukan data checklist); `getChecklistReport` di service **tidak dipakai**.

**Belum ada UI / dead code:** checklist harian guru (service ada, tanpa halaman), `startModule` (tidak dipanggil), sertifikat ("Belum Tersedia"), `lib/api.ts` (axios tak terpakai).

**Direncanakan:** Helpdesk V1 — sisi guru **sudah** ada: daftar tiket + buat tiket (`/helpdesk`), serta detail tiket + balasan (kini menggunakan modal/pop-up langsung pada `/helpdesk` tanpa navigasi, rute lama `/helpdesk/[ticketId]` melakukan redirect). Terpasang batas 2 pesan beruntun dari guru sebagai frontend guard. Sisi admin/pengajar **sudah** ada: manajemen tiket oleh admin/pengajar (`/admin/helpdesk`) untuk daftar tiket dengan filter status/kategori, kirim balasan, dan pengelolaan status (PATCH). Field tiket dirender secara defensif mengikuti pola repo.

**Validasi terakhir:** `npx tsc --noEmit` lolos; `npx eslint` lolos.

---

## Lisensi

Dikembangkan untuk Dinas Pendidikan Provinsi Jawa Barat dalam inisiatif Pancawaluya untuk pendidikan karakter Guru SMA.
