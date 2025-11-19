import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

// Configure axios defaults
// In production (Vercel), use relative URLs (vercel.json handles routing)
// In development, use localhost:5000
if (import.meta.env.PROD) {
  axios.defaults.baseURL = '';
} else {
  axios.defaults.baseURL = 'http://localhost:5000';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);