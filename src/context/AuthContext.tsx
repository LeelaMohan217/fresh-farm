"use client";

import { createContext, useContext, useState, useEffect } from "react";

type AuthUser = { id: string; name: string; email: string };

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  logout: async () => {}, refresh: async () => {},
});

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: AuthUser | null }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) setUser(await res.json());
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch on mount if no server-side initial user was provided
  useEffect(() => { if (initialUser === undefined) refresh(); }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
