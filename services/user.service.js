const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getUsers(search = "") {
  const token = localStorage.getItem("token");
  const queryString = search ? `?search=${encodeURIComponent(search)}` : "";

  const response = await fetch(`${API_URL}/api/users${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil data pengguna");
  }

  return result.data;
}

export async function getUserById(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil detail pengguna");
  }

  return result.data;
}

export async function updateUser(id, userData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal memperbarui pengguna");
  }

  return result.data;
}

export async function resetUserPassword(id, passwordBaru) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ passwordBaru }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mereset password pengguna");
  }

  return result;
}

export async function deleteUser(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menghapus pengguna");
  }

  return result;
}

export async function getUserProgress(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/admin/users/${userId}/progress`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil progres pengguna");
  }

  return result.data;
}

export async function getUserEvaluations(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/admin/users/${userId}/evaluations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil hasil evaluasi pengguna");
  }

  return result.data;
}
