import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import * as jwt_decode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and is valid
    const checkAuth = async () => {
      if (token) {
        try {
          // Set default headers for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Decode token to get user info
          const decoded = jwt_decode.default(token);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            // Token expired, logout user
            logout();
          } else {
            setUser(decoded);
          }
        } catch (error) {
          console.error('Auth error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Helper to persist token
  const setAuthToken = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
  };

  // Login user with email/password
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token: jwt } = res.data;
      setAuthToken(jwt);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Register user (accepts either (name,email,password) or an object)
  const register = async (nameOrData, email, password) => {
    try {
      const payload = typeof nameOrData === 'object'
        ? nameOrData
        : { name: nameOrData, email, password };

      await axios.post('http://localhost:5000/api/auth/register', payload);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Start Google OAuth: returns authUrl
  const googleAuth = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/google');
      return res.data.authUrl;
    } catch (error) {
      console.error('Google auth error:', error.response?.data || error.message);
      return null;
    }
  };

  // Complete OAuth by storing token from callback
  const loginWithToken = async (jwt) => {
    try {
      if (!jwt) throw new Error('Missing token');
      setAuthToken(jwt);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout,
      googleAuth,
      loginWithToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};