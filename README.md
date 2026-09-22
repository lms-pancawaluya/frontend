# LMS Pancawaluya — Frontend

Frontend web untuk platform pembelajaran **LMS Pancawaluya**, ditujukan bagi Guru SMA di lingkungan Dinas Pendidikan Provinsi Jawa Barat. Aplikasi membantu guru mempelajari dan menerapkan **5 nilai Pancawaluya**:

| Aspek | Deskripsi |
|---|---|
| **Cageur** | Sehat secara fisik dan mental |
| **Bageur** | Percaya diri dan mampu berkolaborasi |
| **Bener** | Disiplin dan menjunjung integritas |
| **Pinter** | Tertib dan taat pada norma |
| **Singer** | Responsif dan memiliki jiwa kepemimpinan |

> Ini adalah **frontend saja**. Seluruh data berasal dari backend API eksternal; frontend tidak berisi logika server/basis data. Otorisasi/scope data ditegakkan backend; FE hanya melakukan proteksi navigasi di sisi klien.

---

## Overview

Aplikasi mengenal tiga peran pengguna (field `role` pada data user, disimpan lowercase): **Guru**, **Pengajar**, dan **Admin**. Guru mengikuti **Course** yang berisi **Module** dengan alur bertahap **Pre-Test → Learning Material → Post-Test**, ditambah diskusi Course (dengan balasan & `@mention`), sertifikat Course, dan fitur user-facing lain (profil, pengaturan, bantuan). Pengajar adalah mentor/pembina Guru dalam satu sekolah (bukan "Admin Lite"). Admin melakukan administrasi global.

Dokumen ini merangkum kondisi implementasi aktual. `handoff.md` menyimpan referensi historis yang lebih mendalam (sebagian sudah tertinggal); bila terjadi perbedaan, **kode & README ini lebih diutamakan**.

---

## Features

### Guru (learning / user-facing)

- **Dashboard** (`/dashboard`) — ringkasan progres belajar + akses cepat.
- **Katalog Course** (`/modules`) — daftar Course; filter Semua / Sedang Dipelajari / Selesai.
- **Detail Course** (`/modules/courses/[id]`) — informasi Course, daftar Module (accordion), penanda tahapan Pre-Test → Material → Post-Test, tombol Sertifikat, section **Saran & Masukan** (Course-level), dan **Diskusi Course** (komentar, balasan, `@mention`).
- **Alur pembelajaran per Module:**
  - **Video** (`/modules/[id]/video`) — YouTube via IFrame API dengan **mini-quiz pop-up** pada `timestampSeconds`; anti fast-forward; mini-quiz interaktif.
  - **Materi teks** (`/modules/[id]/text`) — konten bertipe `teks`.
  - **Evaluasi Pre-Test/Post-Test** (`/modules/[id]/evaluations`, `/modules/[id]/evaluations/[evaluationId]`) — menampilkan soal dari API dan **mengirim jawaban** ke backend (`submitEvaluation`); status tahapan di-refresh dari BE setelah submit.
- **Profil** (`/profile`) — tab: Data Pribadi & Instansi, Progress Pembelajaran, Keamanan Akun. Termasuk edit data, upload foto profil, dan ganti password. (Label "Progress Modul" → "Progress Pembelajaran"; angka dalam kurung dihilangkan.)
- **Pengaturan** (`/settings`) — tab: **Preferences** (tema & bahasa) dan **Notifications**.
- **Bantuan / Helpdesk** (`/helpdesk`) — daftar tiket milik pengirim, buat tiket, detail tiket via modal (percakapan + balasan), plus **Panduan Singkat** (accordion statis). Batas **2 pesan berturut-turut** sebelum menunggu balasan Admin. Submenu Sidebar: **Buat Tiket** & **Saran & Masukan**.
- **Saran & Masukan (Course-level feedback)** (`/helpdesk` & `/modules/courses/[id]`) — form Masukan (opsional) + Saran (wajib) per **Course**. Dikirim via `POST /api/feedbacks/course/:courseId`. Cooldown **1 feedback per Course dalam 7×24 jam** ditegakkan server (HTTP 429 + `nextAllowedAt`); FE menampilkan state cooldown & mengunci form saat aktif.

