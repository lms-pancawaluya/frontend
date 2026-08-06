const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getModules() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil data modul");
  }

  return result.data;
}

export async function getModuleById(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil detail modul");
  }

  return result.data;
}

export async function getModuleContents(moduleId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules/${moduleId}/contents`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil konten modul");
  }

  return result.data;
}

export async function createModule(moduleData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(moduleData),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menambahkan modul");
  }

  return result.data;
}

export async function updateModule(id, moduleData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(moduleData),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal memperbarui modul");
  }

  return result.data;
}

export async function deleteModule(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menghapus modul");
  }

  return result;
}