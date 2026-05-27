import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://careerpilotai-uf87.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;
