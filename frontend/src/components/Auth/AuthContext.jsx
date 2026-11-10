import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      }

      // Se não autenticado (401), tenta renovar o token silenciosamente via refresh token
      if (res.status === 401) {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST'
        });
        if (refreshRes.ok) {
          const retryRes = await fetch('/api/auth/me');
          if (retryRes.ok) {
            const data = await retryRes.json();
            setUser(data);
            return data;
          }
        }
      }

      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (usernameOrEmail, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: usernameOrEmail, password })
    });

    if (res.ok) {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        return true;
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const updatePixKey = (newPixKey) => {
    setUser(prev => prev ? { ...prev, pixKey: newPixKey } : prev);
  };

  const updateUserData = (updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePixKey, updateUserData, refetchUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
