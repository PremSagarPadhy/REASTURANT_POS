import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import EmployeeAddModal from "./EmployeeAddModal";


// API functions
const getEmployees = async () => {
  const response = await axios.get(`${API_URL}/employees`);
  return response.data;
};

const deleteEmployee = async (id) => {
  const response = await axios.delete(`${API_URL}/employees/${id}`);
  return response.data;
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

// Confirmation Dialog for Delete
const ConfirmDialog = ({ isOpen, onCancel, onConfirm, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#262626] rounded-lg shadow-lg p-6 w-80"
          >
            <h3 className="text-xl text-[#f5f5f5] font-semibold mb-2">{title}</h3>
            <p className="text-[#ababab] mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="px-4 py-2 bg-[#4a4a4a] text-[#f5f5f5] rounded-md"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-[#f5f5f5] rounded-md"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Employee Details Component
const EmployeeDetails = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch employees data
  const { data, isError, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      enqueueSnackbar("Employee deleted successfully!", { variant: "success" });
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to delete employee", { variant: "error" });
      setShowConfirmDialog(false);
    },
  });

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

  // Handle view employee details
  const handleViewEmployee = (employee) => {
    navigate(`/employee-edit/${employee._id}`);
  };

  // Handle delete employee
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete._id);
    }
  };

  // Handle add new employee
  const handleAddEmployee = () => {
    setShowAddModal(true);
  };

  if (isError) {
    enqueueSnackbar("Failed to load employees!", { variant: "error" });
  }

  // Extract unique positions for filter dropdown
  const positions = data?.data 
    ? [...new Set(data.data.map(emp => emp.position))]
    : [];

  // Apply all filters to employees
  const filteredEmployees = data?.data 
    ? data.data.filter(employee => {
        // Apply search filter
        const matchesSearch = 
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.empid.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.phone.includes(searchTerm);
        
        // Apply position filter
        const matchesPosition = 
          positionFilter === "All" || 
          employee.position === positionFilter;
        
        // Apply column filters
        let matchesColumnFilters = true;
        
        // Filter by ID
        if (columnFilters.ID && !employee.empid.includes(columnFilters.ID)) {
          matchesColumnFilters = false;
        }
        
        // Filter by Name
        if (columnFilters.Name && !employee.name.toLowerCase().includes(columnFilters.Name.toLowerCase())) {
          matchesColumnFilters = false;
        }
        
        // Filter by Phone
        if (columnFilters.Phone && !employee.phone.includes(columnFilters.Phone)) {
          matchesColumnFilters = false;
        }
        
        // Filter by Position
        if (columnFilters.Position && !employee.position.toLowerCase().includes(columnFilters.Position.toLowerCase())) {
          matchesColumnFilters = false;
        }
        
        // Filter by Address
        if (columnFilters.Address && !employee.address.toLowerCase().includes(columnFilters.Address.toLowerCase())) {
          matchesColumnFilters = false;
        }
        
        return matchesSearch && matchesPosition && matchesColumnFilters;
      })
    : [];

  // Define table headers with filter functionality
  const tableHeaders = [
    { id: "ID", label: "Employee ID" },
    { id: "Name", label: "Name" },
    { id: "Phone", label: "Phone" },
    { id: "Position", label: "Position" },
    { id: "Address", label: "Address" },
    { id: "Actions", label: "Actions" },
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
              Employee Management
            </h2>
            <p className="text-sm text-[#ababab]">
              View and manage employee details
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-[#025cca] cursor-pointer"
            whileHover={{ scale: 1.03, backgroundColor: "#0273fa" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddEmployee}
          >
            Add Employee
          </motion.button>
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
              All Employees
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
                  placeholder="Search by name, ID or phone..."
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
              
              {/* Position Filter */}
              <motion.select
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="bg-[#333] text-[#f5f5f5] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#025cca] border border-[#4a4a4a]"
                whileHover={{ scale: 1.02 }}
              >
                <option value="All" className="bg-[#333] text-[#f5f5f5]">All Positions</option>
                {positions.map(position => (
                  <option key={position} value={position} className="bg-[#333] text-[#f5f5f5]">{position}</option>
                ))}
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
                <thead>
                  <tr className="bg-[#2f2f2f] text-[#f5f5f5]">
                    <th className="gap-3 px-4 py-3 text-center font-semibold">Employee ID</th>
                    <th className="px-4 py-3 text-left font-semibold"> Employee Name</th>
                    <th className="px-4 py-3 text-center font-semibold">Phone No.</th>
                    <th className="px-4 py-3 text-left font-semibold">Position</th>
                    <th className="px-5 py-3 text-center font-semibold min-w-[100px]">Address</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredEmployees.map((employee, index) => (
                      <motion.tr 
                        key={employee._id} 
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
                        <td className="px-4 py-3 text-center">{employee.empid}</td>
                        <td className="px-4 py-3">{employee.name}</td>
                        <td className="px-4 py-3 text-center">{employee.phone}</td>
                        <td className="px-4 py-3">
                          <motion.span
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-400`}
                          >
                            {employee.position}
                          </motion.span>
                        </td>
                        <td className="px-4 py-3 text-left min-w-[100px]">{employee.address}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <motion.button
                              whileHover={{ scale: 1.1, backgroundColor: "#b91c1c" }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(employee)}
                              className="flex items-center justify-center bg-[#333] hover:bg-[#444] text-[#f5f5f5] rounded-full p-2 transition-all duration-200"
                              title="Delete Employee"
                            >
                              <MdDeleteForever className="text-lg" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  
                  {filteredEmployees.length === 0 && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <td colSpan="6" className="px-4 py-4 text-center text-[#ababab]">
                        <motion.div
                          initial={{ y: -10 }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          No employees found matching your criteria
                        </motion.div>
                      </td>
                    </motion.tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls - Animated */}
          {filteredEmployees.length > 0 && (
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
                Showing {filteredEmployees.length} of {data?.data?.length || 0} employees
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

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employeeToDelete?.name}? This action cannot be undone.`}
      />

      {/* Add Employee Modal */}
      <EmployeeAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default EmployeeDetails;