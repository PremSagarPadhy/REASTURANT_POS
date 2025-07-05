import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import { getCustomers, getCustomerStats, updateCustomerInfo } from "../../https/index";
import { formatDateAndTime } from "../../utils";

// Edit Customer Modal Component
const EditCustomerModal = ({ customer, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    totalOrders: 0,
    totalSpent: 0,
    lastVisit: "",
    notes: ""
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        lastVisit: customer.lastVisit ? new Date(customer.lastVisit).toISOString().split('T')[0] : "",
        notes: customer.notes || ""
      });
    }
  }, [customer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...customer, ...formData });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#262626] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#f5f5f5]">Edit Customer Details</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                />
              </div>

              {/* Last Visit */}
              <div>
                <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                  Last Visit
                </label>
                <input
                  type="date"
                  value={formData.lastVisit}
                  onChange={(e) => setFormData({...formData, lastVisit: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows="3"
                className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                placeholder="Additional notes about the customer..."
              />
            </div>

            {/* Statistics (Read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                  Total Orders
                </label>
                <input
                  type="number"
                  value={formData.totalOrders}
                  readOnly
                  className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#ababab] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                  Total Spent (₹)
                </label>
                <input
                  type="number"
                  value={formData.totalSpent}
                  readOnly
                  className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#ababab] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-[#4a4a4a]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#4a4a4a] text-[#f5f5f5] rounded-md hover:bg-[#5a5a5a] transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-2 bg-[#025cca] text-[#f5f5f5] rounded-md hover:bg-[#0273fa] transition-colors"
              >
                Save Changes
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Filter component for table headers
const TableColumnFilter = ({ column, onFilterChange, isOpen, setIsOpen }) => {
  const [filterValue, setFilterValue] = useState("");
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.filter-${column}`)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

// Main CustomerDetails Component
const CustomerDetails = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All");
  const [timePeriod, setTimePeriod] = useState("month");
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(5);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    recurring: 0,
    avgOrders: 0,
    avgSpend: 0
  });

  const queryClient = useQueryClient();

  // Fetch customers data
  const { data: customersData, isError, isLoading, refetch } = useQuery({
    queryKey: ["customers", timePeriod],
    queryFn: () => getCustomers(timePeriod),
  });

  // Fetch customer statistics
  const { data: statsData } = useQuery({
    queryKey: ["customerStats", timePeriod],
    queryFn: () => getCustomerStats(timePeriod),
  });

  // Mutation for updating customer info
  const updateCustomerMutation = useMutation({
    mutationFn: ({ phone, customerData }) => updateCustomerInfo(phone, customerData),
    onSuccess: () => {
      enqueueSnackbar("Customer details updated successfully!", { variant: "success" });
      queryClient.invalidateQueries(["customers"]);
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      enqueueSnackbar("Failed to update customer details", { variant: "error" });
    }
  });

  // Get processed customer data
  const customerData = customersData?.data?.data || [];

  // Update customer stats when data changes
  useEffect(() => {
    if (statsData?.data?.data) {
      const stats = statsData.data.data;
      setCustomerStats({
        total: stats.totalCustomers || 0,
        active: customerData.filter(c => {
          const lastVisit = new Date(c.lastVisit);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastVisit > thirtyDaysAgo;
        }).length,
        recurring: stats.recurringCustomers || 0,
        avgOrders: Math.round(stats.avgOrdersPerCustomer || 0),
        avgSpend: Math.round(stats.avgSpendPerCustomer || 0)
      });
    }
  }, [statsData, customerData]);

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

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  // Handle save customer
  const handleSaveCustomer = (updatedCustomer) => {
    updateCustomerMutation.mutate({
      phone: selectedCustomer.phone,
      customerData: {
        name: updatedCustomer.name,
        newPhone: updatedCustomer.phone !== selectedCustomer.phone ? updatedCustomer.phone : undefined,
        email: updatedCustomer.email,
        notes: updatedCustomer.notes
      }
    });
  };

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  // Apply all filters to customers
  const filteredCustomers = customerData.filter(customer => {
    // Apply search filter
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply customer type filter
    const matchesType = 
      customerTypeFilter === "All" || 
      customer.customerType === customerTypeFilter;
    
    // Apply column filters
    let matchesColumnFilters = true;
    
    if (columnFilters.Name && !customer.name.toLowerCase().includes(columnFilters.Name.toLowerCase())) {
      matchesColumnFilters = false;
    }
    
    if (columnFilters.Phone && !customer.phone.includes(columnFilters.Phone)) {
      matchesColumnFilters = false;
    }
    
    if (columnFilters.Email && !customer.email.toLowerCase().includes(columnFilters.Email.toLowerCase())) {
      matchesColumnFilters = false;
    }
    
    if (columnFilters.Type && !customer.customerType.toLowerCase().includes(columnFilters.Type.toLowerCase())) {
      matchesColumnFilters = false;
    }
    
    return matchesSearch && matchesType && matchesColumnFilters;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, customerTypeFilter, columnFilters]);

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Metrics data for the top cards
  const metricsData = [
    { 
      title: "Total Customers", 
      value: customerStats.total, 
      percentage: "+12%", 
      color: "#025cca", 
      isIncrease: true 
    },
    { 
      title: "Active Customers", 
      value: customerStats.active, 
      percentage: "+8%", 
      color: "#02ca3a", 
      isIncrease: true 
    },
    { 
      title: "Recurring Customers", 
      value: customerStats.recurring, 
      percentage: "+15%", 
      color: "#f6b100", 
      isIncrease: true 
    },
    { 
      title: "Avg Orders/Customer", 
      value: customerStats.avgOrders, 
      percentage: "+3%", 
      color: "#be3e3f", 
      isIncrease: true 
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#1a1a1a] min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Customer Management
          </h2>
          <p className="text-sm text-[#ababab]">
            Overview of customer information and relationship management
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.select 
            className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-[#333] cursor-pointer border border-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
            onChange={(e) => setTimePeriod(e.target.value)}
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
      </motion.div>

      {/* Metrics Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => (
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
        ))}
      </div>

      {/* Customer Table */}
      <div className="mt-6 md:mt-8 px-2 md:px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#262626] rounded-lg shadow-lg p-4 md:p-6"
        >
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                placeholder="Search customers by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1f1f1f] border border-[#4a4a4a] rounded-md px-4 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
              />
            </div>
            <motion.select
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value)}
              className="bg-[#333] border border-[#4a4a4a] rounded-md px-4 py-2 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
            >
              <option value="All">All Types</option>
              <option value="VIP">VIP</option>
              <option value="Regular">Regular</option>
              <option value="New">New</option>
            </motion.select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-[#025cca] border-t-transparent rounded-full"
              />
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-[#f5f5f5]">
                <thead className="text-xs text-[#ababab] uppercase bg-[#1f1f1f]">
                  <tr>
                    {[
                      { key: "Name", label: "Customer Name" },
                      { key: "Phone", label: "Phone" },
                      { key: "Email", label: "Email" },
                      { key: "Type", label: "Type" },
                      { key: "Orders", label: "Total Orders" },
                      { key: "Spent", label: "Total Spent" },
                      { key: "LastVisit", label: "Last Visit" },
                      { key: "Actions", label: "Actions" }
                    ].map((header) => (
                      <th key={header.key} className="px-6 py-3 relative">
                        <div className="flex items-center gap-2">
                          <span>{header.label}</span>
                          {header.key !== "Actions" && (
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={() => toggleFilterDropdown(header.key)}
                              className="text-[#4a4a4a] hover:text-[#ababab] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"/>
                              </svg>
                            </motion.button>
                          )}
                        </div>
                        <TableColumnFilter
                          column={header.key}
                          onFilterChange={handleColumnFilterChange}
                          isOpen={activeFilter === header.key}
                          setIsOpen={() => setActiveFilter(null)}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-[#333] border-b border-[#4a4a4a] hover:bg-[#3d3d3d] transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[#f5f5f5]">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.customerType === "VIP" 
                            ? "bg-[#f6b100] bg-opacity-20 text-[#f6b100]"
                            : customer.customerType === "Regular"
                            ? "bg-[#02ca3a] bg-opacity-20 text-[#02ca3a]"
                            : "bg-[#025cca] bg-opacity-20 text-[#025cca]"
                        }`}>
                          {customer.customerType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {customer.totalOrders}
                      </td>
                      <td className="px-6 py-4">
                        ₹{customer.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(customer.lastVisit).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditCustomer(customer)}
                          className="text-[#025cca] hover:text-[#0273fa] transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Data State */}
          {!isLoading && currentCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[#ababab]">No customers found matching your criteria.</p>
            </div>
          )}
          
          {/* Pagination Controls */}
          {filteredCustomers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4"
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-[#ababab] text-sm order-2 sm:order-1"
              >
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
              </motion.span>
              
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#3d3d3d" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md border border-[#4a4a4a] text-sm ${
                    currentPage === 1 
                      ? "bg-[#262626] text-[#4a4a4a] cursor-not-allowed" 
                      : "bg-[#333] text-[#ababab] hover:text-[#f5f5f5]"
                  }`}
                >
                  Previous
                </motion.button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 rounded-md border border-[#4a4a4a] text-sm ${
                          currentPage === page
                            ? "bg-[#025cca] text-[#f5f5f5] border-[#025cca]"
                            : "bg-[#333] text-[#ababab] hover:text-[#f5f5f5] hover:bg-[#3d3d3d]"
                        }`}
                      >
                        {page}
                      </motion.button>
                    );
                  })}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#3d3d3d" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md border border-[#4a4a4a] text-sm ${
                    currentPage === totalPages
                      ? "bg-[#262626] text-[#4a4a4a] cursor-not-allowed"
                      : "bg-[#333] text-[#ababab] hover:text-[#f5f5f5]"
                  }`}
                >
                  Next
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        customer={selectedCustomer}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
};

export default CustomerDetails;
