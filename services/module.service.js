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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      console.warn(`API Warning (getModules): Status ${response.status}`);
      return [];
    }

    const result = await response.json();

    if (Array.isArray(result)) {
      return result;
    } else if (result && result.sukses && Array.isArray(result.data)) {
      return result.data;
    } else if (result && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error("Fetch Error pada getModules:", error);
    return [];
  }
}

export async function getModuleById(id) {
  if (!id) return null;

  try {
    const token = getStoredAuthToken();

    const response = await fetch(`${API_URL}/api/modules/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 404) {
      console.warn(`API Warning (getModuleById): Modul ID ${id} tidak ditemukan (404).`);
      return null;
    }

    if (!response.ok) {
      console.warn(`API Warning (getModuleById): Status ${response.status}`);
      return null;
    }

    const result = await response.json();

    if (result && result.sukses && result.data) {
      return result.data;
    } else if (result && result.data) {
      return result.data;
    }

    return result || null;
  } catch (error) {
    console.error("Fetch Error pada getModuleById:", error);
    return null;
  }
}

export async function getModuleContents(moduleId) {
  if (!moduleId) return [];

  try {
    const token = getStoredAuthToken();

    const response = await fetch(`${API_URL}/api/modules/${moduleId}/contents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // Handle 404 secara mulus tanpa melempar error agar UI fallback dapat dirender
    if (response.status === 404) {
      console.warn(`API Warning (getModuleContents): Konten modul ID ${moduleId} tidak ditemukan (404).`);
      return [];
    }

    if (!response.ok) {
      console.warn(`API Warning (getModuleContents): Status ${response.status}`);
      return [];
    }

    const result = await response.json();

    // Penanganan fleksibel: array murni [...] atau dibungkus { sukses: true, data: [...] }
    if (Array.isArray(result)) {
      return result;
    } else if (result && result.sukses && Array.isArray(result.data)) {
      return result.data;
    } else if (result && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(moduleData),
    });

    const result = await response.json();

    if (!response.ok || !result.sukses) {
      throw new Error(result.pesan || "Gagal menambahkan modul");
    }

    return result.data || result;
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(moduleData),
    });

    const result = await response.json();

    if (!response.ok || !result.sukses) {
      throw new Error(result.pesan || "Gagal memperbarui modul");
    }

    return result.data || result;
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
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok || !result.sukses) {
      throw new Error(result.pesan || "Gagal menghapus modul");
    }

    return result;
  } catch (error) {
    console.error("Error pada deleteModule:", error);
    throw error;
  }
}