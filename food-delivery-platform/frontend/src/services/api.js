import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

export const restaurantAPI = {
  getAll: (params) => apiClient.get('/restaurants', { params }),
  getById: (id) => apiClient.get(`/restaurants/${id}`),
  getMenu: (id) => apiClient.get(`/restaurants/${id}/menu`),
  search: (query) => apiClient.get('/restaurants/search', { params: { q: query } }),
  create: (data) => apiClient.post('/restaurants', data),
  update: (id, data) => apiClient.put(`/restaurants/${id}`, data),
  delete: (id) => apiClient.delete(`/restaurants/${id}`),
};

export const menuAPI = {
  create: (restaurantId, data) => apiClient.post(`/restaurants/${restaurantId}/menu`, data),
  update: (id, data) => apiClient.put(`/menu/${id}`, data),
  delete: (id) => apiClient.delete(`/menu/${id}`),
};

export const orderAPI = {
  create: (data) => apiClient.post('/orders', data),
  getAll: () => apiClient.get('/orders'),
  getById: (id) => apiClient.get(`/orders/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
  track: (id) => apiClient.get(`/orders/${id}/track`),
};

export const reviewAPI = {
  create: (data) => apiClient.post('/reviews', data),
  getByRestaurant: (restaurantId) => apiClient.get(`/reviews/restaurant/${restaurantId}`),
};

export const paymentAPI = {
  createIntent: (data) => apiClient.post('/payments/intent', data),
  confirm: (data) => apiClient.post('/payments/confirm', data),
};

export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: () => apiClient.get('/admin/users'),
  getOrders: () => apiClient.get('/admin/orders'),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),
};

export const chatbotAPI: {
  sendMessage: (message: string) => Promise<AxiosResponse<any>>;
} = {
  sendMessage: (message: string) => apiClient.post('/chatbot/message', { message }),
};

export default apiClient;
