import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearTokens, setTokens } from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async () => {
    const token = localStorage.getItem("kti_token");
    if (!token) { setReady(true); return; }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data?.data ?? null);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    hydrate();
    const onExpired = () => { clearTokens(); setUser(null); };
    window.addEventListener("kti-auth-expired", onExpired);
    return () => window.removeEventListener("kti-auth-expired", onExpired);
  }, [hydrate]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data?.data;
    setTokens({ access: data.access_token, refresh: data.refresh_token });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }, []);

  const value = {
    user,
    ready,
    login,
    logout,
    isAuthed: !!user,
    hasRole: (...roles) => !!user && roles.includes(user.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
