import React, { createContext, useContext, useState, useEffect } from "react";
import { apiCall } from "../utils/api";

export interface User {
  id?: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Загружаем token и user при инициализации
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");
    
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiCall("/auth/login", "POST", { email, password });
    setToken(response.token);
    setUser(response.user);
    
    localStorage.setItem("authToken", response.token);
    localStorage.setItem("authUser", JSON.stringify(response.user));
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await apiCall("/auth/register", "POST", { email, password, name });
    setToken(response.token);
    setUser(response.user);
    
    localStorage.setItem("authToken", response.token);
    localStorage.setItem("authUser", JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
