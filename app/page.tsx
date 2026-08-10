import Link from "next/link";

const pancawaluya = [
  {
    title: "Cageur",
    desc: "Sehat secara fisik dan mental",
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Bageur",
    desc: "Percaya diri dan mampu berkolaborasi",
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Bener",
    desc: "Disiplin dan menjunjung integritas",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    title: "Pinter",
    desc: "Tertib dan taat pada norma",
    color: "bg-purple-100 text-purple-700",
  },
  {
    title: "Singer",
    desc: "Responsif dan memiliki jiwa kepemimpinan",
    color: "bg-red-100 text-red-700",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
{/* Hero */}
<section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-pale)] to-white px-6 py-20">
  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    {/* Kolom kiri: teks */}
    <div>
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

    {/* Kolom kanan: logo dengan radial glow */}
    <div className="relative flex justify-center items-center">
      <div className="absolute w-72 h-72 bg-[var(--color-accent)]/20 rounded-full blur-3xl" />
      <img
        src="https://disdik.jabarprov.go.id/assets/image/logo-app/Logo%20fix%20full%20color.png"
        alt="Logo Pancawaluya"
        className="relative w-56 h-56 md:w-64 md:h-64 object-contain"
      />
    </div>
  </div>
</section>

      {/* 5 Nilai Pancawaluya */}
      {/* 5 Nilai Pancawaluya */}
<section className="px-6 py-20 max-w-6xl mx-auto">
  <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium text-center text-[var(--color-navy)] mb-3">
    5 Nilai Pancawaluya
  </h2>
  <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
    Fondasi karakter yang dikembangkan melalui platform ini.
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
    {pancawaluya.map((item) => (
      <div
        key={item.title}
        className="rounded-2xl p-6 text-center border border-[var(--color-border-soft)] bg-white shadow-sm hover:shadow-md transition"
      >
        <div
          className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center font-semibold ${item.color} text-lg`}
        >
          {item.title.charAt(0)}
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
{/* Apa itu Pancawaluya */}
<section className="px-6 py-20 bg-[var(--color-pale)]">
  <div className="max-w-3xl mx-auto text-center">
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