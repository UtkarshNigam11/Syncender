import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            logout();
          } else {
            setUser(decoded);
            // Fetch user's subscription plan
            fetchUserPlan();
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

  const fetchUserPlan = async () => {
    try {
      const res = await axios.get('/api/subscription');
      if (res.data?.plan) {
        setUserPlan(res.data.plan);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const setAuthToken = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
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

  const register = async (nameOrData, email, password) => {
    try {
      const payload = typeof nameOrData === 'object'
        ? nameOrData
        : { name: nameOrData, email, password };

      await axios.post('/api/auth/register', payload);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const googleAuth = async () => {
    try {
      const res = await axios.get('/api/auth/google');
      return res.data.authUrl;
    } catch (error) {
      console.error('Google auth error:', error.response?.data || error.message);
      return null;
    }
  };

  const loginWithToken = async (jwt) => {
    try {
      if (!jwt) throw new Error('Missing token');
      setAuthToken(jwt);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUserPlan(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = async (payload) => {
    try {
      const res = await axios.put('/api/users/me', payload);
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Update failed' };
    }
  };

  const getSubscription = async () => {
    try {
      const res = await axios.get('/api/subscription', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.data;
    } catch (e) {
      return null;
    }
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
      updateUser,
      getSubscription,
      userPlan,
    }}>
      {children}
    </AuthContext.Provider>
  );
};