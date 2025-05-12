import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";
import { formatDateAndTime } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaPrint } from "react-icons/fa"; // Import print icon
import Invoice from "../invoice/Invoice"; // Import Invoice component

// Filter popover component for table headers
const TableColumnFilter = ({ column, onFilterChange, isOpen, setIsOpen }) => {
  const [filterValue, setFilterValue] = useState("");
  
  // Handle closing the filter dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && !e.target.closest(`.filter-${column}`)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, column, setIsOpen]);
  
  const handleApplyFilter = () => {
    onFilterChange(column, filterValue);
    setIsOpen(false);
  };
  
  const handleClearFilter = () => {
    setFilterValue("");
    onFilterChange(column, "");
    setIsOpen(false);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={`absolute z-10 mt-1 bg-[#333] shadow-lg rounded-lg p-3 w-64 filter-${column}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-3">
            <input 
              type="text" 
              placeholder={`Filter by ${column}...`}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
            />
          </div>
          <div className="flex justify-between gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearFilter}
              className="px-3 py-1 bg-[#4a4a4a] text-[#f5f5f5] rounded-md flex-1 hover:bg-[#5a5a5a]"
            >
              Clear
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyFilter}
              className="px-3 py-1 bg-[#025cca] text-[#f5f5f5] rounded-md flex-1 hover:bg-[#0273fa]"
            >
              Apply
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Invoices Component
const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timePeriod, setTimePeriod] = useState("month");
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders data
  const { data: resData, isError, isLoading, refetch } = useQuery({
    queryKey: ["orders", timePeriod],
    queryFn: () => getOrders(timePeriod),
  });

  // Fixed handlePeriodChange function
  const handlePeriodChange = (period) => {
    setTimePeriod(period);
    // Refetch data when period changes
    setTimeout(() => refetch(), 100);
  };

  // Handle column filtering
  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Toggle filter dropdown for a column
  const toggleFilterDropdown = (column) => {
    setActiveFilter(activeFilter === column ? null : column);
  };

  // Handle print button click
  const handlePrintClick = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  // Apply all filters to orders
  const filteredOrders = resData?.data?.data 
    ? resData.data.data.filter(order => {
        // Apply search filter
        const matchesSearch = 
          order.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order._id.toString().includes(searchTerm);
        
        // Apply status filter
        const matchesStatus = 
          statusFilter === "All" || 
          order.orderStatus === statusFilter;
        
        // Apply column filters
        let matchesColumnFilters = true;
        
        // Filter by OrderID
        if (columnFilters.OrderID && !Math.floor(new Date(order.orderDate).getTime() % 10000).toString().includes(columnFilters.OrderID)) {
          matchesColumnFilters = false;
        }
        
        // Filter by Customer
        if (columnFilters.Customer && !order.customerDetails.name.toLowerCase().includes(columnFilters.Customer.toLowerCase())) {
          matchesColumnFilters = false;
        }
        
        // Filter by Status
        if (columnFilters.Status && !order.orderStatus.toLowerCase().includes(columnFilters.Status.toLowerCase())) {
          matchesColumnFilters = false;
        }
        
        // Filter by Table
        if (columnFilters.Table && !order.table.tableNo.toString().includes(columnFilters.Table)) {
          matchesColumnFilters = false;
        }
        
        // Filter by Items
        if (columnFilters.Items && !order.items.length.toString().includes(columnFilters.Items)) {
          matchesColumnFilters = false;
        }
        
        // Filter by Total
        if (columnFilters.Total && !order.bills.totalWithTax.toString().includes(columnFilters.Total)) {
          matchesColumnFilters = false;
        }
        
        // Filter by Payments
        if (columnFilters.Payments && !order.paymentMethod.toLowerCase().includes(columnFilters.Payments.toLowerCase())) {
          matchesColumnFilters = false;
        }
        
        return matchesSearch && matchesStatus && matchesColumnFilters;
      })
    : [];

  // Define table headers with filter functionality
  const tableHeaders = [
    { id: "OrderID", label: "Order ID" },
    { id: "Customer", label: "Customer" },
    { id: "Status", label: "Status" },
    { id: "Date", label: "Date & Time" },
    { id: "Items", label: "Items" },
    { id: "Table", label: "Table No" },
    { id: "Total", label: "Total" },
    { id: "Payments", label: "Payments" },
    { id: "Action", label: "Action" }, // Added Action column for print button
  ];

  return (
    <div className="bg-[#1a1a1a] p-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-2 px-6 md:px-4"
      >
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="font-semibold text-[#f5f5f5] text-xl">
              Invoice Management
            </h2>
            <p className="text-sm text-[#ababab]">
              View and print invoices for all orders
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.select 
              className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-[#333] cursor-pointer border border-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
              onChange={(e) => handlePeriodChange(e.target.value)}
              value={timePeriod}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <option value="day" className="bg-[#333] text-[#f5f5f5]">Last 24 Hours</option>
              <option value="week" className="bg-[#333] text-[#f5f5f5]">Last 7 Days</option>
              <option value="month" className="bg-[#333] text-[#f5f5f5]">Last 1 Month</option>
              <option value="year" className="bg-[#333] text-[#f5f5f5]">Last 1 Year</option>
            </motion.select>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#262626] p-4 rounded-lg shadow-lg mt-6"
          whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <motion.h2 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-[#f5f5f5] text-xl font-semibold"
            >
              All Invoices
            </motion.h2>
            
            <div className="flex flex-col md:flex-row gap-3 mt-3 md:mt-0 w-full md:w-auto">
              {/* Search Bar */}
              <motion.div 
                initial={{ opacity: 0, width: "80%" }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ duration: 0.5 }}
                className="relative"
                whileHover={{ scale: 1.02 }}
              >
                <input
                  type="text"
                  placeholder="Search by customer or order ID..."
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
            <div className="overflow-auto custom-scrollbar-hidden max-h-[70vh]">
              <table className="w-full text-left text-[#f5f5f5]">
                <thead className="bg-[#333] text-[#ababab] sticky top-0">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th key={header.id} className="p-3 relative">
                        <div className="flex items-center gap-1">
                          {header.label}
                          {header.id !== "Action" && (
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleFilterDropdown(header.id)}
                              className="cursor-pointer"
                            >
                              <svg className="w-3 h-3 text-[#ababab] hover:text-[#f5f5f5]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
                              </svg>
                            </motion.div>
                          )}
                          {columnFilters[header.id] && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-[#025cca]"
                            ></motion.div>
                          )}
                        </div>
                        {header.id !== "Action" && (
                          <TableColumnFilter 
                            column={header.id}
                            onFilterChange={handleColumnFilterChange}
                            isOpen={activeFilter === header.id}
                            setIsOpen={(isOpen) => setActiveFilter(isOpen ? header.id : null)}
                          />
                        )}
                      </th>
                    ))}
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
                        <td className="p-1">{order.customerDetails.name}</td>
                        <td className="p-4">
                          <motion.span
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-2 py-1 rounded-full text-xs ${
                              order.orderStatus === "Ready"
                                ? "bg-green-900 text-green-400"
                                : order.orderStatus === "Completed"
                                ? "bg-blue-900 text-blue-400"
                                : "bg-yellow-900 text-yellow-400"
                            }`}
                          >
                            {order.orderStatus}
                          </motion.span>
                        </td>
                        <td className="p-2">{formatDateAndTime(order.orderDate)}</td>
                        <td className="p-2">{order.items.length} Items</td>
                        <td className="p-2">Table - {order.table.tableNo}</td>
                        <td className="p-2">₹{order.bills.totalWithTax}</td>
                        <td className="p-2">
                          <motion.span 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-2 py-1 rounded-full text-xs ${
                              order.paymentMethod === "Cash" 
                                ? "bg-purple-900 text-purple-400"
                                : "bg-teal-900 text-teal-400"
                            }`}
                          >
                            {order.paymentMethod}
                          </motion.span>
                        </td>
                        <td className="p-2">
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: "#025cca" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePrintClick(order)}
                            className="flex items-center justify-center bg-[#333] hover:bg-[#444] text-[#f5f5f5] rounded-full p-2 transition-all duration-200"
                            title="Print Invoice"
                          >
                            <FaPrint className="text-lg" />
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
                      <td colSpan="9" className="p-4 text-center text-[#ababab]">
                        <motion.div
                          initial={{ y: -10 }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          No invoices found matching your criteria
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
                Showing {filteredOrders.length} of {resData?.data?.data?.length || 0} invoices
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
                  2
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
        </motion.div>
      </motion.div>
      
      {/* Footer with animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8 text-center text-[#ababab] text-sm py-4"
      >
        <motion.p
          whileHover={{ color: "#f5f5f5" }}
        >
          Updated {new Date().toLocaleTimeString()}
        </motion.p>
      </motion.div>

      {/* Render Invoice modal when showInvoice is true */}
      {showInvoice && selectedOrder && (
        <Invoice orderInfo={selectedOrder} setShowInvoice={setShowInvoice} />
      )}
    </div>
  );
};

export default Invoices;