### Pengajar (school-scoped management / monitoring)

Panel di `/pengajar/*`. Semua data dibatasi scope backend (guru dalam sekolah pengajar).

- **Dashboard** (`/pengajar`) — KPI + ringkasan monitoring + akses cepat.
- **Kelola Guru** (`/pengajar/guru`, `/pengajar/guru/[id]`) — daftar & detail/edit guru sesekolah (email/sekolah/kota/daerah/status).
- **Kelola Course & Module** — Pengajar dapat mengakses halaman kelola Course (`/admin/courses`) dan Module (`/admin/modules`) sesuai permission role (GET/POST/PUT tanpa DELETE; lihat `lib/rbac.ts`).
- **Monitoring Pembelajaran** (`/pengajar/monitoring`) — hierarchy **Guru → Course → Module → Activity** (Pre-Test / Learning Material / Post-Test), memakai `GET /api/admin-monitoring/users/progress/all`.
- **Diskusi/Komentar Modul** (`/pengajar/diskusi`) — pantau & balas diskusi Course dengan `@mention`.
- **Bantuan / Helpdesk** — memakai halaman `/helpdesk` yang sama dengan Guru (requester).

### Admin (management / global administration)

Panel di `/admin/*`.

- **Dashboard** (`/admin`) — hero banner (gradien Disdik biru→hijau), KPI, ringkasan monitoring, aktivitas, dan menu cepat. Angka dari service existing (termasuk bulk `GET /api/admin-monitoring/users/progress/all`).
- **Kelola Course** (`/admin/courses`, `/admin/courses/new`, `/admin/courses/[id]`, `/admin/courses/[id]/edit`) — CRUD Course (judul, deskripsi, mode online/offline, sertifikat, periode, lokasi).
- **Kelola Modul** (`/admin/modules` …) — CRUD Module (judul, deskripsi, `aspekPancawaluya`, `urutan`).
- **Kelola Konten Modul** — tambah/edit/hapus konten bertipe `teks` atau `video` (termasuk upload PDF untuk konten materi).
- **Kelola Evaluasi** (`/admin/modules/[id]/evaluations`, `/[evalId]`) — buat evaluasi Pre-Test/Post-Test; tambah/hapus soal pilihan ganda & esai (edit hanya pilihan ganda).
- **Kelola Mini-Quiz** (`/admin/modules/[id]/quiz/[contentId]`) — CRUD mini-quiz per konten video + soal pilihan ganda.
- **Kelola Akun Guru** (`/admin/users`, `/admin/users/[id]`) — daftar guru + pengajar (admin disembunyikan), pencarian global & filter server-side (sekolah/kota/daerah/status), edit, reset password, hapus.
- **Manajemen Sertifikat** (`/admin/certificates`) — pilih Course, unggah/ganti template sertifikat (PDF), lihat template existing.
- **Monitoring Pembelajaran** (`/admin/checklist/report`) — hierarchy **Guru → Course → Module → Activity** (Pre-Test / Learning Material / Post-Test); endpoint `GET /api/admin-monitoring/users/progress/all`.
- **Diskusi/Komentar Modul** (`/admin/diskusi`) — pantau utas diskusi, balas, dan moderasi (hapus komentar).
- **Helpdesk** (`/admin/helpdesk`) — kelola tiket: daftar + filter (status/kategori), detail modal, balas, dan ubah status (PATCH). Tiket Pembuat Pengajar diberi badge "Pengajar".

> **RTL (Rencana Tindak Lanjut):** implementasi masih ada di codebase (`/admin/rtl`, `/pengajar/rtl`, `services/rtl.service.js`) namun **sengaja disembunyikan** dari seluruh entry point UI (Sidebar, dashboard, quick-search) karena **business flow final belum ditetapkan**. Dokumen ini tidak mengklaim RTL sebagai fitur user-facing aktif. Rute dapat diakses langsung via URL. **RTL belum dihapus dari codebase.**

---

## Roles & Access

