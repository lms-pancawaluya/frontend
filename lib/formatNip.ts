// lib/formatNip.ts

export const formatNipInput = (value: string): string => {
  // Hanya ambil karakter angka dan batasi maksimal 18 digit
  const numbers = value.replace(/\D/g, "").slice(0, 18);
  
  let formatted = "";
  
  // YYYY (Tahun Lahir - 4 digit)
  if (numbers.length > 0) formatted += numbers.substring(0, 4);
  
  // MM (Bulan Lahir - 2 digit)
  if (numbers.length > 4) formatted += "-" + numbers.substring(4, 6);
  
  // DD (Tanggal Lahir - 2 digit)
  if (numbers.length > 6) formatted += "-" + numbers.substring(6, 8);
  
  // YYYY (Tahun Pengangkatan - 4 digit)
  if (numbers.length > 8) formatted += "-" + numbers.substring(8, 12);
  
  // MM (Bulan Pengangkatan - 2 digit)
  if (numbers.length > 12) formatted += "-" + numbers.substring(12, 14);
  
  // X (Jenis Kelamin - 1 digit)
  if (numbers.length > 14) formatted += "-" + numbers.substring(14, 15);
  
  // NNN (Nomor Urut - 3 digit)
  if (numbers.length > 15) formatted += "-" + numbers.substring(15, 18);
  
  return formatted;
};

export const formatNipDisplay = (value?: string): string => {
  if (!value) return "-";
  return formatNipInput(value);
};