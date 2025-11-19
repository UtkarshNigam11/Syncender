import axios from 'axios';

// Get API base URL from environment variable or use relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to handle relative URLs in production
axiosInstance.interceptors.request.use(
  (config) => {
    // If URL starts with /api and we have a VITE_API_URL, use absolute URL
    if (config.url?.startsWith('/api') && import.meta.env.VITE_API_URL) {
      config.url = `${import.meta.env.VITE_API_URL}${config.url}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
