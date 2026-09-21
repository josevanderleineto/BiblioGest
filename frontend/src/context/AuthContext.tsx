import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (token: string, user: User, mustChange: boolean) => void;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bibliogest_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bibliogest_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => {
    return localStorage.getItem('bibliogest_must_change_pass') === 'true';
  });

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          setMustChangePassword(res.data.mustChangePassword);
          localStorage.setItem('bibliogest_user', JSON.stringify(res.data));
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = (newToken: string, newUser: User, mustChange: boolean) => {
    setToken(newToken);
    setUser(newUser);
    setMustChangePassword(mustChange);
    localStorage.setItem('bibliogest_token', newToken);
    localStorage.setItem('bibliogest_user', JSON.stringify(newUser));
    localStorage.setItem('bibliogest_must_change_pass', mustChange ? 'true' : 'false');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
    localStorage.removeItem('bibliogest_token');
    localStorage.removeItem('bibliogest_user');
    localStorage.removeItem('bibliogest_must_change_pass');
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const newU = { ...user, ...updated };
      setUser(newU);
      localStorage.setItem('bibliogest_user', JSON.stringify(newU));
    }

    if (typeof updated.mustChangePassword === 'boolean') {
      setMustChangePassword(updated.mustChangePassword);
      localStorage.setItem('bibliogest_must_change_pass', updated.mustChangePassword ? 'true' : 'false');
    }
  };

  const hasPermission = (code: string) => {
    if (!user) return false;
    if (user.role === 'Administrador') return true;
    return user.permissions ? user.permissions.includes(code) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        mustChangePassword,
        login,
        logout,
        updateUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
