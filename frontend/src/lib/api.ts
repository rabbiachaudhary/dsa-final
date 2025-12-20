// src/lib/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Add auth token to all requests (except auth routes)
api.interceptors.request.use(
  (config) => {
    // Don't add token for login/signup routes
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/signup')) {
      return config;
    }
    const token = localStorage.getItem('auth');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
      localStorage.removeItem('auth');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data: { email: string; password: string }) => api.post('/auth/login', data);
export const signup = (data: { name: string; email: string; password: string }) => api.post('/auth/signup', data);
// Get current user (profile)
export const getCurrentUser = () => {
  const token = localStorage.getItem('auth');
  return api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Sessions
export const getSessions = () => api.get('/sessions');
export const createSession = (data: any) => api.post('/sessions', data);
export const updateSession = (id: string, data: any) => api.put(`/sessions/${id}`, data);
export const deleteSession = (id: string) => api.delete(`/sessions/${id}`);

// Sections
export const addSection = (sessionId: string, data: any) => api.post(`/sections/${sessionId}/sections`, data);
export const updateSection = (sessionId: string, sectionId: string, data: any) => api.put(`/sections/${sessionId}/sections/${sectionId}`, data);
export const deleteSection = (sessionId: string, sectionId: string) => api.delete(`/sections/${sessionId}/sections/${sectionId}`);

// Students (manual roll numbers)
export const addRollNumbers = (sessionId: string, sectionId: string, rollNumbers: string[]) => api.post(`/students/${sessionId}/sections/${sectionId}/rollnos`, { rollNumbers });

// Students (PDF upload)
export const uploadPDF = (sessionId: string, sectionId: string, file: File) => {
  const formData = new FormData();
  formData.append('pdf', file);
  return api.post(`/pdf/${sessionId}/sections/${sectionId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Rooms
export const getRooms = () => api.get('/rooms');
export const createRoom = (data: any) => api.post('/rooms', data);
export const updateRoom = (id: string, data: any) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id: string) => api.delete(`/rooms/${id}`);

// TimeSlots
export const getTimeSlots = () => api.get('/timeslots');
export const createTimeSlot = (data: any) => api.post('/timeslots', data);
export const updateTimeSlot = (id: string, data: any) => api.put(`/timeslots/${id}`, data);
export const deleteTimeSlot = (id: string) => api.delete(`/timeslots/${id}`);

// Constraints
export const getConstraints = () => api.get('/constraints');
export const createConstraint = (data: any) => api.post('/constraints', data);
export const updateConstraint = (id: string, data: any) => api.put(`/constraints/${id}`, data);
export const deleteConstraint = (id: string) => api.delete(`/constraints/${id}`);

// Plans
export const getPlans = () => api.get('/plans');
export const createPlan = (data: any) => api.post('/plans', data);
export const updatePlan = (id: string, data: any) => api.put(`/plans/${id}`, data);
export const deletePlan = (id: string) => api.delete(`/plans/${id}`);
export const generatePlans = (data: { timeSlotId: string; roomIds: string[] }) =>
  api.post('/plans/generate', data);

// Capacity check
export const checkCapacity = (sessionIds: string[]) => api.post('/capacity/check', { sessionIds });
