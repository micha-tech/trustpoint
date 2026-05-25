"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const storeToken = async (u: User | null) => {
    if (u) {
      const token = await u.getIdToken();
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await storeToken(u);
      setLoading(false);
    });

    return () => {
      unsub();
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, []);

  // Refresh token every 50 minutes (Firebase tokens expire after 1 hour)
  useEffect(() => {
    if (!user) {
      if (refreshRef.current) clearInterval(refreshRef.current);
      return;
    }
    refreshRef.current = setInterval(() => storeToken(user), 50 * 60 * 1000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
