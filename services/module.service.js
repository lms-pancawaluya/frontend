// services/module.service.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-72a3.up.railway.app";

// Helper aman SSR untuk mengambil token dari localStorage
const getStoredAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  }
  return "";
};

export async function getModules() {
  try {
    const token = getStoredAuthToken();

    const response = await fetch(`${API_URL}/api/modules`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.sukses) {
      console.warn("API Warning (getModules):", result.pesan || "Gagal mengambil data modul");
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("Fetch Error pada getModules:", error);
    return [];
  }
}

export async function getModuleById(id) {
  try {
    const token = getStoredAuthToken();

    const response = await fetch(`${API_URL}/api/modules/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.sukses) {
      console.warn("API Warning (getModuleById):", result.pesan || "Gagal mengambil detail modul");
      return null;
    }

    return result.data || null;
  } catch (error) {
    console.error("Fetch Error pada getModuleById:", error);
    return null;
  }
}

export async function getModuleContents(moduleId) {
  try {
    const token = getStoredAuthToken();

    const response = await fetch(`${API_URL}/api/modules/${moduleId}/contents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.sukses) {
      console.warn("API Warning (getModuleContents):", result.pesan || "Gagal mengambil konten modul");
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("Fetch Error pada getModuleContents:", error);
    return [];
  }
}

export async function createModule(moduleData) {
  try {
    const token = getStoredAuthToken();

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
  } catch (error) {
    console.error("Error pada createModule:", error);
    throw error;
  }
}

export async function updateModule(id, moduleData) {
  try {
    const token = getStoredAuthToken();

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
  } catch (error) {
    console.error("Error pada updateModule:", error);
    throw error;
  }
}

export async function deleteModule(id) {
  try {
    const token = getStoredAuthToken();

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
  } catch (error) {
    console.error("Error pada deleteModule:", error);
    throw error;
  }
}