| Role | Cakupan | Ringkasan akses |
|---|---|---|
| **Admin** | Global (seluruh sekolah) | Administrasi penuh: Course/Module/Content/Evaluasi/Mini-Quiz CRUD, akun guru/pengajar, sertifikat, monitoring lintas sekolah, moderasi diskusi, kelola Helpdesk, Preferensi & Profil. |
| **Pengajar** | Sekolah sendiri (scope BE) | Mentor/pembina guru: kelola guru sesekolah, kelola Course/Module (GET/POST/PUT sesuai `lib/rbac.ts`), monitoring pembelajaran, diskusi, Helpdesk sebagai requester, Preferensi & Profil. |
| **Guru** | Peserta pembelajaran | Mengikuti Course & Module (video/materi/evaluasi), diskusi Course (+`@mention`), sertifikat, Saran & Masukan, Helpdesk sebagai requester, Preferensi & Profil. |

- Aturan permission Course & Module diringkas di `lib/rbac.ts` (Guru: GET; Pengajar: GET/POST/PUT; Admin: GET/POST/PUT/DELETE). Backend tetap penegak utama.
- Scope data (mis. Pengajar hanya guru sesekolah) **ditentukan backend**; FE tidak menambah filter sekolah client-side untuk itu.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Next.js `16.3.0` (App Router, Turbopack) |
| Bahasa | TypeScript `^5` (sebagian besar service ditulis dalam JavaScript) |
| UI / Styling | Tailwind CSS `v4` via `@tailwindcss/postcss` |
| Library React | `react` / `react-dom` `19.2.8` |
| Ikon | `lucide-react` |
| Form | `react-hook-form` (dipakai pada form registrasi guru) |
| HTTP | `fetch` native (browser) + `fetchApi` wrapper (`lib/api.ts`, menyisipkan header `ngrok-skip-browser-warning`) |
| Linting | ESLint `^9` + `eslint-config-next` `16.3.0` |
| Runtime | Node.js `>=20.9.0` |

**Font**: `Fraunces` (display/heading) dan `Inter` (body), dimuat via `next/font/google`.

**Dependency `axios` (`^1.20.0`)**: instance di `lib/api.ts` **tidak diimpor di mana pun**. `axios` **dipakai** oleh `services/registration.service.ts` (instance sendiri) untuk cek NIP & cari sekolah. Semua request data utama lainnya memakai `fetch`/`fetchApi`.

---

## Project Structure

```
app/
├─ admin/                     # Panel Admin
│  ├─ page.tsx                # Dashboard admin
│  ├─ courses/                # Kelola Course (+ [id], new, [id]/edit)
│  ├─ modules/                # Kelola Module, Konten, Evaluasi, Mini-Quiz
│  ├─ users/                  # Kelola akun guru/pengajar
│  ├─ certificates/           # Manajemen template sertifikat
│  ├─ checklist/              # Item checklist + report/ (Monitoring Pembelajaran)
│  ├─ helpdesk/               # Kelola tiket (Helpdesk)
│  ├─ diskusi/                # Moderasi diskusi
│  └─ rtl/                    # RTL (disembunyikan dari UI)
├─ pengajar/                  # Panel Pengajar
│  ├─ page.tsx                # Dashboard pengajar
│  ├─ guru/                   # Kelola Guru (+ [id])
│  ├─ monitoring/             # Monitoring Pembelajaran
│  ├─ diskusi/                # Diskusi
│  └─ rtl/                    # RTL (disembunyikan dari UI)
├─ dashboard/                 # Dashboard Guru
├─ modules/                   # Katalog + alur belajar
│  ├─ page.tsx                # Katalog Course
│  ├─ courses/[id]/           # Detail Course (diskusi, sertifikat, feedback)
│  └─ [id]/                   # Module: video/ , text/ , evaluations/ , evaluation/ (mock)
├─ helpdesk/                  # Bantuan/Tiket guru & pengajar (+ [ticketId] redirect)
├─ profile/                   # Profil (GuruProfileView / AdminProfileView)
├─ settings/                  # Preferensi (tema/bahasa) & Notifikasi
├─ components/
│  ├─ common/                 # Layout, Sidebar, Header, Footer, NotificationDropdown,
│  │                          # CourseFeedbackForm, MentionTextarea, ModuleStageGuard, dll.
│  ├─ auth/                   # LoginForm, RegisterForm
│  └─ mini-quiz/              # VideoPlayerWithQuiz, VideoInteractiveQuiz, ContentLockGuard
├─ context/                   # AppContext (tema & bahasa)
├─ login/ register/ register-guru/ otp/ forgot-password/
└─ globals.css, layout.tsx

services/                     # Lapisan API (mayoritas .js)
├─ auth, course, module, content, evaluation, miniQuiz, progress,
│  user, notification, comment, certificate, helpdesk, rtl, search (.js)
└─ registration.service.ts    # cek NIP & cari sekolah (axios)

lib/                          # Utilitas lintas fitur
├─ api.ts                     # fetchApi wrapper + API_URL
├─ rbac.ts                    # Permission Course/Module per role
├─ moduleStages.ts, materials.ts, contentProgress.ts, certificate.ts
├─ mention.ts, notification-navigation.ts, pageRegistry.ts
├─ formatNip.ts, link.ts, pdf.ts

types/                        # Tipe bersama: comment.ts, course.ts, evaluation.ts, miniQuiz.ts

handoff.md                    # Referensi historis pengembangan (tidak runtime)
repomix-output.xml            # Snapshot repo (tidak runtime)
```

