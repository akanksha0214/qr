import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Restaurant API calls
export const restaurantAPI = {
  getByQRCode: (qrCodeId) => api.get(`/restaurants/qr/${qrCodeId}`),
  getById: (id) => api.get(`/restaurants/${id}`),
  getAll: () => api.get('/restaurants'),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
};

// Menu API calls
export const menuAPI = {
  getByRestaurant: (restaurantId) => api.get(`/menu/restaurant/${restaurantId}`),
  getByCategory: (restaurantId, category) => api.get(`/menu/restaurant/${restaurantId}/category/${category}`),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => {
    // If data is FormData, don't set Content-Type header
    if (data instanceof FormData) {
      return axios.post(`${API_BASE_URL}/menu`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/menu', data);
  },
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
};

// Order API calls
export const orderAPI = {
  getByRestaurant: (restaurantId, status) => api.get(`/orders/restaurant/${restaurantId}`, { params: { status } }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  updatePayment: (id, paymentStatus) => api.patch(`/orders/${id}/payment`, { paymentStatus }),
};

// QR Code API calls
export const qrAPI = {
  validate: (qrCodeId) => api.get(`/qr/${qrCodeId}/validate`),
  getUrl: (qrCodeId) => api.get(`/qr/${qrCodeId}/url`),
};

// User API calls
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
