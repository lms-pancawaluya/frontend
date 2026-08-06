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
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:flex md:items-center md:gap-8">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src="https://disdik.jabarprov.go.id/assets/image/logo-app/Logo%20fix%20full%20color.png"
              alt="Logo Pancawaluya"
              className="w-28 h-28 md:w-32 md:h-32 object-contain rounded-xl shadow-md transition-transform duration-300 hover:scale-105 animate-pulse"
            />
          </div>

          <div className="mt-6 md:mt-0 text-center md:text-left">
            <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Untuk Guru SMA
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight mb-3">
              Belajar & Terapkan Nilai Pancawaluya
            </h1>

            <p className="text-gray-600 mb-6 max-w-xl">
              Platform pembelajaran yang membantu guru memahami dan menerapkan
              lima nilai Pancawaluya untuk membentuk karakter dan kompetensi
              siswa.
            </p>

            <div className="flex justify-center md:justify-start gap-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition transform hover:-translate-y-1"
              >
                Mulai Sekarang
              </Link>
              <Link
                href="/login"
                className="bg-white text-blue-600 border border-blue-600 px-5 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Nilai Pancawaluya */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          5 Nilai Pancawaluya
        </h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          Fondasi karakter yang dikembangkan melalui platform ini.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {pancawaluya.map((item) => (
            <div
              key={item.title}
              className="rounded-xl p-5 text-center border border-gray-100 bg-white shadow-sm hover:shadow-xl transition transform hover:-translate-y-2"
            >
              <div
                className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-bold ${item.color} text-lg`}
              >
                {item.title.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Apa itu Pancawaluya */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Apa itu Pancawaluya?</h3>
        <p className="text-gray-600 mb-4">
          Pancawaluya adalah kerangka nilai yang terdiri dari lima prinsip:
          Cageur, Bageur, Bener, Pinter, dan Singer — bertujuan membentuk
          karakter siswa melalui kebiasaan sehat, sopan santun, integritas,
          kepatuhan pada norma, dan kepemimpinan responsif.
        </p>
      </section>
    </div>
  );
}