---

## Routing

Semua route memakai App Router. Sebagian besar halaman adalah **client component** (`"use client"`).

### Publik / Autentikasi

| Rute | Fungsi |
|---|---|
| `/` | Landing page — hero + 5 nilai Pancawaluya |
| `/login` | Form login |
| `/register` | Registrasi umum (nama, email, password) |
| `/register-guru` | Registrasi guru (cek NIP + autocomplete sekolah) |
| `/otp?email=` | Verifikasi OTP 6 digit + resend (cooldown 60 dtk) |
| `/forgot-password` | Reset password 3 langkah |

### Guru

| Rute | Fungsi |
|---|---|
| `/dashboard` | Dashboard guru (admin → `/admin`, pengajar → `/pengajar`) |
| `/modules` | Katalog Course |
| `/modules/courses/[id]` | Detail Course (Module accordion, diskusi, sertifikat, Saran & Masukan) |
| `/modules/[id]`, `/[id]/video`, `/[id]/text` | Detail Module, video + mini-quiz, materi teks |
| `/modules/[id]/evaluations`, `/[id]/evaluations/[evaluationId]` | Pre-Test/Post-Test (API, submit aktif) |
| `/modules/[id]/evaluation` | Halaman evaluasi mock (soal statis; di luar alur utama) |
| `/profile` | Profil |
| `/settings` | Preferensi & Notifikasi |
| `/helpdesk` | Bantuan/Tiket (+ `/helpdesk/[ticketId]` → redirect) |

### Pengajar

| Rute | Fungsi |
|---|---|
| `/pengajar` | Dashboard pengajar |
| `/pengajar/guru`, `/pengajar/guru/[id]` | Kelola Guru |
| `/pengajar/monitoring` | Monitoring Pembelajaran |
| `/pengajar/diskusi` | Diskusi/Komentar Course |
| `/admin/courses`, `/admin/modules` | Kelola Course/Module (permission via `lib/rbac.ts`) |
| `/profile`, `/settings`, `/helpdesk` | Profil, Preferensi, Bantuan |

### Admin

| Rute | Fungsi |
|---|---|
| `/admin` | Dashboard admin |
| `/admin/courses`, `/admin/courses/new`, `/admin/courses/[id]`, `/admin/courses/[id]/edit` | Kelola Course |
| `/admin/modules`, `/admin/modules/new`, `/admin/modules/[id]`, `/[id]/edit`, `/[id]/contents/new` | Kelola Module & Konten |
| `/admin/modules/[id]/evaluations`, `/[evalId]` | Kelola Evaluasi & Soal |
| `/admin/modules/[id]/quiz/[contentId]` | Kelola Mini-Quiz |
| `/admin/users`, `/admin/users/[id]` | Kelola akun guru/pengajar |
| `/admin/certificates` | Manajemen Sertifikat |
| `/admin/checklist` | Kelola item checklist |
| `/admin/checklist/report` | Monitoring Pembelajaran |
| `/admin/helpdesk` | Kelola tiket Helpdesk |
| `/admin/diskusi` | Moderasi diskusi |
| `/admin/rtl` | RTL (disembunyikan dari UI) |
| `/profile`, `/settings` | Profil admin / Preferensi |

