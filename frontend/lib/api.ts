import { useAuthStore } from "./authStore";
import { getCookie } from "./cookieHelper";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getCookie("auth-token");
  
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Global logout on unauthorized
    if (typeof window !== "undefined") {
      useAuthStore.getState().logout();
      window.location.href = "/auth/login";
    }
  }

  return response;
}
