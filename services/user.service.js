const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getUsers() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/users`, {
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