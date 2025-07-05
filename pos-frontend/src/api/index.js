import axios from 'axios';

// Base URL for API
export const API_URL = 'https://reasturant-pos-backend.onrender.com/api';

// Configure axios defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies to be sent with requests
});

// Auth Endpoints
export const login = (data) => api.post("/user/login", data);
export const register = (data) => api.post("/user/register", data);
export const getUserData = () => api.get("/user");
export const logout = () => {
  localStorage.removeItem('token');
  return Promise.resolve(); // Return a resolved promise since we're just clearing local storage
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

// Employee working order endpoints
export const getWorkingOrders = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/order/working${queryString ? '?' + queryString : ''}`);
};
export const getEmployeeWorkload = () => api.get('/order/workload');
export const assignWaiterToOrder = (data) => api.post('/order/assign-waiter', data);
export const assignCookToOrder = (data) => api.post('/order/assign-cook', data);

// Payment/Earnings endpoints
export const getDailyEarnings = (date) => api.get(`/payment/daily-earnings?date=${date}`);
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

// Attendance endpoints
export const getAllAttendance = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/attendance?${queryString}`).then(res => res.data);
};
export const getTodayAttendance = () => api.get('/attendance/today').then(res => res.data);
export const getAttendanceSummary = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/attendance/summary?${queryString}`).then(res => res.data);
};
export const getAttendanceByEmployee = (employeeId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/attendance/employee/${employeeId}?${queryString}`).then(res => res.data);
};
export const markAttendance = (attendanceData) => api.post('/attendance', attendanceData).then(res => res.data);
export const updateAttendance = ({ id, data }) => api.put(`/attendance/${id}`, data).then(res => res.data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`).then(res => res.data);

// Support endpoints
export const registerSupportCustomer = (customerData) => api.post('/support/register', customerData);
export const sendSupportMessage = (messageData) => api.post('/support/customer-message', messageData);
export const lookupCustomerByPhone = (phone) => api.get(`/support/lookup/${phone}`);
export const getCustomerChats = (customerId) => api.get(`/support/chats/${customerId}`);
export const getSupportCustomers = () => api.get('/support/customers');
export const sendAdminMessage = (messageData) => api.post('/support/messages', messageData);
export const markSupportMessagesAsRead = (customerId) => api.put(`/support/customers/${customerId}/read`);
export const updateSupportStatus = (customerId, status) => api.put(`/support/customers/${customerId}/status`, { status });

// Customer endpoints
export const getCustomers = (timePeriod) => axiosWrapper.get(`/api/customers?timePeriod=${timePeriod}`);
export const getCustomerByPhone = (phone) => axiosWrapper.get(`/api/customers/${phone}`);
export const getCustomerStats = (timePeriod) => axiosWrapper.get(`/api/customers/stats?timePeriod=${timePeriod}`);
export const getTopCustomers = (limit = 10, timePeriod) => axiosWrapper.get(`/api/customers/top?limit=${limit}&timePeriod=${timePeriod}`);
export const updateCustomerInfo = (phone, customerData) => axiosWrapper.put(`/api/customers/${phone}`, customerData);

// Set up request interceptor - no need to add Authorization headers since backend uses cookies
api.interceptors.request.use(
  (config) => {
    // Cookies are sent automatically with withCredentials: true
    console.log('Making request to:', config.url);
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
      // Handle unauthorized access - backend manages cookies automatically
      console.error('401 Authentication failed. Error details:', error.response);
      console.error('Request URL:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;