### Rute yang ada namun tidak tertaut dari UI

| Rute / File | Catatan |
|---|---|
| `/guru` | Duplikat dashboard guru; tanpa tautan navigasi |
| `/pembelajaran/[contentId]` | Halaman video alternatif; tidak tertaut |
| `/admin/rtl`, `/pengajar/rtl` | RTL — sengaja disembunyikan dari navigasi |
| `/modules/[id]/evaluation` | Halaman evaluasi mock; tidak ditautkan dari alur utama |

---

## Authentication & Authorization

Autentikasi berbasis **JWT** yang divalidasi backend. FE hanya melakukan proteksi di sisi klien.

### Sesi

- **Login** (`app/components/auth/LoginForm.tsx`) — POST `/api/auth/login`. Token disimpan ke `localStorage` (`token`) + objek user (`user`); token juga ditulis ke cookie `token` (`path=/; max-age=86400; SameSite=Lax`). Redirect berbasis `role` (case-insensitive): `ADMIN` → `/admin`, `GURU`/`PENGAJAR` → `/dashboard`, lain-lain → `/dashboard`.
- **Registrasi** (`RegisterForm`) — POST `/api/auth/register` → redirect ke `/otp?email=`. Registrasi guru (`/register-guru`) memakai `services/registration.service.ts` (cek NIP `GET /api/guru/cek-nip/:nip`, cari sekolah `GET /api/guru/cari-sekolah`); submit form masih `console.log` (belum terhubung endpoint pendaftaran).
- **Logout** (`logoutUser`) — menghapus `token` & `user` dari `localStorage` + dispatch event `"authChange"`.
- **Sinkronisasi** — `Header`/`Sidebar` membaca `localStorage` dan mendengarkan `"authChange"`.

> Cookie `token` di-set saat login namun **tidak dibaca** FE, dan **tidak ada** `middleware.ts`. Proteksi murni client-side; backend menegakkan otorisasi sesungguhnya.

### Proteksi halaman (client-side)

- Halaman Admin & Pengajar memeriksa `localStorage` `user` di `useEffect` dan redirect bila role tidak sesuai.
- `lib/rbac.ts` mengatur tampil/sembunyi aksi Course/Module per role.

---

## Backend/API Integration

### Pola service

Mayoritas request melewati fungsi di `services/*` memakai `fetchApi` dengan header `Authorization: Bearer <token>`:

