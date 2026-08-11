import Image from "next/image";
import Link from "next/link";

const pancawaluya = [
  {
    title: "Cageur",
    desc: "Sehat secara fisik dan mental",
    color: "bg-green-100 text-green-700 ring-1 ring-green-200",
    icon: (
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.28M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    ),
  },
  {
    title: "Bageur",
    desc: "Percaya diri dan mampu berkolaborasi",
    color: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    icon: (
      <>
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),
  },
  {
    title: "Bener",
    desc: "Disiplin dan menjunjung integritas",
    color: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200",
    icon: (
      <>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: "Pinter",
    desc: "Tertib dan taat pada norma",
    color: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
    icon: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </>
    ),
  },
  {
    title: "Singer",
    desc: "Responsif dan memiliki jiwa kepemimpinan",
    color: "bg-red-100 text-red-700 ring-1 ring-red-200",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" />
      </>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen relative bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20">
        
        {/* Background Gambar dengan Gradasi Masking Halus (Soft Fade) ke Bawah */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-15"
          style={{
            backgroundImage: "url('/BG-Disdik.jpg')",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* Overlay Gradasi tambahan agar transisi makin menyatu dengan latar belakang */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-white/20 to-white" />

        {/* ================= ELEMEN DEKORATIF HERO ================= */}
        {/* Siku Kuning L-Shape Kiri Atas */}
        <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-sm opacity-80 pointer-events-none z-0" />
        
        {/* Pixel Grid Kotak Biru Kiri Atas */}
        <div className="absolute top-16 left-24 hidden lg:grid grid-cols-2 gap-2 opacity-20 pointer-events-none z-0">
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        </div>

        {/* Ring Lengkung Biru Kanan Atas Hero */}
        <div className="absolute -top-20 -right-40 w-64 h-64 border-[20px] border-sky-400/15 rounded-full pointer-events-none z-0" />

        {/* Konten Hero */}
        <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Kolom kiri: teks */}
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 bg-[var(--color-pale)] text-[var(--color-navy)] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-[var(--color-border-soft)]">
              Untuk Guru SMA
            </span>

            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-medium text-[var(--color-navy)] leading-[1.15] mb-6">
              Belajar &amp; terapkan{" "}
              <span className="italic text-[var(--color-accent)]">
                nilai Pancawaluya
              </span>{" "}
              di ruang kelas.
            </h1>

            <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
              Platform pembelajaran yang membantu guru memahami dan menerapkan
              lima nilai Pancawaluya untuk membentuk karakter dan kompetensi
              siswa.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white px-6 py-3 rounded-full font-medium shadow-sm hover:opacity-90 transition"
              >
                Mulai Sekarang →
              </Link>
              <Link
                href="/login"
                className="bg-white text-[var(--color-navy)] border border-[var(--color-border-soft)] px-6 py-3 rounded-full font-medium hover:bg-[var(--color-pale)] transition"
              >
                Saya sudah punya akun
              </Link>
            </div>
          </div>

          {/* Kolom kanan: logo */}
          <div className="relative flex justify-center items-center animate-fade-in-delay-1">
            <div className="absolute w-72 h-72 bg-[var(--color-accent)]/20 rounded-full blur-3xl" />
            <Image
              src="https://disdik.jabarprov.go.id/assets/image/logo-app/Logo%20fix%20full%20color.png"
              alt="Logo Pancawaluya"
              width={256}
              height={256}
              className="relative w-56 h-56 md:w-64 md:h-64 object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* 5 Nilai Pancawaluya */}
      <section className="px-6 py-20 max-w-6xl mx-auto relative z-10">
        
        {/* ================= ELEMEN DEKORATIF SECTION CARD ================= */}
        {/* Lingkaran Kuning & Ring Biru Floating di Kiri Section */}
        <div className="absolute top-1/2 -left-8 hidden xl:block pointer-events-none opacity-60 z-0">
          <div className="w-6 h-6 bg-amber-400 rounded-full mb-3 shadow-sm" />
          <div className="w-10 h-10 border-4 border-sky-400 rounded-full" />
        </div>

        {/* Pixel Grid Kotak Biru Kanan Section */}
        <div className="absolute bottom-6 -right-6 hidden xl:grid grid-cols-3 gap-2 opacity-20 pointer-events-none z-0">
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
          <div className="w-5 h-5 bg-sky-500 rounded-md"></div>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium text-center text-[var(--color-navy)] mb-3 animate-fade-in">
          5 Nilai Pancawaluya
        </h2>

        {/* Bar Gradient Warna Identitas Disdik Jabar (Biru-Hijau-Kuning) */}
        <div className="w-16 h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-amber-400 rounded-full mx-auto mb-4" />

        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto animate-fade-in-delay-1">
          Fondasi karakter yang dikembangkan melalui platform ini.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in-delay-2 relative z-10">
          {pancawaluya.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6 text-center border border-[var(--color-border-soft)] bg-white shadow-sm hover:shadow-md transition"
            >
              <div
                className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${item.color}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-6 h-6"
                >
                  {item.icon}
                </svg>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[var(--color-navy)] mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Apa itu Pancawaluya */}
      <section className="px-6 py-20 bg-[var(--color-pale)] relative z-10 overflow-hidden">
        
        {/* ================= ELEMEN DEKORATIF FOOTER SECTION ================= */}
        {/* Siku Kuning L-Shape Kanan Bawah */}
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-sm opacity-80 pointer-events-none" />

        {/* Ring Lengkung Biru Kiri Bawah */}
        <div className="absolute -bottom-12 -left-12 w-48 h-48 border-[16px] border-sky-400/20 rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center animate-fade-in relative z-10">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-4">
            Apa itu Pancawaluya?
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Pancawaluya adalah kerangka nilai yang terdiri dari lima prinsip:
            Cageur, Bageur, Bener, Pinter, dan Singer — bertujuan membentuk
            karakter siswa melalui kebiasaan sehat, sopan santun, integritas,
            kepatuhan pada norma, dan kepemimpinan responsif.
          </p>
        </div>
      </section>
    </div>
  );
}