const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getProgress() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/progress`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil data progress");
  }

  return result.data;
}

export async function startModule(moduleId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/progress/${moduleId}/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal memulai modul");
  }

  return result.data;
}

export async function completeModule(moduleId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/progress/${moduleId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menyelesaikan modul");
  }

  return result.data;
}