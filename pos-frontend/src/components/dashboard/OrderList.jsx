import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";
import { formatDateAndTime } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import RadialChart from "./RadialChart";

// Advanced Order Stats Card Component
const OrderStatsCard = ({ orderStats }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Color scheme that matches your dark theme
  const colors = {
    inProgress: "#f6b100", // yellow
    ready: "#02ca3a",      // green
    completed: "#025cca",   // blue
    background: "#262626",
    cardBg: "#333333",
    text: "#f5f5f5",
    subtext: "#ababab",
    border: "#4a4a4a"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-[#262626] rounded-lg shadow-lg p-4 md:p-6"
      whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}
    >
      <motion.div 
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between mb-3"
      >
        <div className="flex items-center">
          <div className="flex justify-center items-center">
            <h5 className="text-xl font-bold leading-none text-[#f5f5f5] pe-1">Order Progress</h5>
            <motion.svg 
              whileHover={{ scale: 1.2, rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-3.5 h-3.5 text-[#ababab] hover:text-[#f5f5f5] cursor-pointer ms-1" 
              aria-hidden="true" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm0 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1-5.034V12a1 1 0 0 1-2 0v-1.418a1 1 0 0 1 1.038-.999 1.436 1.436 0 0 0 1.488-1.441 1.501 1.501 0 1 0-3-.116.986.986 0 0 1-1.037.961 1 1 0 0 1-.96-1.037A3.5 3.5 0 1 1 11 11.466Z"/>
            </motion.svg>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#1f1f1f] p-3 rounded-lg"
        whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }}
      >
        <div className="grid grid-cols-3 gap-3 mb-2">
          <motion.dl 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#333] rounded-lg flex flex-col items-center justify-center h-[78px]"
            whileHover={{ scale: 1.05, backgroundColor: "#3d3d3d" }}
          >
            <dt className="w-8 h-8 rounded-full bg-[#f6b100] bg-opacity-20 text-[#f6b100] text-sm font-medium flex items-center justify-center mb-1">
              {orderStats.inProgress}
            </dt>
            <dd className="text-[#f6b100] text-sm font-medium">In Progress</dd>
          </motion.dl>
          
          <motion.dl 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#333] rounded-lg flex flex-col items-center justify-center h-[78px]"
            whileHover={{ scale: 1.05, backgroundColor: "#3d3d3d" }}
          >
            <dt className="w-8 h-8 rounded-full bg-[#02ca3a] bg-opacity-20 text-[#02ca3a] text-sm font-medium flex items-center justify-center mb-1">
              {orderStats.ready}
            </dt>
            <dd className="text-[#02ca3a] text-sm font-medium">Ready</dd>
          </motion.dl>
          
          <motion.dl 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-[#333] rounded-lg flex flex-col items-center justify-center h-[78px]"
            whileHover={{ scale: 1.05, backgroundColor: "#3d3d3d" }}
          >
            <dt className="w-8 h-8 rounded-full bg-[#025cca] bg-opacity-20 text-[#025cca] text-sm font-medium flex items-center justify-center mb-1">
              {orderStats.completed}
            </dt>
            <dd className="text-[#025cca] text-sm font-medium">Completed</dd>
          </motion.dl>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDetails(!showDetails)}
          type="button" 
          className="hover:underline text-xs text-[#ababab] font-medium inline-flex items-center"
        >
          {showDetails ? "Hide details" : "Show more details"}
          <svg className={`w-2 h-2 ms-1 transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
          </svg>
        </motion.button>
        
        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-[#4a4a4a] border-t pt-3 mt-3 space-y-2 overflow-hidden"
            >
              <motion.dl 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center justify-between"
              >
                <dt className="text-[#ababab] text-sm font-normal">Order completion rate:</dt>
                <dd className="bg-[#02ca3a] bg-opacity-20 text-[#02ca3a] text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-md">
                  <svg className="w-2.5 h-2.5 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13V1m0 0L1 5m4-4 4 4"/>
                  </svg> 
                  {Math.round((orderStats.completed / (orderStats.total || 1)) * 100)}%
                </dd>
              </motion.dl>
              <motion.dl 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center justify-between"
              >
                <dt className="text-[#ababab] text-sm font-normal">Average processing time:</dt>
                <dd className="bg-[#333] text-[#f5f5f5] text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-md">
                  24 minutes
                </dd>
              </motion.dl>
              <motion.dl 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex items-center justify-between"
              >
                <dt className="text-[#ababab] text-sm font-normal">Busiest time:</dt>
                <dd className="bg-[#333] text-[#f5f5f5] text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-md">
                  12:00 - 14:00
                </dd>
              </motion.dl>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Replace the Pie Chart with the RadialChart component */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="py-6 h-64" 
      >
        <RadialChart orderStats={orderStats} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="grid grid-cols-1 items-center border-t border-[#4a4a4a] justify-between"
      >
        <div className="flex justify-between items-center pt-5">
          <motion.select 
            className="text-sm font-medium text-[#f5f5f5] bg-[#333] hover:bg-[#3d3d3d] rounded-md px-3 py-1 border border-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#025cca] cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <option value="7" className="bg-[#333] text-[#f5f5f5]">Last 7 days</option>
            <option value="1" className="bg-[#333] text-[#f5f5f5]">Yesterday</option>
            <option value="0" className="bg-[#333] text-[#f5f5f5]">Today</option>
            <option value="30" className="bg-[#333] text-[#f5f5f5]">Last 30 days</option>
            <option value="90" className="bg-[#333] text-[#f5f5f5]">Last 90 days</option>
          </motion.select>
          
          <motion.a
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            href="#"
            className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-[#025cca] hover:text-[#0273fa] px-3 py-2"
          >
            Detailed report
            <svg className="w-2.5 h-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
};

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

// Main OrderList Component
const OrderList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timePeriod, setTimePeriod] = useState("month");
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    inProgress: 0,
    ready: 0,
    completed: 0,
    totalPercentage: 0,
    inProgressPercentage: 0,
    readyPercentage: 0,
    completedPercentage: 0
  });

  // Fetch orders data
  const { data: resData, isError, isLoading, refetch } = useQuery({
    queryKey: ["orders", timePeriod],
    queryFn: () => getOrders(timePeriod),
  });

  // Update the order stats when data changes
  useEffect(() => {
    if (resData?.data?.data) {
      const orders = resData.data.data;
      const total = orders.length;
      const inProgress = orders.filter(order => order.orderStatus === "In Progress").length;
      const ready = orders.filter(order => order.orderStatus === "Ready").length;
      const completed = orders.filter(order => order.orderStatus === "Completed").length;
      
      // Calculate percentage changes (this would typically compare to previous period)
      // For demo purposes, showing random changes
      const calculatePercentageChange = () => {
        return Math.floor(Math.random() * 20) - 10; // Random value between -10 and +10
      };
      
      setOrderStats({
        total,
        inProgress,
        ready,
        completed,
        totalPercentage: calculatePercentageChange(),
        inProgressPercentage: calculatePercentageChange(),
        readyPercentage: calculatePercentageChange(),
        completedPercentage: calculatePercentageChange()
      });
    }
  }, [resData]);

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

  // Metrics data for the top cards
  const metricsData = [
    { 
      title: "Total Orders", 
      value: orderStats.total, 
      percentage: `${orderStats.totalPercentage}%`, 
      color: "#025cca", 
      isIncrease: orderStats.totalPercentage > 0 
    },
    { 
      title: "In Progress", 
      value: orderStats.inProgress, 
      percentage: `${orderStats.inProgressPercentage}%`, 
      color: "#f6b100", 
      isIncrease: orderStats.inProgressPercentage > 0 
    },
    { 
      title: "Ready", 
      value: orderStats.ready, 
      percentage: `${orderStats.readyPercentage}%`, 
      color: "#02ca3a", 
      isIncrease: orderStats.readyPercentage > 0 
    },
    { 
      title: "Completed", 
      value: orderStats.completed, 
      percentage: `${orderStats.completedPercentage}%`, 
      color: "#be3e3f", 
      isIncrease: orderStats.completedPercentage > 0 
    },
  ];

  // Define table headers with filter functionality
  const tableHeaders = [
    { id: "OrderID", label: "Order ID" },
    { id: "Customer", label: "Customer" },
    { id: "Status", label: "Status" },
    { id: "Date", label: "Date & Time" },
    { id: "Items", label: "Items" },
    { id: "Table", label: "Table No" },
    { id: "Total", label: "Total" },
    { id: "Payments", label: "Payments" }
  ];

  return (
    <div className="bg-[#1a1a1a] p-6 min-h-screen">
      {/* Top Metrics Cards */}
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
              Order Performance
            </h2>
            <p className="text-sm text-[#ababab]">
              Overview of order status and performance metrics
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

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData.map((metric, index) => {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="shadow-lg rounded-lg p-4"
                style={{ backgroundColor: metric.color }}
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  transition: { duration: 0.2 }
                }}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-xs text-[#f5f5f5]">
                    {metric.title}
                  </p>
                  <div className="flex items-center gap-1">
                    <motion.svg
                      animate={{ 
                        y: [0, -3, 0], 
                        transition: { 
                          duration: 1,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut",
                          repeatDelay: 1
                        }
                      }}
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                    >
                      <path
                        d={metric.isIncrease ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                      />
                    </motion.svg>
                    <p
                      className="font-medium text-xs"
                      style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                    >
                      {metric.percentage}
                    </p>
                  </div>
                </div>
                <motion.p 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  className="mt-1 font-semibold text-2xl text-[#f5f5f5]"
                >
                  {metric.value}
                </motion.p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Advanced Order Stats Card with Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mx-[30px]">
        <div className="md:col-span-1">
          <OrderStatsCard orderStats={orderStats} />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#262626] p-4 rounded-lg shadow-lg md:col-span-2"
          whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <motion.h2 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-[#f5f5f5] text-xl font-semibold"
            >
              Recent Orders
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
                    {tableHeaders.map((header) => (
                      <th key={header.id} className="p-3 relative">
                        <div className="flex items-center gap-1">
                          {header.label}
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleFilterDropdown(header.id)}
                            className="cursor-pointer"
                          >
                            <svg className="w-3 h-3 text-[#ababab] hover:text-[#f5f5f5]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-2 0v-1.418a1 1 0 01.293-.707L17.707 5.5A1 1 0 0118 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v2a1 1 0 01.293.707L8 10.586V15a1 1 0 01-2 0v-4.586L2.293 6.707A1 1 0 012 6V3z" clipRule="evenodd"></path>
                            </svg>
                          </motion.div>
                          {columnFilters[header.id] && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-[#025cca]"
                            ></motion.div>
                          )}
                        </div>
                        <TableColumnFilter 
                          column={header.id}
                          onFilterChange={handleColumnFilterChange}
                          isOpen={activeFilter === header.id}
                          setIsOpen={(isOpen) => setActiveFilter(isOpen ? header.id : null)}
                        />
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
                        <td className="p-3">
                          <motion.span
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap inline-block min-w-[90px] text-center ${
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
                        <td className="p-2">{order.items.length} </td>
                        <td className="p-2">{order.table.tableNo}</td>
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
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  
                  {filteredOrders.length === 0 && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <td colSpan="8" className="p-4 text-center text-[#ababab]">
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
      </div>
      
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
    </div>
  );
};

export default OrderList;