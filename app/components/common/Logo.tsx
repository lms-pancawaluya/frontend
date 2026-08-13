export default function PancawaluyaLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow */}
      <circle cx="120" cy="120" r="100" fill="#0F5A71" fillOpacity="0.05" />

      {/* 5 Kelopak / Elemen Pancawaluya (Melambangkan Cageur, Bageur, Bener, Pinter, Singer) */}
      {/* 1. Cageur (Hijau - Atas) */}
      <path
        d="M120 35 C135 55, 140 75, 120 95 C100 75, 105 55, 120 35 Z"
        fill="#22C55E"
      />
      {/* 2. Bageur (Biru - Kanan Atas) */}
      <path
        d="M165 68 C165 90, 150 105, 125 98 C130 75, 148 65, 165 68 Z"
        fill="#3B82F6"
      />
      {/* 3. Bener (Kuning - Kanan Bawah) */}
      <path
        d="M152 135 C140 155, 120 155, 118 130 C138 122, 155 125, 152 135 Z"
        fill="#EAB308"
      />
      {/* 4. Pinter (Ungu - Kiri Bawah) */}
      <path
        d="M88 135 C85 125, 102 122, 122 130 C120 155, 100 155, 88 135 Z"
        fill="#A855F7"
      />
      {/* 5. Singer (Merah - Kiri Atas) */}
      <path
        d="M75 68 C92 65, 110 75, 115 98 C90 105, 75 90, 75 68 Z"
        fill="#EF4444"
      />

      {/* Ikon Buku / Pendidikan di Tengah (Navy Disdik Jabar) */}
      <path
        d="M120 100 L145 112 V145 L120 133 L95 145 V112 Z"
        fill="#0F5A71"
      />
      <path
        d="M120 100 L145 112 L120 124 L95 112 Z"
        fill="#1E3A8A"
        fillOpacity="0.8"
      />
      <path
        d="M120 124 V158"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Aksen Bintang Integritas / Obor */}
      <circle cx="120" cy="82" r="6" fill="#F59E0B" />
    </svg>
  );
}