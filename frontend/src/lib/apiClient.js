import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("kti_token", access);
  if (refresh) localStorage.setItem("kti_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("kti_token");
  localStorage.removeItem("kti_refresh");
}

export function apiError(err, fallback = "Terjadi kesalahan") {
  return err?.response?.data?.error?.message || err?.message || fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kti_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;
    const code = error?.response?.data?.error?.code;
    const url = original.url || "";
    if (status === 401 && code === "AUTH_TOKEN_EXPIRED" && !original._retry && !url.includes("/auth/")) {
      original._retry = true;
      const rt = localStorage.getItem("kti_refresh");
      if (!rt) {
        clearTokens();
        window.dispatchEvent(new Event("kti-auth-expired"));
        return Promise.reject(error);
      }
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API}/auth/refresh`, { refresh_token: rt })
            .finally(() => { refreshPromise = null; });
        }
        const r = await refreshPromise;
        const newAccess = r.data?.data?.access_token;
        if (newAccess) {
          localStorage.setItem("kti_token", newAccess);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        }
      } catch (e) {
        clearTokens();
        window.dispatchEvent(new Event("kti-auth-expired"));
      }
    }
    return Promise.reject(error);
  }
);

// Simple fetch hook for GET endpoints returning {success, data} (+ optional meta).
// Phase 18B: Added timeout protection (10s default)
export function useFetch(path, deps = [], options = {}) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const timeoutRef = useRef(null);

  const { timeout = 10000 } = options; // 10 second default timeout

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      timeoutRef.current = setTimeout(() => {
        reject(new Error('Request timeout - silakan refresh halaman atau coba lagi'));
      }, timeout);
    });
    
    try {
      const apiPromise = api.get(path);
      const res = await Promise.race([apiPromise, timeoutPromise]);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (mounted.current) {
        setData(res.data?.data ?? null);
        setMeta(res.data?.meta ?? null);
      }
    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (mounted.current) setError(apiError(err, "Gagal memuat data"));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [path, timeout]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { 
      mounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, meta, loading, error, reload: load };
}
