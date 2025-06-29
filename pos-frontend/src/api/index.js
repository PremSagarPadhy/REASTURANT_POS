import axios from 'axios';

// Base URL for API
export const API_URL = 'https://reasturant-pos-backend.onrender.com/api';

// Configure axios defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Auth Endpoints
export const login = (data) => api.post("/user/login", data);
export const register = (data) => api.post("/user/register", data);
export const getUserData = () => api.get("/user");
export const logout = () => {
  localStorage.removeItem('token');
  return api.post("/user/logout");
};

// Category API endpoints
export const getCategories = () => api.get('/category');
export const getCategoryById = (id) => api.get(`/category/${id}`);
export const addCategory = (categoryData) => api.post('/category', categoryData);
export const updateCategory = (id, updatedData) => api.put(`/category/${id}`, updatedData);
export const deleteCategory = (id) => api.delete(`/category/${id}`);
export const seedCategories = () => api.post('/category/seed');
export const generateConstants = () => api.get('/category/generate-constants');

// Menu-related endpoints
export const getMenus = () => api.get('/category');
export const getMenuItems = (categoryId) => api.get(`/category/${categoryId}/items`);

// Order-related endpoints
export const getOrders = () => api.get('/order');
export const createOrder = (orderData) => api.post('/order', orderData);
export const addOrder = (data) => api.post('/order', data);
export const updateOrderStatus = ({ orderId, orderStatus }) =>
  api.put(`/order/${orderId}`, { orderStatus });
export const getOrderById = (orderId) => api.get(`/order/${orderId}`);
export const updateOrder = (id, orderData) => api.put(`/order/${id}`, orderData);
export const deleteOrder = (id) => api.delete(`/order/${id}`);

// Add these new functions for popular dishes and order comparison
export const getPopularDishes = () => api.get('/order/popular-dishes');
export const getOrderComparison = () => api.get('/order/comparison');

// Payment/Earnings endpoints - with error handling
export const getDailyEarnings = async (date) => {
  try {
    return await api.get(`/payment/daily-earnings?date=${date}`);
  } catch (error) {
    console.error('Error in getDailyEarnings:', error.response?.data || error.message);
    throw error;
  }
};

export const getTotalEarnings = async () => {
  try {
    return await api.get('/payment/total-earnings');
  } catch (error) {
    console.error('Error in getTotalEarnings:', error.response?.data || error.message);
    throw error;
  }
};

export const getDailyEarningsRange = async (range) => {
  try {
    return await api.get(`/payment/daily-earnings-range?range=${range}`);
  } catch (error) {
    console.error('Error in getDailyEarningsRange:', error.response?.data || error.message);
    throw error;
  }
};

export const getPayments = (date) => {
  if (date === 'all') {
    return api.get('/payment/all');
  }
  return api.get(`/payment?date=${date}`);
};

export const getPaymentsByDateRange = (startDate, endDate) => api.get(`/payment/range?startDate=${startDate}&endDate=${endDate}`);
export const createOrderRazorpay = (data) => api.post("/payment/create-order", data);
export const verifyPaymentRazorpay = (data) => api.post("/payment/verify-payment", data);
export const createAdditionalItemsOrderRazorpay = (reqData) => api.post("/payment/createAdditionalOrder", reqData);

// Table-related endpoints
export const getTables = () => api.get('/table');
export const addTable = (data) => api.post('/table', data);
export const updateTable = (id, tableData) => api.put(`/table/${id}`, tableData);
export const deleteTable = (tableId) => api.delete(`/table/${tableId}`);

// Item Endpoints
export const getCategoryItems = (categoryId) => api.get(`/category/${categoryId}/items`);
export const addItemToCategory = (categoryId, itemData) => api.post(`/category/${categoryId}/items`, itemData);
export const updateItemInCategory = (categoryId, itemId, itemData) => api.put(`/category/${categoryId}/items/${itemId}`, itemData);
export const deleteItemFromCategory = (categoryId, itemId) => api.delete(`/category/${categoryId}/items/${itemId}`);

// Inventory endpoints
export const getInventoryItems = () => api.get('/inventory');
export const getInventoryStats = () => api.get('/inventory/stats');
export const getInventoryChartData = (period) => api.get(`/inventory/chart-data?period=${period}`);
export const getItemTransactions = (itemId) => api.get(`/inventory/${itemId}/transactions`);
export const addInventoryItem = (itemData) => api.post('/inventory', itemData);
export const updateInventoryItem = (itemId, itemData) => api.put(`/inventory/${itemId}`, itemData);
export const deleteInventoryItem = (itemId) => api.delete(`/inventory/${itemId}`);
export const restockItem = (itemId, data) => api.post(`/inventory/${itemId}/restock`, data);
export const useItem = (itemId, data) => api.post(`/inventory/${itemId}/use`, data);

// Employee endpoints
export const getEmployees = () => {
  return api.get('/employees')
    .then(res => {
      console.log('Employee API Response:', res.data);
      return res.data.data || res.data;
    })
    .catch(err => {
      console.error('Error fetching employees:', err);
      throw err;
    });
};
export const getEmployeeById = (id) => api.get(`/employees/${id}`).then(res => res.data.data);
export const addEmployee = (employeeData) => api.post('/employees', employeeData).then(res => res.data.data);
export const updateEmployee = ({ id, data }) => api.put(`/employees/${id}`, data).then(res => res.data.data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`).then(res => res.data);

// Set up request interceptor for handling tokens if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token being used:', token ? 'Token present' : 'No token');
    console.log('Request to:', config.url);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Set up response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors like authentication issues
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access - perhaps redirect to login
      console.error('Authentication failed. Redirecting to login...');
      console.error('Failed endpoint:', error.config?.url);
      console.error('Token present:', !!localStorage.getItem('token'));
      
      // Clear invalid token and redirect to login
      handleAuthError();
    }
    return Promise.reject(error);
  }
);

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Helper function to handle authentication errors
export const handleAuthError = () => {
  localStorage.removeItem('token');
  // You can add navigation to login page here
  window.location.href = '/auth';
};

export default api;