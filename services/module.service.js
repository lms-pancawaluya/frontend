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