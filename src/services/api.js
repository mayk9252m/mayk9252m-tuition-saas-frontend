import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle auth errors
api.interceptors.response.use(
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

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Students APIs
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getOne: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`)
};

// Attendance APIs
export const attendanceAPI = {
  getToday: () => api.get('/attendance/today'),
  getForStudent: (studentId, month) => api.get(`/attendance/${studentId}`, { params: { month } }),
  mark: (studentId, data) => api.post(`/attendance/${studentId}`, data),
  markBulk: (data) => api.post('/attendance/bulk', data)
};

// Fees APIs
export const feesAPI = {
  getSummary: (month) => api.get('/fees/summary', { params: { month } }),
  updateStatus: (studentId, month, data) => api.put(`/fees/${studentId}/${month}`, data),
  sendReminder: (studentId) => api.post(`/fees/remind/${studentId}`)
};

// Analytics APIs
export const analyticsAPI = {
  get: () => api.get('/analytics')
};

export default api;
