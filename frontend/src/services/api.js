import axios from 'axios';

const BASE_URL = 'https://safeguard-women-safety.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const sosAPI = {
  trigger: (data) => api.post('/sos/trigger', data),
  resolve: (alertId) => api.put(`/sos/resolve/${alertId}`),
};

export const incidentsAPI = {
  report: (data) => api.post('/incidents/report', data),
  getNearby: (lat, lng, radius = 5) =>
    api.get(`/incidents/nearby?lat=${lat}&lng=${lng}&radius_km=${radius}`),
  getLocationHistory: (lat, lng) =>
    api.get(`/incidents/location-history?lat=${lat}&lng=${lng}`),
};

export const heatmapAPI = {
  getGrid: (lat, lng, radius = 5) =>
    api.get(`/heatmap/grid?lat=${lat}&lng=${lng}&radius_km=${radius}`),
  getRiskScore: (lat, lng, hour) =>
    api.get(`/heatmap/risk-score?lat=${lat}&lng=${lng}${hour !== undefined ? `&hour=${hour}` : ''}`),
};

export const contactsAPI = {
  add: (data) => api.post('/contacts/add', data),
  getAll: (userId) => api.get(`/contacts/${userId}`),
  delete: (contactId) => api.delete(`/contacts/${contactId}`),
};

export default api;