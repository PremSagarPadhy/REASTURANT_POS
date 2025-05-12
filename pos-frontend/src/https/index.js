import { axiosWrapper } from "./axiosWrapper";
import axios from 'axios'; // Add this import

// API Endpoints
const API = axios.create({ 
  baseURL: 'http://localhost:8000/api' 
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
  axiosWrapper.post("/api/payment//verify-payment", data);

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
export const createAdditionalItemsOrderRazorpay = async (reqData) => {
  try {
    const response = await axiosWrapper.post("/api/payment/createAdditionalOrder", reqData);
    return response;
  } catch (error) {
    console.error("Error creating additional items order:", error);
    throw error;
  }
};

// Category Endpoints
export const getCategories = () => axiosWrapper.get("/api/category");
export const getCategoryById = (id) => axiosWrapper.get(`/api/category/${id}`);
export const addCategory = (data) => axiosWrapper.post("/api/category", data);
export const updateCategory = (id, data) => axiosWrapper.put(`/api/category/${id}`, data);
export const deleteCategory = (id) => axiosWrapper.delete(`/api/category/${id}`);
export const seedCategories = () => API.post('/category/seed');
export const generateConstants = () => API.get('/category/generate-constants');

// Item Endpoints
export const getCategoryItems = (categoryId) => axiosWrapper.get(`/api/category/${categoryId}/items`);
export const addItemToCategory = (categoryId, itemData) => axiosWrapper.post(`/api/category/${categoryId}/items`, itemData);
export const updateItemInCategory = (categoryId, itemId, itemData) => axiosWrapper.put(`/api/category/${categoryId}/items/${itemId}`, itemData);
export const deleteItemFromCategory = (categoryId, itemId) => axiosWrapper.delete(`/api/category/${categoryId}/items/${itemId}`);

//Inventory Endpoints
export const getInventoryItems = () => api.get('/inventory');
export const getInventoryStats = () => api.get('/inventory/stats');
export const getInventoryChartData = (period) => api.get(`/inventory/chart-data?period=${period}`);
export const getItemTransactions = (itemId) => api.get(`/inventory/${itemId}/transactions`);
export const addInventoryItem = (itemData) => api.post('/inventory', itemData);
export const updateInventoryItem = (itemId, itemData) => api.put(`/inventory/${itemId}`, itemData);
export const deleteInventoryItem = (itemId) => api.delete(`/inventory/${itemId}`);
export const restockItem = (itemId, data) => api.post(`/inventory/${itemId}/restock`, data);
export const useItem = (itemId, data) => api.post(`/inventory/${itemId}/use`, data);