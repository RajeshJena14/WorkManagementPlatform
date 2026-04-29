import axios from 'axios';

// Create a configured Axios instance
const api = axios.create({
    baseURL: 'https://workmanagementplatform-production.up.railway.app/api', // Pointing to our Express backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach the JWT token to every outgoing request
api.interceptors.request.use(
    (config) => {
        // We will store the token in localStorage for persistence across refreshes
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;