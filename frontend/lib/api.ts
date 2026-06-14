import axios, { type InternalAxiosRequestConfig } from "axios";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Token refresh state
let isRefreshing = false;
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryableConfig | undefined;

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the refresh call itself failed
    if (original.url?.includes("/auth/refresh")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (original.headers) original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;

    if (!refreshToken) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    try {
      const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
      const { access_token } = res.data as { access_token: string };
      localStorage.setItem("access_token", access_token);
      // Sync to Zustand store without importing directly (avoids circular dep)
      const event = new CustomEvent("token-refreshed", { detail: access_token });
      window.dispatchEvent(event);
      processQueue(null, access_token);
      original.headers.Authorization = `Bearer ${access_token}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: {
    email: string;
    password: string;
    device_fingerprint: string;
    device_name?: string;
    device_type?: string;
    browser_name?: string;
    os_name?: string;
  }) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: (refreshToken: string) => api.post("/auth/refresh", { refresh_token: refreshToken }),
};

// Devices
export const deviceApi = {
  list: () => api.get("/devices"),
  approve: (id: string) => api.post(`/devices/${id}/approve`),
  update: (id: string, data: { device_name?: string }) =>
    api.patch(`/devices/${id}`, data),
  remove: (id: string) => api.delete(`/devices/${id}`),
};

// Voice / Conversations
export const voiceApi = {
  transcribe: (formData: FormData) =>
    api.post("/voice/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  generateFeedback: (formData: FormData) =>
    api.post("/voice/generate-feedback", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  speak: (formData: FormData) =>
    api.post("/voice/speak", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "arraybuffer",
    }),
  createConversation: (data: { session_id: string; topic?: string; skill_tags?: string[] }) =>
    api.post("/voice/conversations", data),
  listConversations: (limit = 20, offset = 0) =>
    api.get(`/voice/conversations?limit=${limit}&offset=${offset}`),
};

// Admin
export const adminApi = {
  users: {
    list: () => api.get("/admin/users"),
    toggleAdmin: (id: string) => api.patch(`/admin/users/${id}/toggle-admin`),
  },
  devices: {
    list: (approvedOnly?: boolean) =>
      api.get(`/admin/devices${approvedOnly !== undefined ? `?approved_only=${approvedOnly}` : ""}`),
    approve: (id: string) => api.post(`/admin/devices/${id}/approve`),
    revoke: (id: string) => api.delete(`/admin/devices/${id}`),
  },
  pricing: {
    list: () => api.get("/admin/api-pricing"),
    create: (data: object) => api.post("/admin/api-pricing", data),
    update: (id: string, data: object) => api.patch(`/admin/api-pricing/${id}`, data),
  },
  models: {
    list: () => api.get("/admin/api-models"),
    create: (data: object) => api.post("/admin/api-models", data),
    update: (id: string, data: object) => api.patch(`/admin/api-models/${id}`, data),
  },
  costReport: (days = 30) => api.get(`/admin/cost-report?days=${days}`),
};
