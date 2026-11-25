import axios from 'axios';

// Defaults to '/api' which Vite proxies to http://127.0.0.1:8000/api, eliminating CORS & port issues
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('muletrace_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('muletrace_token');
      localStorage.removeItem('muletrace_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