```js
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getModules() {
  const token = localStorage.getItem("token");
  const response = await fetchApi(`${API_URL}/api/modules`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

### Grup endpoint utama yang direferensikan frontend

| Grup | Endpoint (contoh) | Method |
|---|---|---|
| **Auth** | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/verify-otp`, `/api/auth/resend-otp`, `/api/auth/forgot-password`, `/api/auth/verify-reset-otp`, `/api/auth/reset-password` | POST/GET |
| **Registrasi guru** | `/api/guru/cek-nip/:nip`, `/api/guru/cari-sekolah` | GET |
| **Course** | `/api/courses`, `/api/courses/:id` | GET, POST / GET, PUT, DELETE |
| **Modul** | `/api/modules`, `/api/modules/:id`, `/api/modules/:id/contents` | GET, POST / GET, PUT, DELETE / GET, POST |
| **Konten** | `/api/contents/:id`, `/api/upload/pdf` | PUT, DELETE / POST |
| **Evaluasi** | `/api/modules/:mid/evaluations`, `/:eid`, `/:eid/questions`, `/questions/:qid`, `/:eid/submit` | GET/POST/PUT/DELETE |
| **Mini-quiz** | `/api/mini-quizzes/content/:cid`, `/:qid`, `/:qid/questions`, `/:qid/attempt`, `/:qid/my-attempts`, `/content/:cid/check-lock` | GET/POST/PUT/DELETE |
| **Progress** | `/api/progress`, `/api/progress/:mid/start`, `/:mid/complete`, `/api/progress/contents/:cid/progress`, `/complete` | GET/POST |
| **User** | `/api/users`, `/api/users/:id`, `/:id/reset-password`, `/api/users/profile/me`, `/me/password`, `/api/upload/foto-profil` | GET/POST/PUT/DELETE |
| **Monitoring** | `/api/admin-monitoring/users/progress/all`, `/api/admin-monitoring/users/:uid/progress`, `/:uid/evaluations` | GET |
| **Feedback** | `/api/feedbacks` (GET), `/api/feedbacks/course/:courseId` (POST) | GET/POST |
| **Diskusi** | `/api/comments/course/:courseId`, `/api/comments/module/:moduleId`, `/api/comments`, `/api/comments/:id`, `/api/comments/users/search?q=` | GET/POST/DELETE |
| **Sertifikat** | `/api/certificates`, `/api/certificates/:courseId/template` (GET/POST), `/api/certificates/:id`, `/api/certificates/:courseId/claim` | GET/POST |
| **Notifikasi** | `/api/notifications`, `/api/notifications/unread-count`, `/:id/read`, `/read-all` | GET/PATCH |
| **Helpdesk** | `/api/helpdesk/tickets`, `/my`, `/:id`, `/:id/replies`, `/:id/status`, `/tickets/categories` | GET/POST/PATCH |
| **Checklist** | `/api/checklist/items`, `/items/:id`, `/today`, `/history`, `/report` | GET/POST/PUT/DELETE |
| **RTL** | `/api/rtl/submissions`, `/api/rtl/:id`, `/api/rtl/:id/review` | GET/PATCH |
| **Pencarian global** | `/api/search?q=` | GET |

> Hanya dipakai untuk memverifikasi ulang detail teknis jika diperlukan; jangan menganggapnya sebagai kontrak lengkap yang final. Beberapa fungsi service mungkin masih terdefinisi namun belum/tidak lagi dipanggil UI.

### Base URL & hardcoding (technical debt)

- Beberapa berkas meng-hardcode base URL Railway atau memakai `NEXT_PUBLIC_API_URL || "…railway.app"` (mis. `LoginForm`, `RegisterForm`, `otp`, sebagian service). Mengubah `NEXT_PUBLIC_API_URL` **tidak** otomatis mengubah berkas yang mengabaikan env.
- Preferensi ke depan: sentralisasi base URL pada satu sumber (mis. `lib/api.ts`).

---

## Environment Setup

Satu variabel environment publik dibutuhkan:

| Variable | Deskripsi |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL backend API |

File `.env*` **tidak di-commit** (`.gitignore`); buat `.env.local` manual:

```env
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend-host.example.com
```

`next.config.ts` mengizinkan `next/image` memuat gambar remote dari `ftmqfmyaspfmqvzmugkk.supabase.co` (storage publik) dan `disdik.jabarprov.go.id`.

---

## Getting Started

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

---

## Development

### Skrip npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server, port `3001`, Turbopack |
| `npm run build` | Build produksi (Turbopack) |
| `npm start` | Menjalankan server produksi (`next start`) |
| `npm run lint` | ESLint |

### Konvensi

