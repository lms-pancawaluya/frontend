# Handoff — LMS Pancawaluya (Frontend)

> Canonical onboarding document for any coding agent (Claude Code, Codex, etc.).
> **Code is the source of truth.** This file describes the ACTUAL current state of the repo.
> Last rebuilt: 2026-08-20 from full source re-analysis.

---

## 1. What This Project Is

Next.js (App Router) frontend for **LMS Pancawaluya** — a Learning Management System for **SMA (high-school) teachers** under **Dinas Pendidikan Provinsi Jawa Barat** (West Java Education Office). It teaches and tracks application of the **5 Pancawaluya values**:

| Aspect (`aspekPancawaluya`) | Meaning |
|---|---|
| `cageur` | Sehat fisik & mental |
| `bageur` | Percaya diri & kolaborasi |
| `bener` | Disiplin & integritas |
| `pinter` | Tertib & taat norma |
| `singer` | Responsif & kepemimpinan |

**Frontend only.** All data comes from an external backend REST API. No server/DB code lives here. Backend + DB are maintained by other team members (Node/Express + PostgreSQL/Prisma). Do not attempt backend fixes here — report backend issues upstream with endpoint + error + repro.

### Users & Roles

Two roles, carried on the user object as `role` (lowercase in stored data: `"admin"` / `"guru"`).

- **`guru`** (teacher) — learns modules (video + mini-quiz, text, evaluation), manages profile, tracks progress.
- **`admin`** — manages modules, content, evaluations, mini-quizzes, teacher accounts, checklist items; monitors teacher progress/evaluation results and reads feedback.

---

## 2. Current Goals

### Helpdesk V1

**Status: partially implemented (guru ticket list + create). Detail / replies / admin management NOT built.**

Helpdesk / Ticketing V1 is the current product direction. **Commit 1 (guru side) is done:**

- `services/helpdesk.service.js` — `getMyTickets()` (GET `/api/helpdesk/tickets/my`) + `createTicket({ subject, category, description })` (POST `/api/helpdesk/tickets`), following the standard service pattern (`{ sukses, pesan, data }`, Bearer token).
- `app/helpdesk/page.tsx` — guru route: lists the authenticated guru's tickets (ticket number, subject, category, status badge, created date) with loading/error/empty states, plus a **"Buat Tiket"** modal form (subject / category / description; required-field validation; refreshes list via a `refreshKey` counter on success). Category is a **free-text input** (no fixed enum — backend category values are not confirmed).
- Navigation: `Header.tsx` shows a **"Bantuan"** link for guru only; the dashboard "Pusat Bantuan & Layanan" card now links to `/helpdesk`.

⚠️ **Ticket response shape is NOT confirmed by the backend contract.** The page reads fields **defensively** (fallback names: `ticketNumber`/`nomor`/`number`/`kode`/`id`, `subject`/`subjek`/`judul`, `category`/`kategori`, `status`, `createdAt`/`created_at`/`createdDate`/`tanggal`) — consistent with the repo's existing tolerant-field pattern. Status-badge mapping is tolerant (open/proses/selesai → blue/amber/green, unknown → neutral). Confirm the real shape against the live API and tighten when known.

**Remaining Helpdesk V1 work (NOT built):** ticket detail view, replies/threading, admin ticket management (list/assign/respond), status updates. Backend endpoints for those are unverified. Do not build them without confirming the contract.

The nearest *other* existing surface is module **feedback (Saran & Kritik)** — a separate flow, not part of helpdesk.

### Other Goals (supported by the repo)

