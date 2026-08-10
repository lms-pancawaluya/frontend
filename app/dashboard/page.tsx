import React from 'react';

export default function TeacherDashboard() {
  const user = {
    nama: "guru test1",
    email: "guru.test1@sekolah.sch.id",
    role: "guru"
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between leading-normal">
      
      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        
        {/* Welcome Hero Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-xs font-semibold text-[#0f5a71]">
              <span className="w-2 h-2 rounded-full bg-[#0f5a71]"></span>
              Portal Pembelajaran Guru
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-normal">
              Selamat datang kembali, {user.nama}! 👋
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              Pantau perkembangan modul, selesaikan refleksi pembelajaran, dan tingkatkan kompetensi Anda bersama Pancawaluya.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <a 
              href="/modul" 
              className="px-5 py-2.5 bg-[#0f5a71] hover:bg-[#0c4759] text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              Mulai Belajar
            </a>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Modul Selesai</p>
              <p className="text-2xl font-bold text-slate-900">1 <span className="text-xs font-normal text-slate-500">/ 1 Modul</span></p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0f5a71] flex items-center justify-center font-bold text-sm border border-teal-100">
              100%
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Jam Pelajaran</p>
              <p className="text-2xl font-bold text-slate-900">8 <span className="text-xs font-normal text-slate-500">JP</span></p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm border border-sky-100">
              JP
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sertifikat Kelulusan</p>
              <p className="text-2xl font-bold text-slate-900">1 <span className="text-xs font-normal text-slate-500">Tersedia</span></p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-100">
              ✓
            </div>
          </div>
        </div>

        {/* Main Content Layout (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom Kiri - Modul & Progress Utama */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card Progress Utama */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900">Overall Progress Belajar</h2>
                <span className="text-xs font-semibold text-[#0f5a71] bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                  100% Selesai
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Penyelesaian Seluruh Modul</span>
                  <span>1 dari 1 modul</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#0f5a71] h-full rounded-full w-full"></div>
                </div>
              </div>
            </div>

            {/* List Modul Pembelajaran */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Modul Pembelajaran Guru</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar modul yang ditugaskan untuk Anda</p>
                </div>
                <a href="/modul" className="text-xs font-semibold text-[#0f5a71] hover:underline">
                  Lihat Semua →
                </a>
              </div>

              {/* Item Modul Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      ✓ Selesai
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      Modul 1: Penerapan Nilai-Nilai Pancawaluya dalam Pembelajaran
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      Refleksi & Evaluasi Terkirim • Terakhir diakses hari ini
                    </p>
                  </div>
                  
                  <a 
                    href="/modul"
                    className="px-4 py-2 bg-slate-100 hover:bg-[#0f5a71] text-slate-700 hover:text-white text-xs font-semibold rounded-lg text-center transition whitespace-nowrap self-start sm:self-auto"
                  >
                    Ulangi Materi
                  </a>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Progres Modul</span>
                  <span className="font-bold text-slate-800">100%</span>
                </div>
              </div>

            </div>

          </div>

          {/* Kolom Kanan - Informasi Akun & Bantuan */}
          <div className="space-y-6">
            
            {/* Profil Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-[#0f5a71] text-white font-bold flex items-center justify-center text-base shadow-sm">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{user.nama}</h3>
                  <p className="text-xs text-slate-500">Pengajar / Guru</p>
                </div>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <p className="text-slate-400 font-medium">Alamat Email</p>
                  <p className="text-slate-700 font-semibold mt-0.5">{user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status Akun</p>
                  <span className="inline-block mt-1 text-[10px] text-teal-700 bg-teal-50 border border-teal-100 font-bold px-2.5 py-0.5 rounded">
                    {user.role.toUpperCase()} AKTIF
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <a 
                  href="/profil" 
                  className="block w-full text-center py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Edit Profil
                </a>
              </div>
            </div>

            {/* Bantuan Card */}
            <div className="p-5 bg-[#0f5a71] text-white rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold">Butuh Bantuan Pelatihan?</h3>
              <p className="text-xs text-teal-100 leading-relaxed">
                Jika Anda mengalami kendala saat mengakses materi atau mengunggah refleksi, silakan hubungi tim fasilitator.
              </p>
              <button className="text-xs bg-white text-[#0f5a71] hover:bg-teal-50 px-4 py-2 rounded-lg font-semibold transition">
                Pusat Bantuan
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 mt-12">
        © 2026 LMS Pancawaluya. Dibuat untuk mendukung pembelajaran Guru SMA.
      </footer>

    </div>
  );
}