const API_URL = process.env.NEXT_PUBLIC_API_URL;

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