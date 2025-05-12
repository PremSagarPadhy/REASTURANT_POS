import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders, updateOrderStatus, deleteOrder, getOrderById } from "../../https/index";
import { formatDateAndTime } from "../../utils";
import { GrFormView } from "react-icons/gr";
import { FaRegEdit } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import OrderDetailsModal from "./OrderDetailsModal";
import { motion, AnimatePresence } from "framer-motion";

const RecentOrders = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const orderStatusUpdateMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) => updateOrderStatus({ orderId, orderStatus }),
    onSuccess: () => {
      enqueueSnackbar("Order status updated successfully!", { variant: "success" });
      queryClient.invalidateQueries(["orders"]);
    },
    onError: () => {
      enqueueSnackbar("Failed to update order status!", { variant: "error" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId) => deleteOrder(orderId),
    onSuccess: () => {
      enqueueSnackbar("Order deleted successfully!", { variant: "success" });
      queryClient.invalidateQueries(["orders"]);
    },
    onError: () => {
      enqueueSnackbar("Failed to delete order!", { variant: "error" });
    },
  });

  const { data: orderDetails, isLoading: isOrderDetailsLoading } = useQuery({
    queryKey: ["orderDetails", selectedOrder],
    queryFn: () => getOrderById(selectedOrder),
    enabled: !!selectedOrder,
  });

  const handleStatusChange = ({ orderId, orderStatus }) => {
    orderStatusUpdateMutation.mutate({ orderId, orderStatus });
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrder(orderId);
    setShowOrderDetails(true);
  };

  const handleEditOrder = (order) => {
    // Navigate to menu page with order data
    navigate("/menu", { 
      state: { 
        editMode: true, 
        orderData: order 
      } 
    });
  };

  const handleDeleteOrder = (orderId) => {
    console.log("Deleting order with ID:", orderId);
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const { data: resData, isError, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  // Apply filters to orders
  const filteredOrders = resData?.data?.data 
    ? resData.data.data.filter(order => {
        // Apply search filter
        const matchesSearch = 
          order.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          Math.floor(new Date(order.orderDate).getTime()).toString().includes(searchTerm);
        
        // Apply status filter
        const matchesStatus = 
          statusFilter === "All" || 
          order.orderStatus === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];
    
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#262626] p-4 rounded-lg ml-[30px] mr-[30px] shadow-lg"
      whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <motion.h2 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[#f5f5f5] text-lg font-semibold"
        >
          Recent Orders
        </motion.h2>
        
        <div className="flex flex-col md:flex-row gap-3 mt-3 md:mt-0 w-full md:w-auto">
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, width: "80%" }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
            whileHover={{ scale: 1.02 }}
          >
            <input
              type="text"
              placeholder="Search orders or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#333] text-[#f5f5f5] rounded-md px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#025cca] border border-[#4a4a4a]"
            />
            <motion.svg 
              whileHover={{ scale: 1.2, rotate: 15 }}
              className="w-4 h-4 text-[#ababab] absolute right-3 top-2.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </motion.svg>
          </motion.div>
          
          {/* Status Filter */}
          <motion.select
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#333] text-[#f5f5f5] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#025cca] border border-[#4a4a4a]"
            whileHover={{ scale: 1.02 }}
          >
            <option value="All" className="bg-[#333] text-[#f5f5f5]">All Statuses</option>
            <option value="In Progress" className="bg-[#333] text-[#f5f5f5]">In Progress</option>
            <option value="Ready" className="bg-[#333] text-[#f5f5f5]">Ready</option>
            <option value="Completed" className="bg-[#333] text-[#f5f5f5]">Completed</option>
          </motion.select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div 
            animate={{ 
              rotate: 360,
              transition: { 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              } 
            }}
            className="rounded-full h-12 w-12 border-t-2 border-b-2 border-[#025cca]"
          ></motion.div>
        </div>
      ) : (
        <div className="h-96 overflow-auto custom-scrollbar-hidden">
          <table className="w-full text-left text-[#f5f5f5]">
            <thead className="bg-[#333] text-[#ababab] sticky top-0">
              <tr>
                <motion.th 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="p-3"
                >
                  Order ID
                </motion.th>
                <motion.th 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="p-3"
                >
                  Customer
                </motion.th>
                <motion.th 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="p-3"
                >
                  Status
                </motion.th>
                <motion.th 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="p-3"
                >
                  Date & Time
                </motion.th>
                <motion.th 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="p-3"
                >
                  Actions
                </motion.th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredOrders.map((order, index) => (
                  <motion.tr 
                    key={order._id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-gray-600 hover:bg-[#333]"
                    whileHover={{ 
                      backgroundColor: "#3d3d3d",
                      transition: { duration: 0.1 }
                    }}
                  >
                    <td className="p-2">#{Math.floor(new Date(order.orderDate).getTime() % 10000)}</td>
                    <td className="p-2">{order.customerDetails.name}</td>
                    <td className="p-3">
                      <motion.select
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`bg-[#1a1a1a] text-[#f5f5f5] border border-gray-500 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#025cca] ${
                          order.orderStatus === "Ready"
                            ? "text-green-500"
                            : order.orderStatus === "Completed"
                            ? "text-blue-500"
                            : "text-yellow-500"
                        }`}
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange({ orderId: order._id, orderStatus: e.target.value })}
                      >
                        <option className="text-yellow-500" value="In Progress">In Progress</option>
                        <option className="text-green-500" value="Ready">Ready</option>
                        <option className="text-blue-500" value="Completed">Completed</option>
                      </motion.select>
                    </td>
                    <td className="p-2">{formatDateAndTime(order.orderDate)}</td>
                    <td className="p-2 flex items-center space-x-4">
                      <motion.button 
                        whileHover={{ scale: 1.2, color: "#3b82f6" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleViewOrder(order._id)}
                        className="text-blue-500"
                      >
                        <GrFormView size={24} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.2, color: "#eab308" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditOrder(order)}
                        className="text-yellow-500"
                      >
                        <FaRegEdit size={20} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.2, color: "#ef4444" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteOrder(order._id)}
                        className="text-red-500"
                      >
                        <MdDeleteOutline size={22} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredOrders.length === 0 && (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <td colSpan="5" className="p-4 text-center text-[#ababab]">
                    <motion.div
                      initial={{ y: -10 }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      No orders found matching your criteria
                    </motion.div>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls - Animated */}
      {filteredOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex justify-between items-center mt-4"
        >
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="text-[#ababab] text-sm"
          >
            Showing {filteredOrders.length} of {resData?.data?.data?.length || 0} orders
          </motion.span>
          
          <div className="flex gap-1">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "#3d3d3d" }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 rounded-md bg-[#333] text-[#ababab] border border-[#4a4a4a]"
            >
              Previous
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "#025cca" }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 rounded-md bg-[#333] text-[#f5f5f5] border border-[#4a4a4a]"
            >
              1
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "#3d3d3d" }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 rounded-md bg-[#333] text-[#ababab] border border-[#4a4a4a]"
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Order Details Modal with animation */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OrderDetailsModal
              isOpen={showOrderDetails}
              onClose={() => setShowOrderDetails(false)}
              orderData={orderDetails?.data?.data}
              isLoading={isOrderDetailsLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecentOrders;