'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import API, { setAccessToken, setOnRefreshSuccess, setOnRefreshFailed } from './api';

const AuthContext = createContext(null);

// Extract user profile data from API response
const extractUser = (data) => ({
  _id: data._id,
  name: data.name,
  email: data.email,
  role: data.role,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Callback: Axios interceptor successfully refreshed the token
  const handleRefreshSuccess = useCallback((data) => {
    setUser(extractUser(data));
    setAccessToken(data.accessToken);
  }, []);

  // Callback: Axios interceptor failed to refresh — force logout
  const handleRefreshFailed = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    router.push('/login');
  }, [router]);

  // Bootstrap: restore session on mount via refresh token cookie
  useEffect(() => {
    setOnRefreshSuccess(handleRefreshSuccess);
    setOnRefreshFailed(handleRefreshFailed);

    const initAuth = async () => {
      try {
        // The HttpOnly cookie (if present) is sent automatically
        const { data } = await API.post('/auth/refresh');
        setUser(extractUser(data));
        setAccessToken(data.accessToken);
      } catch {
        // No valid session — user stays null
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      setOnRefreshSuccess(null);
      setOnRefreshFailed(null);
    };
  }, [handleRefreshSuccess, handleRefreshFailed]);

  // Login: call backend, store access token in memory, user in state
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    setUser(extractUser(data));
    setAccessToken(data.accessToken);
    return data;
  };

  // Register: call backend, store access token in memory, user in state
  const register = async (form) => {
    const { data } = await API.post('/auth/register', form);
    setUser(extractUser(data));
    setAccessToken(data.accessToken);
    return data;
  };

  // Logout: call backend (clears cookie + DB row), clear local state
  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch {
      // Ignore errors — clear local state regardless
    }
    setUser(null);
    setAccessToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
