const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// --- Registrasi & Login ---
export async function registerUser(nama, email, password) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nama, email, password }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Registrasi gagal");
  }

  return result.data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Login gagal");
  }

  localStorage.setItem("token", result.data.token);
  localStorage.setItem("user", JSON.stringify(result.data.user));

  window.dispatchEvent(new Event("authChange"));

  return result.data;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.dispatchEvent(new Event("authChange"));
}

export async function getProfile() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil data profil");
  }

  return result.data;
}

// --- Lupa Password & Reset OTP ---
export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengirimkan kode OTP");
  }

  return result;
}

export async function verifyResetOtp(email, otpCode) {
  const response = await fetch(`${API_URL}/api/auth/verify-reset-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otpCode }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Kode OTP salah atau sudah kedaluwarsa");
  }

  return result;
}

export async function resetPassword(email, passwordBaru) {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, passwordBaru }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal memperbarui password");
  }

  return result;
}