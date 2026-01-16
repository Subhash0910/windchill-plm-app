import React, { createContext, useState, useCallback, useEffect } from 'react';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/localStorage';
import api from '../utils/api';
import { API_ENDPOINTS } from '../config/api.config';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage
  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();
    if (token && storedUser) {
      setUserState(storedUser);
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
    removeToken();
    removeUser();
    setUserState(null);
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!getToken(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
