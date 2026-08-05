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
    <div>
      {/* Hero Section */}
      <section className="bg-gray-50 px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Untuk Guru SMA
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Belajar &amp; Terapkan Nilai Pancawaluya
          </h1>
          <p className="text-gray-500 mb-8">
            Platform pembelajaran untuk membantu Guru SMA memahami dan
            menerapkan lima nilai Pancawaluya dalam proses belajar mengajar.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Mulai Sekarang
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* 5 Nilai Pancawaluya */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          5 Nilai Pancawaluya
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Fondasi karakter yang dikembangkan melalui platform ini
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {pancawaluya.map((item) => (
            <div
              key={item.title}
              className="border border-gray-200 rounded-xl p-5 text-center hover:shadow-md transition"
            >
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center font-bold ${item.color}`}
              >
                {item.title.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}