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

/**
 * Ambil detail satu tiket (termasuk daftar balasan).
 * GET /api/helpdesk/tickets/:ticketId
 * Response backend: { sukses, data: Ticket } (objek tiket + replies[]).
 */
export async function getTicketDetail(ticketId) {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/helpdesk/tickets/${ticketId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal mengambil detail tiket");
  return result.data;
}

/**
 * Kirim balasan pada tiket.
 * POST /api/helpdesk/tickets/:ticketId/replies
 * Body: { message }
 */
export async function replyToTicket(ticketId, message) {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/helpdesk/tickets/${ticketId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal mengirim balasan");
  return result.data;
}
