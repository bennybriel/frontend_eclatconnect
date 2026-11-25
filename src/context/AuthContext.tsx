import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { request } from '../api/client';

interface RegisterResult {
  user: User;
  activation_required?: boolean;
  activation_token?: string;
  activation_link?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  isArtisan: boolean;
  isCustomer: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (payload: any) => Promise<RegisterResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const refreshUser = async () => {
    if (!localStorage.getItem('token')) {
      setUser(null);
      return;
    }
    try {
      const u = await request<User>('/me');
      setUser(u);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await request<{ token: string; user: User }>('/auth/login', 'POST', {
      email,
      password: pass,
    });
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: any): Promise<RegisterResult> => {
    const res = await request<RegisterResult & { token?: string }>('/auth/register', 'POST', payload);
    if (res.token) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user ? ['ADMIN', 'ADMINISTRATOR'].includes(user.role) : false;
  const isVendor = user ? ['VENDOR', 'ARTISAN'].includes(user.role) : false;
  const isArtisan = user ? user.role === 'ARTISAN' : false;
  const isCustomer = user ? user.role === 'CUSTOMER' : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isVendor,
        isArtisan,
        isCustomer,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