- **Bahasa field API konsisten Bahasa Indonesia**: `sukses`, `pesan`, `data`; entitas memakai `judul`, `deskripsi`, `aspekPancawaluya`, `urutan`, `tipe` (`teks`/`video`), `skor`, `isLolos`, `passingScore`, `maxAttempts`, `timestampSeconds`, dll.
- **Pola halaman**: `useState` + `useEffect` untuk fetch, dengan state `loading`/`error`.
- **Error handling**: `catch (err)` bertipe `unknown`, dicek `err instanceof Error` sebelum akses `err.message`.
- **Konfirmasi hapus**: `window.confirm()` / `alert()` bawaan browser.
- **Tema**: warna didefinisikan sebagai CSS variables di `app/globals.css` (`--color-navy`, `--color-accent`, `--color-pale`, `--color-border-soft`, `--color-biru-muda`) plus util `.btn-primary`, `.btn-secondary`, `.alert-error`. Palet Disdik (`--disdik-blue`, `--disdik-sky`, `--disdik-yellow`, `--disdik-green`) teregistrasi sebagai utilitas Tailwind.
- **NIP**: `lib/formatNip.ts` memformat NIP ke pola `YYYY-MM-DD-YYYY-MM-X-NNN`; NIP read-only pada profil.
- **Dua dialek visual**: (1) auth/landing/learning — latar pale-blue, kartu rounded-2xl putih; (2) panel Admin/Pengajar — palet slate + aksen emerald, kartu rounded-3xl, dengan hero banner gradien Disdik biru→hijau sebagai identitas visual.
- **Struktur bersama**: `Layout.tsx` memilih chrome per-rute (Landing → Header+Footer; halaman auth → standalone; lainnya → Sidebar + konten). `Sidebar.tsx` menampilkan navigasi sesuai role, mobile memakai satu drawer.

### CI

`.github/workflows/ci.yml` menjalankan `npm ci`, `npm run lint`, `npm test --if-present` (belum ada test), dan `npm run build` pada Node 20 untuk push/PR ke `main`.

---

## Current Status / Notes

**Berjalan baik:** auth (login/register/OTP/reset), sinkronisasi header/sidebar, dashboard Guru/Pengajar/Admin, katalog & detail Course, alur belajar per Module (video + mini-quiz, materi teks, Pre-Test/Post-Test dengan submit aktif), profil & pengaturan, sertifikat (lihat/claim + manajemen template), diskusi Course dengan balasan & `@mention`, notifikasi global (badge unread di Header), Helpdesk (requester & Admin), Saran & Masukan Course-level (dengan cooldown 7×24 jam dari BE), monitoring Guru → Course → Module → Activity.

**Catatan / keterbatasan:**

- **RTL** — implementasi masih ada, namun **disembunyikan** dari seluruh entry point UI (Sidebar/dashboard/quick-search) sampai business flow final ditetapkan. Rute tetap ada; belum dihapus.
- **`/modules/[id]/evaluation`** — halaman evaluasi mock (soal statis, skor lokal), tidak ditautkan dari alur utama; alur resmi memakai `/modules/[id]/evaluations/[evaluationId]`.
- **Notifikasi (Pengaturan) — toggle belum tersedia.** Belum ada endpoint/service *notification preference* yang terkonfirmasi; toggle ditampilkan **disabled** dengan keterangan "Pengaturan notifikasi belum tersedia" (tanpa mock/localStorage). Sistem notifikasi delivery/read/unread yang berjalan **tidak diubah**. *(Blocker: perlu kontrak BE untuk preference notifikasi.)*
- **Kategori tiket Helpdesk** kini diambil dinamis dari `GET /api/helpdesk/tickets/categories` (dropdown Guru/Pengajar + filter Admin), bukan free-text.
- **Registrasi guru** (`/register-guru`) — helper cek NIP & cari sekolah aktif; submit form belum terhubung endpoint pendaftaran.
- **Base URL** sebagian di-hardcode (lihat Backend/API Integration) — technical debt.
- **Ketergantungan backend**: seluruh data monitoring, progress, mini-quiz attempt, upload, sertifikat, diskusi, notifikasi bergantung pada kontrak API live.
- **`handoff.md`** & **`repomix-output.xml`** adalah artefak catatan pengembangan, bukan bagian runtime.

---

## Contribution

- **Aturan dokumentasi**: setiap perubahan fitur/bugfix/UI/integrasi API sebaiknya memperbarui `README.md` (dan `handoff.md` bila relevan) pada task yang sama.
- Jalankan `npm run lint` dan `npm run build` (dan `npx tsc --noEmit` bila menyentuh TypeScript) sebelum mengajukan perubahan.
- Ikuti konvensi yang sudah berjalan (struktur service, pola fetch, palet & dialek visual per area) alih-alih memperkenalkan pola baru.

---

## Lisensi

Dikembangkan untuk Dinas Pendidikan Provinsi Jawa Barat dalam inisiatif Pancawaluya untuk pendidikan karakter Guru SMA.
