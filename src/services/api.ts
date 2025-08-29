import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoAPI } from './demoAPI';

// Pick an API host suitable for the running platform:
// - Android emulator should use 10.0.2.2 to reach the host machine's localhost
// - iOS simulator and device can use localhost or the machine IP
// const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
// const API_BASE_URL = `http://${HOST}:5001/api`;
// Alternative static hosts you might want to try:
// const API_BASE_URL = 'http://192.168.1.14:5001/api';
const API_BASE_URL = 'https://inventory-management-backend-ghgqe3ddavdqd0f8.centralindia-01.azurewebsites.net/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  async (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`Error from ${error.config?.url}:`, error.response?.status || error.message);
    return Promise.reject(error);
  }
);

// Auth API - trying different possible endpoint paths
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    // Check if we're in demo mode
    const isDemoMode = await AsyncStorage.getItem('isDemoMode');
    if (isDemoMode === 'true') {
      console.log('Using demo API for login');
      return await demoAPI.login(credentials);
    }

    // Try different possible login endpoints - start with the specified one
    const endpoints = ['/users/login'];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying login endpoint: ${endpoint}, ${credentials.email} , ${credentials.password}`);
        const response = await api.post(endpoint, credentials);
        console.log(`Success with endpoint: ${endpoint}`);
        return response;
      } catch (error: any) {
        console.log(`Failed with endpoint ${endpoint}:`, error.response?.status || error.message);
        if (endpoints.indexOf(endpoint) === endpoints.length - 1) {
          // This was the last endpoint, throw the error
          throw error;
        }
        // Continue to next endpoint
      }
    }
    // This should never happen, but TypeScript needs it
    throw new Error('All endpoints failed');
  },
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),
};

// Products API with demo mode support
export const productsAPI = {
  getAll: async (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const isDemoMode = await AsyncStorage.getItem('isDemoMode');
    if (isDemoMode === 'true') {
      return await demoAPI.getProducts();
    }
    return api.get('/products', { params });
  },
  
  getById: async (id: string) => {
    const isDemoMode = await AsyncStorage.getItem('isDemoMode');
    if (isDemoMode === 'true') {
      const products = await demoAPI.getProducts();
      const product = products.data.products.find((p: any) => p._id === id);
      if (product) {
        return { data: product };
      }
      throw new Error('Product not found');
    }
    return api.get(`/products/${id}`);
  },
  
  getByQRCode: async (qrCode: string) => {
    const isDemoMode = await AsyncStorage.getItem('isDemoMode');
    if (isDemoMode === 'true') {
      return await demoAPI.getProductByQR(qrCode);
    }
  // API documentation specifies GET /products/barcode/{barcode}
  return api.get(`/products/barcode/${encodeURIComponent(qrCode)}`);
  },
  
  updateQuantity: async (id: string, data: { quantityChange: number }) => {
    const isDemoMode = await AsyncStorage.getItem('isDemoMode');
    if (isDemoMode === 'true') {
      return await demoAPI.updateQuantity(id, data);
    }
    return api.patch(`/products/${id}/quantity`, data);
  },
  
  reduceStock: async (data: { productId: string; quantity: number; reason?: string }) => {
    const isDemoMode = await AsyncStorage.getItem('isDemoMode');
    if (isDemoMode === 'true') {
      return await demoAPI.reduceStock(data);
    }
  // API documentation specifies POST /stock/reduce
  return api.post('/stock/reduce', data);
  },
  
  // Other methods that fallback to API in non-demo mode
  create: (productData: FormData) => api.post('/products', productData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, productData: FormData) => api.put(`/products/${id}`, productData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getExpired: () => api.get('/products/expired'),
  getExpiringSoon: () => api.get('/products/expiring-soon'),
};

// Analytics API with demo mode support
export const analyticsAPI = {
  getDashboard: async () => {
    const isDemoMode = await AsyncStorage.getItem('isDemoMode');
    if (isDemoMode === 'true') {
      return await demoAPI.getDashboard();
    }
    return api.get('/analytics/dashboard');
  },
  
  getSalesData: (params?: { startDate?: string; endDate?: string; groupBy?: string }) =>
    api.get('/analytics/sales', { params }),
  getTopProducts: (params?: { limit?: number; period?: string }) =>
    api.get('/analytics/top-products', { params }),
  getInventoryValue: () => api.get('/analytics/inventory-value'),
  getStockMovement: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/stock-movement', { params }),
};

// Activity Logs API
export const activityAPI = {
  getLogs: (params?: { page?: number; limit?: number; action?: string; startDate?: string; endDate?: string }) =>
    api.get('/activity-logs', { params }),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (userData: any) => api.post('/users', userData),
  update: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export default api;
