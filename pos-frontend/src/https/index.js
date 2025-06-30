import { axiosWrapper } from "./axiosWrapper";
import axios from 'axios'; // Add this import

export const API_URL = 'https://reasturant-pos-backend.onrender.com';
// API Endpoints
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Auth Endpoints
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => {
  localStorage.removeItem('token');
  return axiosWrapper.post("/api/user/logout");
};

// Table Endpoints
export const addTable = (data) => axiosWrapper.post("/api/table/", data);
export const getTables = () => axiosWrapper.get("/api/table");
export const updateTable = ({ tableId, ...tableData }) => 
  axiosWrapper.put(`/api/table/${tableId}`, tableData);
export const deleteTable = (tableId) => axiosWrapper.delete(`/api/table/${tableId}`);

// Payment Endpoints
export const createOrderRazorpay = (data) => 
  axiosWrapper.post("/api/payment/create-order", data);
export const verifyPaymentRazorpay = (data) => 
  axiosWrapper.post("/api/payment/verify-payment", data);
export const createAdditionalItemsOrderRazorpay = (reqData) => 
  axiosWrapper.post("/api/payment/createAdditionalOrder", reqData);
// Add missing payment endpoints
export const getDailyEarnings = (date) => axiosWrapper.get(`/api/payment/daily-earnings?date=${date}`);
export const getTotalEarnings = () => axiosWrapper.get('/api/payment/total-earnings');
export const getPayments = () => axiosWrapper.get('/api/payment');
export const getPaymentsByDate = (date) => axiosWrapper.get(`/api/payment?date=${date}`);
export const getPaymentsByDateRange = (startDate, endDate) => axiosWrapper.get(`/api/payment/range?startDate=${startDate}&endDate=${endDate}`);
export const getDailyEarningsRange = (range) => axiosWrapper.get(`/api/payment/daily-earnings-range?range=${range}`);
export const getEarningsComparison = () => axiosWrapper.get('/api/payment/earnings-comparison');
export const getRevenueChart = (period) => axiosWrapper.get(`/api/payment/revenue-chart?period=${period}`);
export const getPaymentStats = () => axiosWrapper.get('/api/payment/stats');
export const getPaymentSummary = (period) => axiosWrapper.get(`/api/payment/summary?period=${period}`);

// Order Endpoints
export const addOrder = (data) => axiosWrapper.post("/api/order/", data);
export const getOrders = () => axiosWrapper.get("/api/order");
export const updateOrderStatus = ({ orderId, orderStatus }) =>
  axiosWrapper.put(`/api/order/${orderId}`, { orderStatus });
// Additional Order Endpoints
export const getOrderById = (orderId) => axiosWrapper.get(`/api/order/${orderId}`);
export const deleteOrder = (orderId) => axiosWrapper.delete(`/api/order/${orderId}`);
export const updateOrder = async ({
  orderId,
  customerDetails,
  items,
  bills,
  paymentMethod,
  table,
  orderStatus
}) => {
  try {
    const response = await axiosWrapper.put(`/api/order/${orderId}`, {
      customerDetails,
      items,
      bills,
      paymentMethod,
      table,
      orderStatus
    });
    return response;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// Add these new functions for popular dishes and order comparison
export const getPopularDishes = () => axiosWrapper.get('/api/order/popular-dishes');
export const getOrderComparison = () => axiosWrapper.get('/api/order/comparison');

// Category Endpoints
export const getCategories = () => axiosWrapper.get("/api/category");
export const getCategoryById = (id) => axiosWrapper.get(`/api/category/${id}`);
export const addCategory = (data) => axiosWrapper.post("/api/category", data);
export const updateCategory = (id, data) => axiosWrapper.put(`/api/category/${id}`, data);
export const deleteCategory = (id) => axiosWrapper.delete(`/api/category/${id}`);
export const seedCategories = () => axiosWrapper.post('/api/category/seed');
export const generateConstants = () => axiosWrapper.get('/api/category/generate-constants');

// Menu-related endpoints
export const getMenus = () => axiosWrapper.get('/api/category');
export const getMenuItems = (categoryId) => axiosWrapper.get(`/api/category/${categoryId}/items`);

// Item Endpoints
export const getCategoryItems = (categoryId) => axiosWrapper.get(`/api/category/${categoryId}/items`);
export const addItemToCategory = (categoryId, itemData) => axiosWrapper.post(`/api/category/${categoryId}/items`, itemData);
export const updateItemInCategory = (categoryId, itemId, itemData) => axiosWrapper.put(`/api/category/${categoryId}/items/${itemId}`, itemData);
export const deleteItemFromCategory = (categoryId, itemId) => axiosWrapper.delete(`/api/category/${categoryId}/items/${itemId}`);

// Inventory endpoints
export const getInventoryItems = () => axiosWrapper.get('/api/inventory');
export const getInventoryStats = () => axiosWrapper.get('/api/inventory/stats');
export const getInventoryChartData = (period) => axiosWrapper.get(`/api/inventory/chart-data?period=${period}`);
export const getItemTransactions = (itemId) => axiosWrapper.get(`/api/inventory/${itemId}/transactions`);
export const addInventoryItem = (itemData) => axiosWrapper.post('/api/inventory', itemData);
export const updateInventoryItem = (itemId, itemData) => axiosWrapper.put(`/api/inventory/${itemId}`, itemData);
export const deleteInventoryItem = (itemId) => axiosWrapper.delete(`/api/inventory/${itemId}`);
export const restockItem = (itemId, data) => axiosWrapper.post(`/api/inventory/${itemId}/restock`, data);
export const useItem = (itemId, data) => axiosWrapper.post(`/api/inventory/${itemId}/use`, data);