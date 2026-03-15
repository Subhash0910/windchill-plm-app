import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import { getToken, setToken, getUser, setUser, clearAuth, isTokenExpired } from '../utils/localStorage';
import api from '../utils/api';
import { API_ENDPOINTS } from '../config/api.config';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from sessionStorage — clear if token is expired
  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();
    if (token && storedUser) {
      if (isTokenExpired(token)) {
        // Token is expired — wipe it and force login
        clearAuth();
      } else {
        setUserState(storedUser);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      setError(null);
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });

      const { data, success } = response.data;
      if (success) {
        setToken(data.token);
        setUser(data);
        setUserState(data);
        return true;
      }
      return false;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
    setError(null);
  }, []);

  const isAuthenticated = useMemo(() => {
    if (!user) return false;
    const token = getToken();
    return !!(token && !isTokenExpired(token));
  }, [user]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
