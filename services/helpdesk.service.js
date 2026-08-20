const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Helper untuk mengambil Token Authorization
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || "";
  }
  return "";
};

// --- Helpdesk / Ticketing (Guru) ---

/**
 * Ambil seluruh tiket milik guru yang sedang login.
 * GET /api/helpdesk/tickets/my
 * Response backend: { sukses, data: Ticket[] } (array tiket).
 */
export async function getMyTickets() {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/helpdesk/tickets/my`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal mengambil daftar tiket");
  return result.data;
}

/**
 * Buat tiket baru.
 * POST /api/helpdesk/tickets
 * Body: { subject, category, description }
 */
export async function createTicket({ subject, category, description }) {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/helpdesk/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subject, category, description }),
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal membuat tiket");
  return result.data;
}
