import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8051/api/v1', // Adjust port if needed, backend on 8051
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
