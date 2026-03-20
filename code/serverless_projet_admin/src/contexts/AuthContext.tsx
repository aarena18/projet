import { createContext, useContext, useEffect, useState } from "react";
import api, { authService } from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      // Met le token dans les headers avant d'appeler getMe
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      authService
        .getMe()
        .then((res) => {
          if (res.data.role !== "admin") {
            localStorage.removeItem("admin_token");
            delete api.defaults.headers.common["Authorization"];
            setUser(null);
          } else {
            setUser(res.data);
          }
        })
        .catch(() => {
          localStorage.removeItem("admin_token");
          delete api.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const { token } = res.data;

    // Stocke le token ET met à jour les headers AVANT d'appeler getMe
    localStorage.setItem("admin_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const meRes = await authService.getMe();
    if (meRes.data.role !== "admin") {
      localStorage.removeItem("admin_token");
      delete api.defaults.headers.common["Authorization"];
      throw new Error("Accès réservé aux administrateurs");
    }
    setUser(meRes.data);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
};