- **Complete the guru evaluation loop.** Module evaluation is the weakest real flow: the linked evaluation page uses hardcoded mock questions and never persists answers; the API-backed evaluation page only `console.log`s answers. Wiring `submitEvaluation()` + a real score/result screen is the highest-value goal. See [§11](#11-known-issues--blockers) and [§10](#10-current-implementation-status).
- **Wire up module feedback.** `sendModuleFeedback()` and `ModuleFeedbackForm` exist but are not mounted in the learning flow.
- **Consolidate duplicate video/quiz implementations** (4 near-duplicate implementations exist).
- **Centralize the backend base URL** (currently hardcoded in several files, see [§8](#8-important-api-contracts--conventions)).

---

## 3. Tech Stack & Config

| Item | Value |
|---|---|
| Framework | Next.js `16.3.0`, App Router, Turbopack |
| Language | TypeScript `^5` (strict). **`services/*` are `.js`** |
| React | `react` / `react-dom` `19.2.8` |
| Styling | Tailwind CSS `v4` via `@tailwindcss/postcss` |
| HTTP | native `fetch` (axios installed but only imported by unused `lib/api.ts`) |
| Lint | ESLint `^9` + `eslint-config-next` `16.3.0` |
| Fonts | `Fraunces` (display), `Inter` (body) via `next/font/google` |
| Node | `>= 20.9.0` |

- **No `src/` folder** — everything under repo root (`app/`, `services/`, `types/`, `lib/`).
- **Import alias** `@/*` → `./*` (see `tsconfig.json`).
- `package.json` scripts: `dev` (port **3001**, Turbopack), `build`, `start`, `lint`.
- Single env var: **`NEXT_PUBLIC_API_URL`** (in `.env.local`, git-ignored). Current value: `https://backend-production-72a3.up.railway.app`.
- `next.config.ts` allows `next/image` remote hosts: `ftmqfmyaspfmqvzmugkk.supabase.co` (public storage) and `disdik.jabarprov.go.id`.
- **No `middleware.ts`.** All route protection is client-side.
- CI: `.github/workflows/ci.yml` runs `npm ci` → `lint` → `test --if-present` (no tests yet) → `build` on Node 20 for push/PR to `main`.

---

## 4. Project Structure

```
app/
  layout.tsx                 root layout → wraps all pages in <Layout> (Header + Footer)
  page.tsx                   landing "/" (server component): hero + 5 Pancawaluya cards
  HeroCta.tsx                landing CTA, auth-aware (guest → register/login, auth → dashboard)
  globals.css                Tailwind + CSS vars + .btn-primary/.btn-secondary/.alert-error
  components/
    auth/LoginForm.tsx        login (inline fetch, sets localStorage + cookie, role redirect)
    auth/RegisterForm.tsx     register (nama, nip, email, password) → /otp
    common/Header.tsx         auth-aware nav, listens to "authChange" event
    common/Footer.tsx, Layout.tsx, Logo.tsx
    mini-quiz/                ContentLockGuard, QuizScoreScreen, VideoInteractiveQuiz,
                              VideoPlayerWithQuiz  (reusable quiz/video building blocks)
  login/  register/  otp/  forgot-password/     auth pages
  dashboard/page.tsx         guru dashboard (admin → redirect /admin)
  guru/page.tsx              near-duplicate guru dashboard, NOT linked anywhere
  profile/                   page.tsx (role router) + GuruProfileView + AdminProfileView
  modules/
    page.tsx                 module catalog (guru-facing; has FALLBACK_MODULE_DATA)
    ModuleFeedbackForm.tsx   Saran & Kritik form (NOT currently mounted)
    [id]/page.tsx            video learning + mini-quiz (YouTube IFrame, robust variant)
    [id]/video/page.tsx      near-duplicate of [id]/page.tsx (less robust)
    [id]/text/page.tsx       text material
    [id]/evaluation/page.tsx MOCK evaluation (hardcoded Qs, local score, inline dead feedback)
    [id]/evaluations/page.tsx           redirects to first evaluation
    [id]/evaluations/[evaluationId]/page.tsx  API-backed eval (submit NOT wired)
  pembelajaran/[contentId]/page.tsx     alt video page (ContentLockGuard + VideoPlayerWithQuiz), NOT linked
  helpdesk/page.tsx          guru helpdesk: ticket list + "Buat Tiket" modal (Helpdesk V1, commit 1)
  admin/
    page.tsx                 admin dashboard (4 nav cards)
    modules/page.tsx         module list + delete
    modules/new/page.tsx     create module
    modules/[id]/page.tsx    admin module detail (read-only preview + management actions)
    modules/[id]/edit/page.tsx           edit module + inline content CRUD
    modules/[id]/contents/new/page.tsx   add content
    modules/[id]/evaluations/page.tsx    evaluation list + create
    modules/[id]/evaluations/[evalId]/page.tsx   evaluation question CRUD
    modules/[id]/quiz/[contentId]/page.tsx       mini-quiz CRUD (per video content)
    users/page.tsx           teacher account list + delete
    users/[id]/page.tsx      teacher edit (email/sekolah/status) + reset password
    checklist/page.tsx       checklist item CRUD per aspect
    checklist/report/page.tsx  teacher progress + evaluation-result + feedback monitoring
services/                    auth, module, content, evaluation, miniQuiz, progress, user, checklist, helpdesk (.js)
types/miniQuiz.ts            mini-quiz TS interfaces
lib/api.ts                   unused axios instance   |   lib/formatNip.ts  NIP formatter
```

---

## 5. Routing Map

Most pages are client components (`"use client"`). Server components: `/`, `/login`, `/register`, `Footer`, `Logo`.

### Public / Auth

| Route | Purpose | Key components/services |
|---|---|---|
| `/` | Landing — hero + 5 values | `HeroCta` (auth-aware) |
| `/login` | Login (Email/NIP + password) | `LoginForm` |
| `/register` | Register guru | `RegisterForm` |
| `/otp?email=` | 6-digit OTP verify + resend (60s cooldown) | `POST /api/auth/verify-otp`, `resend-otp` |
| `/forgot-password` | 3-step reset (email → OTP → new password) | `auth.service`: forgot/verifyReset/reset |

### Guru / authenticated

| Route | Purpose | Access | Notes |
|---|---|---|---|
| `/dashboard` | Progress summary | guru; admin auto-redirects to `/admin` | `getModules` + `getProgress` |
| `/guru` | Duplicate dashboard | — | **not linked from UI** |
| `/modules` | Module catalog | no guard | falls back to `FALLBACK_MODULE_DATA` on empty/error |
| `/modules/[id]` | Video learning + mini-quiz | no guard | YouTube IFrame, fast-forward lock |
| `/modules/[id]/video` | Video learning (dup) | no guard | near-duplicate, less robust |
| `/modules/[id]/text` | Text material | no guard | picks `tipe==="teks"/"text"` |
| `/modules/[id]/evaluation` | **Mock** evaluation | no guard | hardcoded Qs, local score, dead feedback form |
| `/modules/[id]/evaluations` | Redirect to first eval | no guard | `getModuleEvaluations` |
| `/modules/[id]/evaluations/[evaluationId]` | API-backed eval | no guard | **submit not wired** (console.log + alert) |
| `/pembelajaran/[contentId]` | Alt video page | no guard | **not linked**; `ContentLockGuard` + `VideoPlayerWithQuiz` |
| `/helpdesk` | Guru ticket list + create | no guard | `getMyTickets`, `createTicket`; loading/error/empty + "Buat Tiket" modal |
| `/profile` | Profile (role-branched view) | token required | `GET /api/users/profile/me` |

### Admin (`/admin/*`)

| Route | Purpose | Role guard? | Key services |
|---|---|---|---|
| `/admin` | Dashboard, 4 nav cards | ✅ | `getProfile` |
| `/admin/modules` | Module list + delete | ✅ | `getModules`, `deleteModule` |
| `/admin/modules/new` | Create module | ❌ none | `createModule` |
| `/admin/modules/[id]` | Detail: preview + mgmt actions | ❌ none | `getModuleById`, `getModuleContents` |
| `/admin/modules/[id]/edit` | Edit module + inline content CRUD | ❌ none | `updateModule`, `updateContent`, `deleteContent` |
| `/admin/modules/[id]/contents/new` | Add content | ❌ none | `createContent` |
| `/admin/modules/[id]/evaluations` | Eval list + create | ✅ | `getModuleEvaluations`, `createEvaluation` |
| `/admin/modules/[id]/evaluations/[evalId]` | Question CRUD | ✅ | `addQuestion`, `updateQuestion`, `deleteQuestion` |
| `/admin/modules/[id]/quiz/[contentId]` | Mini-quiz CRUD | ❌ none | `miniQuiz.service` (full CRUD) |
| `/admin/users` | Teacher list + delete | ✅ (user only, no token) | `getUsers`, `deleteUser` |
| `/admin/users/[id]` | Teacher edit + reset password | ✅ | `getUserById`, `updateUser`, `resetUserPassword` |
| `/admin/checklist` | Checklist item CRUD | ✅ | `checklist.service` items CRUD |
| `/admin/checklist/report` | Monitoring (progress + eval + feedback) | ✅ (user only, no token) | `getUsers`, `getUserProgress`, `getUserEvaluations`, `getAllFeedbacks` |

> **Admin module detail ≠ guru learning page (intentional).** `/admin/modules/[id]` renders content **read-only** (video embeds / text) plus **management action links** (Edit Modul, Edit Evaluasi, Kelola Quiz, + Tambah Konten). It is a management hub, not a gated learning flow. Do NOT collapse it into the guru learning experience. Keep management actions separate from learning actions.

> **`/admin/checklist/report` is misnamed.** Despite the path, it does NOT use checklist data or `getChecklistReport()`. It monitors module completion + evaluation results + feedback. The dashboard links to it as "Monitoring Pengerjaan Modul Guru".

---

## 6. Authentication & Authorization

JWT-based, validated by backend. Frontend protection is **client-side only** (UX, not security).

### Session

- **Login** — `LoginForm.tsx` calls `POST /api/auth/login` via **inline fetch** (not the `loginUser` service). Stores `token` + `user` (JSON) in `localStorage`, also writes a `token` **cookie** (`path=/; max-age=86400; SameSite=Lax`), dispatches `"authChange"`, redirects by role.
- **Register** — `RegisterForm.tsx` → `POST /api/auth/register` `{ nama, nip, email, password }` → redirects `/otp?email=`.
- **Logout** — `logoutUser()` (`auth.service.js`) removes `token` + `user`, dispatches `"authChange"`.
- **Header sync** — `Header.tsx` reads `localStorage` and listens for `"authChange"` to re-render nav without reload. `HeroCta.tsx` uses the same pattern.

> The login cookie is **never read** by frontend code and there is no `middleware.ts`. It exists but is currently inert.

### ⚠️ Role-casing inconsistency (do not break, be careful)

- `LoginForm.tsx` compares role **uppercased**: `String(user?.role).toUpperCase() === "ADMIN"`.
- **Everywhere else** (`Header`, `HeroCta`, `dashboard`, `guru`, all admin guards, `profile`) compares **lowercase**: `role === "admin"` / `role !== "admin"`.
- This works only because the backend returns lowercase `"admin"`/`"guru"`. If you touch role logic, preserve lowercase as the stored contract; the uppercase compare in LoginForm is just defensive.

### Client-side guards

- **Admin pages WITH guard** (`useEffect`: read `localStorage`, `role !== "admin"` → `/dashboard`, missing → `/login`): `/admin`, `/admin/modules`, `/admin/modules/[id]/evaluations`, `/admin/modules/[id]/evaluations/[evalId]`, `/admin/users`, `/admin/users/[id]`, `/admin/checklist`, `/admin/checklist/report`. (`/admin/users` and `/admin/checklist/report` check `user` only, not `token`.)
- **Admin pages WITHOUT guard**: `/admin/modules/new`, `/admin/modules/[id]`, `/admin/modules/[id]/edit`, `/admin/modules/[id]/contents/new`, `/admin/modules/[id]/quiz/[contentId]`. Reachable by URL without a role check (they still fail at the API if unauthorized).
- **Guru/module pages**: no redirect guard; API calls simply fail without a token. `/dashboard` and `/guru` redirect admins to `/admin`.
- **Hydration**: `/dashboard` gates render on a `mounted` flag before touching `localStorage` to avoid SSR/hydration mismatch; `HeroCta` renders a `"loading"` placeholder for the same reason. Follow this pattern for any new auth-aware component.

---

## 7. Feature Inventory

Status legend: ✅ implemented · 🟡 partial · 🔌 backend-dependent · ❌ stub/mock/dead · 🔮 planned

### Admin

| Feature | Status | Route(s) | Service/API | Notes |
|---|---|---|---|---|
| Admin dashboard | ✅ | `/admin` | `getProfile` | 4 nav cards; no stats |
| Module list + delete | ✅ | `/admin/modules` | `getModules`, `deleteModule` | search by judul/deskripsi; `window.confirm` delete |
| Module create | ✅ | `/admin/modules/new` | `createModule` | `{ judul, deskripsi, aspekPancawaluya, urutan }`; no role guard |
| Module detail | ✅ | `/admin/modules/[id]` | `getModuleById`, `getModuleContents` | read-only preview + mgmt action links |
| Module edit + content CRUD | ✅ | `/admin/modules/[id]/edit` | `updateModule`, `updateContent`, `deleteContent` | inline content edit (can change tipe) |
| Content add | ✅ | `/admin/modules/[id]/contents/new` | `createContent` | teks/video; success → detail page |
| Evaluation list + create | ✅ | `/admin/modules/[id]/evaluations` | `getModuleEvaluations`, `createEvaluation` | create → jumps to question CRUD |
| Evaluation question CRUD | 🟡 | `/admin/modules/[id]/evaluations/[evalId]` | `addQuestion`, `updateQuestion`, `deleteQuestion` | **edit only for `pilihan_ganda`**; esai edit disabled |
| Mini-quiz CRUD | ✅ | `/admin/modules/[id]/quiz/[contentId]` | `miniQuiz.service` (7 fns) | per video content; quiz + question CRUD; no role guard |
| Teacher account mgmt | ✅ | `/admin/users` | `getUsers`, `deleteUser` | lists guru only; admin rows can't be edited/deleted |
| Teacher edit + reset password | ✅ | `/admin/users/[id]` | `getUserById`, `updateUser`, `resetUserPassword` | editable: email/sekolah/status; nama+NIP read-only |
| Teacher progress monitoring | ✅ | `/admin/checklist/report` | `getUserProgress` | eager per-guru progress bars |
| Evaluation result monitoring | ✅ | `/admin/checklist/report` | `getUserEvaluations` | lazy on expand; skor per evaluation |
| Feedback (Saran & Kritik) view | ✅ | `/admin/checklist/report` | `getAllFeedbacks` | matched by user.id + module.id |
| Checklist item mgmt | ✅ | `/admin/checklist` | items CRUD + toggle `isActive` | grouped by 5 aspects |
| Checklist consistency report | ❌ unused | — | `getChecklistReport` | service fn exists, **never called** |

### Guru

| Feature | Status | Route(s) | Service/API | Notes |
|---|---|---|---|---|
| Guru dashboard | ✅ | `/dashboard` | `getModules`, `getProgress` | progress % = completed/total |
| Module browsing | ✅ | `/modules` | `getModules` | search + status tabs; **certificate hardcoded "Belum Tersedia"** |
| Video learning + mini-quiz | 🟡 | `/modules/[id]`, `/modules/[id]/video` | `getModuleContents`, mini-quiz attempt (inline fetch) | fast-forward lock; **on API error defaults to PASS**; hardcoded fallback quiz |
| Text material | ✅ | `/modules/[id]/text` | `getModuleContents` | |
| Module evaluation | ❌ mock | `/modules/[id]/evaluation` | `completeModule` (only on pass) | **hardcoded questions**, local score, **feedback form dead** |
| Module evaluation (API) | 🟡 | `/modules/[id]/evaluations/[evaluationId]` | `getEvaluationDetail` | renders real Qs; **submit not wired** (console.log + alert) |
| Progress/completion | 🔌 | dashboard, catalog | `getProgress`, `completeModule` | `startModule` exists but **not called** |
| Feedback (Saran & Kritik) | ❌ not mounted | — | `sendModuleFeedback` + `ModuleFeedbackForm` | component built but not imported anywhere |
| Profile mgmt | ✅ | `/profile` | profile GET/PUT, password PUT, photo upload | guru: 3 tabs; hardcoded Jabar school list |
| Daily checklist (guru side) | ❌ no UI | — | `getTodayChecklist`, `submitTodayChecklist`, `getChecklistHistory`, `uploadFotoBukti` | services exist, **no page consumes them** |
| Helpdesk — ticket list + create (guru) | 🔌 | `/helpdesk` | `getMyTickets`, `createTicket` | Helpdesk V1 commit 1; ticket response shape **unconfirmed** → defensive rendering; category free-text; **no detail/replies/admin/status-update** |

---

## 8. Important API Contracts & Conventions

### Response envelope

All backend responses: `{ sukses: boolean, pesan?: string, data: any }` (Indonesian field names). List responses may add `jumlah`. Services check `result.sukses`, throw `new Error(result.pesan)` on failure, return `result.data`. `module.service` is defensive: returns `[]`/`null` on non-OK instead of throwing.

### Service pattern

```js
const API_URL = process.env.NEXT_PUBLIC_API_URL;
export async function getX() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/...`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!result.sukses) throw new Error(result.pesan || "…");
  return result.data;
}
```

### Endpoints referenced by the frontend

| Group | Endpoint | Methods | Used by |
|---|---|---|---|
| Auth | `/api/auth/register`, `/login`, `/me` | POST/POST/GET | auth.service, LoginForm, RegisterForm |
| Auth OTP | `/api/auth/verify-otp`, `/resend-otp` | POST | otp page |
| Auth reset | `/api/auth/forgot-password`, `/verify-reset-otp`, `/reset-password` | POST | forgot-password |
| Modules | `/api/modules`, `/api/modules/:id` | GET,POST / GET,PUT,DELETE | module.service |
| Contents | `/api/modules/:id/contents` (GET,POST), `/api/contents/:id` (PUT,DELETE) | | module/content.service |
| Evaluations | `/api/modules/:mid/evaluations` (GET,POST), `/:eid` (GET), `/:eid/questions` (POST), `/:eid/submit` (POST) | | evaluation.service |
| Eval questions | `/api/modules/:mid/evaluations/questions/:qid` | PUT, DELETE | evaluation.service |
| Mini-quiz | `/api/mini-quizzes/content/:cid` (GET,POST), `/:qid` (PUT,DELETE), `/:qid/questions` (POST), `/questions/:qid` (PUT,DELETE) | | miniQuiz.service |
| Mini-quiz runtime | `/api/mini-quizzes/:qid/attempt` (POST), `/:qid/my-attempts` (GET), `/content/:cid/check-lock` (GET) | | video pages, mini-quiz components (inline fetch) |
| Content direct | `/api/contents/:cid` | GET | pembelajaran page |
| Progress | `/api/progress` (GET), `/:mid/start` (POST), `/:mid/complete` (POST) | | progress.service |
| Users | `/api/users`, `/api/users/:id` (GET,PUT,DELETE), `/:id/reset-password` (PUT) | | user.service |
| Profile | `/api/users/profile/me` (GET,PUT), `/me/password` (PUT), `/api/upload/foto-profil` (POST) | | profile views |
| Admin monitoring | `/api/admin/users/:uid/progress`, `/:uid/evaluations` | GET | user.service |
| Feedback | `/api/feedbacks` (GET), `/api/feedbacks/module/:mid` (POST) | | evaluation.service |
| Checklist | `/api/checklist/items` (GET,POST), `/items/:id` (PUT,DELETE), `/today` (GET,POST), `/history` (GET), `/report` (GET), `/api/upload/foto-bukti` (POST) | | checklist.service |
| Helpdesk | `/api/helpdesk/tickets` (POST), `/api/helpdesk/tickets/my` (GET) | | helpdesk.service (guru) |

### Payload / data contracts (do not break)

- **Evaluation question — ADD** (`addQuestion`): pilihan_ganda → `{ pertanyaan, options: [{ teksOpsi, isCorrect }] }`; esai → `{ pertanyaan, tipe }` (no options).
- **Evaluation question — UPDATE** (`updateQuestion`): `{ pertanyaan, options: [{ teks, isCorrect }] }`. ⚠️ **Field is `teks` on update but `teksOpsi` on add** — real inconsistency; the loader `mapQuestionOptions` reads `opt.teksOpsi || opt.teks` to tolerate both. Preserve both when editing.
- **Mini-quiz question** (`miniQuiz.service`): `{ pertanyaan, options: [{ teksOpsi, isCorrect }] }` — uses `teksOpsi` consistently.
- **Mini-quiz** create: `{ judul, timestampSeconds, passingScore (default 80), maxAttempts (default 3) }`.
- **Mini-quiz attempt** submit body: `{ jawaban: [{ questionId, optionId }] }`; response `data`: `{ attemptNumber, skor, isLolos, benar, totalSoal, passingScore, sisaPercobaan, mustRepeat }` (see `types/miniQuiz.ts`).
- **`isCorrect` is authoring-only.** The public evaluation detail endpoint returns questions + options **without** the correct flag (safe). Admin sees `isCorrect` only inside the authoring forms (radio / "Benar" toggle). Never render `isCorrect` on guru-facing pages.
- **Module** entity: `{ id, judul, deskripsi, aspekPancawaluya, urutan, _count: { contents, evaluations } }`.
- **Content** entity: `{ id, moduleId, judul, tipe ("teks"|"video"), konten, urutan }`.
- **Progress** item: `{ status ("selesai"|…), completedAt, module: {…} }` (guru code treats `status === "selesai"` as done; dashboard also tolerates `completed`/`isCompleted`/`selesai`).
- **User**: `{ id, nama, email, role ("admin"|"guru"), nip, sekolah, status ("aktif"|"nonaktif"|"pensiun"|"wafat"), gelar?, fotoProfil?, modulSelesai? }`. `sekolah` is a free-text school name (guru profile offers a hardcoded Jabar dropdown or manual input).

### Base-URL hardcoding (technical debt)

- **Ignore env entirely** (hardcoded `API_BASE_URL`): `app/modules/[id]/page.tsx`, `app/modules/[id]/video/page.tsx`, `app/pembelajaran/[contentId]/page.tsx`, and all 3 `mini-quiz/*` components that call the API.
- **Env with hardcoded fallback** (`process.env.NEXT_PUBLIC_API_URL || "…railway.app"`): `LoginForm`, `RegisterForm`, `otp`, `evaluation.service`, `miniQuiz.service`, `module.service`, `checklist.service` (fallback `""`).
- **Env only, no fallback**: `auth`, `content`, `progress`, `user` services, `lib/api.ts`.
- Consequence: changing `NEXT_PUBLIC_API_URL` will NOT redirect the hardcoded files. To fully switch backends, edit those files too. **Prefer centralizing** on a single exported base URL in future work.

---

## 9. UI/UX & Design System (observed conventions)

Follow these; they are consistent across the codebase.

- **Theme tokens** (`app/globals.css` CSS vars): `--color-navy #0F2A4A`, `--color-accent #1D6F8C`, `--color-pale #EAF3FB`, `--color-border-soft #CFE3F0`, `--color-biru-muda #459ed6`. Disdik brand palette: `--disdik-blue #0047BA`, `--disdik-sky #409ED8`, `--disdik-yellow #F2B200`, `--disdik-green #0F9848` (registered as Tailwind `*-disdik-*` utilities via `@theme inline`).
- **Fonts**: `var(--font-display)` (Fraunces) for headings via `font-[family-name:var(--font-display)]`; Inter for body.
- **Utility classes** in globals.css: `.btn-primary` (navy pill), `.btn-secondary` (accent pill), `.alert-error` (rose error box), `.animate-fade-in[-delay-1|-2]`.
- **Two visual dialects, intentionally distinct:**
  - **Auth / landing / guru learning**: pale-blue background (`--color-pale`), decorative amber "L" corners, sky pixel-grid dots, blur rings, rounded-2xl white cards with backdrop-blur. Video/learning pages layer the Disdik 4-color ambient glows.
  - **Admin panel**: slate palette (`bg-slate-50/60`, `slate-900` hero banners, emerald accents), `rounded-3xl` cards, `border-slate-200/80`, search inputs, tables. Keep new admin UI in this slate/emerald language.
- **Aspect badge colors** — `Record<string,string>` (`aspekColor`) repeated across landing/modules/admin: cageur=green, bageur=blue, bener=yellow, pinter=purple, singer=red.
- **Status badges** (users): aktif=green, nonaktif=gray, pensiun=amber, wafat=red. Role badges: admin=purple, guru=blue.
- **Progress bars**: red `<50%`, amber `<80%`, green `≥80%` (monitoring report).
- **Loading**: inline spinner SVG + "Memuat…" text. **Empty**: muted "Belum ada…" / "Tidak ada…" text. **Error**: `.alert-error` / rose box; forms show inline error banners.
- **Confirm/delete**: `window.confirm(...)` before every destructive call; button shows a disabled "Menghapus…" state during the request.
- **CRUD forms** are written **separately for add vs edit** (deliberate duplication for clarity, not a reusable component). Dynamic routes read via `useParams()` cast `as string`.
- **Data-fetch pattern**: `useState` (data + `loading` + `error`) with an `async` function defined *inside* `useEffect`. A `refreshKey`/`onRefresh` counter triggers re-fetch after mutations.
- **YouTube**: embedded via IFrame; ID extracted with a regex helper (`getYoutubeId` / `getYoutubeEmbedUrl`, duplicated in several files).
- **Consistency rules to uphold**: admin module detail must keep management actions separate from (and not become) the guru learning page; search/filter UI must follow the slate admin-panel language; never expose `isCorrect` to guru.

---

## 10. Current Implementation Status

- ✅ **Solid**: auth (login/register/OTP/reset), header/nav sync, guru + admin dashboards, module catalog, admin module/content/evaluation/mini-quiz/user/checklist CRUD, profile management, admin monitoring (progress + eval results + feedback view), video mini-quiz gating (YouTube).
- 🟡 **Partial**: evaluation-question edit (pilihan_ganda only); API-backed guru evaluation renders but doesn't submit; video mini-quiz silently passes on API error.
- 🔌 **Backend-dependent** (works only against the live API contract): all monitoring, progress, mini-quiz attempts, profile/photo upload.
- ❌ **Stub / dead / unmounted**: `/modules/[id]/evaluation` mock questions + dead inline feedback; `ModuleFeedbackForm` (unmounted); guru daily-checklist services (no UI); `getChecklistReport` (uncalled); `startModule` (uncalled); certificate ("Belum Tersedia"); `lib/api.ts` (unused axios).
- 🔮 **Planned**: Helpdesk V1 — guru ticket **list + create** are done (`/helpdesk`, `helpdesk.service`); ticket detail, replies, admin management, and status updates remain (backend contract for those unverified).

**Validation at handoff**: `npx tsc --noEmit` → **pass (exit 0)**. `npx eslint` → **pass (exit 0)**.

---

## 11. Known Issues / Blockers

| # | Issue | Impact | Type |
|---|---|---|---|
| 1 | Guru evaluation submit not wired (`/modules/[id]/evaluations/[evaluationId]` console.logs; `/evaluation` is mock) | teachers can't really submit/score evaluations | 🟡 must-fix |
| 2 | Video mini-quiz defaults to **PASS** on API error/network fail (`{ skor:100, isLolos:true }`) | students bypass quizzes when backend hiccups | ⚠️ correctness |
| 3 | `ModuleFeedbackForm` + `sendModuleFeedback` not mounted anywhere | feedback can't be sent by guru (admin can still read pre-existing) | 🟡 |
| 4 | 4 near-duplicate video/quiz implementations (`[id]/page.tsx`, `[id]/video`, `VideoPlayerWithQuiz`, `VideoInteractiveQuiz`) | drift/maintenance risk | tech-debt |
| 5 | Base URL hardcoded in ~9 files (see §8) | env switch is incomplete | tech-debt |
| 6 | Missing role guards on 5 admin pages (§6) | UX only (API still enforces) | 🟡 |
| 7 | Eval option field name `teksOpsi` (add) vs `teks` (update) | breaks silently if "fixed" naively | contract trap |
| 8 | `/admin/checklist/report` misnamed (monitoring, not checklist) | confusing; guru checklist UI absent | naming/gap |
| 9 | JWT in `localStorage` | XSS-exposed; backend is the real security boundary | known/accepted |
| 10 | Login cookie set but never read; no `middleware.ts` | inert code | minor |
| 11 | `FALLBACK_MODULE_DATA` + hardcoded fallback quiz can mask real API failures | misleading UI on empty/error | 🟡 |

**Needs verification** (not determinable from frontend alone): exact backend response shapes for `getUserProgress`/`getUserEvaluations`/`getAllFeedbacks`; whether `/api/modules/:mid/evaluations/:eid/submit` returns a score payload; whether guru daily-checklist endpoints are live; whether the login cookie is used by any backend/proxy.

---

## 12. Development Workflow (for future agents)

1. **Inspect the repo first.** Read the actual files; this handoff may lag the code.
2. **Understand before changing.** Trace the service + page before editing.
3. **Smallest relevant change.** Preserve unrelated behavior and the two visual dialects.
4. **Preserve role separation** and the client-side guard pattern.
5. **Test types**: `npx tsc --noEmit`.
6. **Lint**: `npm run lint` (or `npx eslint`).
7. **Verify UI** when applicable (`npm run dev`, port 3001).
8. **Update docs in the SAME task** (see §13).
9. **Review the diff** before finishing.
10. **Commit only when explicitly requested.** Prefer small, incremental checkpoints.

---

## 13. Documentation Rule (MANDATORY)

Every feature addition, optimization, bug fix, UI/UX change, API integration, architectural change, or behavioral change MUST update **both** `handoff.md` and `README.md` in the **same task** — never deferred.

- `handoff.md` → implementation state, architecture, decisions, contracts, dependencies, known issues, agent-onboarding context.
- `README.md` → project overview, purpose, features, stack, setup, usage, high-level architecture. Do **not** dump the whole handoff into README.

Both must reflect the CURRENT code after every change.

---

## 14. Rules for Future Agents

- Inspect existing implementation before coding; don't trust docs over code.
- **Do not invent API contracts.** Confirm response shapes against the live backend before wiring new endpoints.
- Follow the existing `services/*.js` pattern and the `{ sukses, pesan, data }` envelope.
- Preserve **role separation** and the **client-side guard** architecture; keep role values lowercase in stored data.
- Keep admin management UI separate from guru learning UI; never expose `isCorrect` to guru.
- Respect the `teksOpsi` (add) vs `teks` (update) evaluation-option contract (#7).
- Avoid unrelated refactors; prefer incremental changes and checkpoints.
- Run `tsc --noEmit` and ESLint before finishing.
- Update `handoff.md` AND `README.md` with every change.
- Do NOT commit unless explicitly asked.
- Treat backend-confirmed contracts as authoritative; when something can't be verified from the repo, say **"Needs verification"** rather than guessing.
- Backend bugs go **upstream** with endpoint + error + repro — do not patch around them in the frontend.
