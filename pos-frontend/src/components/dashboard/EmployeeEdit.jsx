import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaSave, FaArrowLeft, FaSearch, FaTimes } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md"; // Import pen edit icon
import { getEmployeeById, updateEmployee, getEmployees } from '../../api/index.js';

const EmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [formLocked, setFormLocked] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(!id); // Show modal if no ID in URL
  const [searchEmpId, setSearchEmpId] = useState("");
  const [employeeId, setEmployeeId] = useState(id || "");
  const [formData, setFormData] = useState({
    empid: "",
    name: "",
    phone: "",
    address: "",
    position: ""
  });
  
  // Fetch all employees for search validation
  const { data: allEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: showSearchModal,
  });
  
  // Fetch employee data
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => {
      console.log("Fetching employee with ID:", employeeId);
      return getEmployeeById(employeeId);
    },
    enabled: !!employeeId && !showSearchModal,
    onSuccess: (data) => {
      console.log("Successfully fetched employee data:", data);
    },
    onError: (error) => {
      console.error("Error fetching employee:", error);
    }
  });

  // Update employee mutation
  const mutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      enqueueSnackbar("Employee updated successfully!", { variant: "success" });
      setFormLocked(true);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to update employee", { variant: "error" });
    },
  });

  // Handle search for employee
  const handleSearchEmployee = () => {
    if (!searchEmpId.trim()) {
      enqueueSnackbar("Please enter an Employee ID", { variant: "error" });
      return;
    }

    // Check if employee exists in the list
    const foundEmployee = allEmployees?.find(emp => emp.empid === searchEmpId.trim());
    
    if (!foundEmployee) {
      enqueueSnackbar("Employee not found with this ID", { variant: "error" });
      return;
    }

    console.log("Found employee:", foundEmployee);

    // Set the employee ID and close modal
    setEmployeeId(foundEmployee._id);
    setShowSearchModal(false);
    
    // Update URL without navigation
    window.history.replaceState({}, '', `/employee-edit/${foundEmployee._id}`);
    
    enqueueSnackbar(`Loading employee: ${foundEmployee.name}`, { variant: "info" });
  };

  // Handle modal cancel
  const handleCancelSearch = () => {
    setShowSearchModal(false);
    // Don't navigate, just close the modal
  };

  // Set form data when employee data is loaded
  useEffect(() => {
    console.log("Employee data received:", data);
    if (data) {
      setFormData({
        empid: data.empid || "",
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        position: data.position || ""
      });
    }
  }, [data]);

  // Handle form changes
  const handleChange = (e) => {
    if (formLocked) return;
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If form is locked, do nothing (edit button should be used instead)
    if (formLocked) return;
    
    mutation.mutate({ id: employeeId, data: formData });
  };

  // Handle unlock form
  const handleUnlockForm = () => {
    setFormLocked(false);
  };

  // Handle back button click
  const handleBack = () => {
    navigate("/employees");
  };

  // Handle error notification
  useEffect(() => {
    if (isError) {
      enqueueSnackbar("Failed to load employee data!", { variant: "error" });
    }
  }, [isError]);

  return (
    <div className="bg-[#1a1a1a] p-6 min-h-screen">
      {/* Employee ID Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#262626] rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#f5f5f5]">
                  Find Employee
                </h2>
                <button
                  onClick={handleCancelSearch}
                  className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#ababab] mb-2">
                    Enter Employee ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchEmpId}
                      onChange={(e) => setSearchEmpId(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchEmployee();
                        }
                      }}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-4 py-3 pr-12 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca] focus:border-[#025cca]"
                      placeholder="Type employee ID here..."
                      autoFocus
                    />
                    <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#ababab]" />
                  </div>
                  
                  {/* Show available employee IDs */}
                  {allEmployees && allEmployees.length > 0 && (
                    <div className="mt-3 p-3 bg-[#1f1f1f] rounded-md">
                      <p className="text-xs text-[#ababab] mb-2">Available Employee IDs:</p>
                      <div className="flex flex-wrap gap-1">
                        {allEmployees.slice(0, 6).map((emp) => (
                          <motion.button
                            key={emp._id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSearchEmpId(emp.empid)}
                            className="px-2 py-1 bg-[#025cca] text-white text-xs rounded hover:bg-[#0273fa] transition-colors"
                          >
                            {emp.empid}
                          </motion.button>
                        ))}
                        {allEmployees.length > 6 && (
                          <span className="text-xs text-[#ababab] self-center">
                            +{allEmployees.length - 6} more...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 justify-end pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelSearch}
                    className="px-4 py-2 bg-[#4a4a4a] text-[#f5f5f5] rounded-md hover:bg-[#5a5a5a] transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSearchEmployee}
                    className="px-6 py-2 bg-[#025cca] text-white rounded-md hover:bg-[#0273fa] transition-colors flex items-center gap-2"
                  >
                    <FaSearch /> Search
                  </motion.button>
                </div>
                
                <div className="text-center text-[#ababab] text-sm pt-2">
                  Enter the Employee ID to load their details for editing
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Main Content - Only show when not searching for employee */}
      {!showSearchModal && (
        <>
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
              Employee Details
            </h2>
            <p className="text-sm text-[#ababab]">
              View and edit employee information
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-[#333] cursor-pointer"
            whileHover={{ scale: 1.03, backgroundColor: "#3d3d3d" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBack}
          >
            <FaArrowLeft /> Back to Employees
          </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#262626] p-6 rounded-lg shadow-lg mt-6"
          whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
        >
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <motion.h2 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="text-[#f5f5f5] text-xl font-semibold"
                >
                  Employee Information
                </motion.h2>
                
                <div className="flex gap-3">
                  {/* Edit Button - Show only when form is locked */}
                  {formLocked && (
                    <motion.button
                      type="button"
                      onClick={handleUnlockForm}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#025cca] hover:bg-[#0273fa] text-white transition-colors duration-300"
                    >
                      <MdModeEdit className="text-lg" /> Edit
                    </motion.button>
                  )}
                  
                  {/* Save Button - Show only when form is unlocked */}
                  {!formLocked && (
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors duration-300"
                    >
                      <FaSave /> Save Changes
                    </motion.button>
                  )}
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Employee ID */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#ababab] mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="empid"
                    disabled={formLocked}
                    value={formData.empid}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${
                      formLocked ? "border-[#4a4a4a]" : "border-[#025cca]"
                    } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca] disabled:opacity-70`}
                  />
                  {formLocked && (
                    <FaLock className="absolute right-3 top-8 text-[#ababab]" />
                  )}
                </div>
                
                {/* Name */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#ababab] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    disabled={formLocked}
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${
                      formLocked ? "border-[#4a4a4a]" : "border-[#025cca]"
                    } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca] disabled:opacity-70`}
                  />
                  {formLocked && (
                    <FaLock className="absolute right-3 top-8 text-[#ababab]" />
                  )}
                </div>
                
                {/* Phone */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#ababab] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    disabled={formLocked}
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${
                      formLocked ? "border-[#4a4a4a]" : "border-[#025cca]"
                    } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca] disabled:opacity-70`}
                  />
                  {formLocked && (
                    <FaLock className="absolute right-3 top-8 text-[#ababab]" />
                  )}
                </div>
                
                {/* Position */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#ababab] mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    disabled={formLocked}
                    value={formData.position}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${
                      formLocked ? "border-[#4a4a4a]" : "border-[#025cca]"
                    } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca] disabled:opacity-70`}
                  />
                  {formLocked && (
                    <FaLock className="absolute right-3 top-8 text-[#ababab]" />
                  )}
                </div>
              </motion.div>
              
              {/* Address - Full width */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-[#ababab] mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  disabled={formLocked}
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full bg-[#333] border ${
                    formLocked ? "border-[#4a4a4a]" : "border-[#025cca]"
                  } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca] disabled:opacity-70 min-h-[100px]`}
                />
                {formLocked && (
                  <FaLock className="absolute right-3 top-8 text-[#ababab]" />
                )}
              </motion.div>
              
              {/* Form Status Message */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className={`text-center p-2 rounded-md ${
                  formLocked 
                    ? "bg-yellow-900/30 text-yellow-400" 
                    : "bg-green-900/30 text-green-400"
                }`}
              >
                {formLocked 
                  ? "Form is locked. Click 'Edit' to make changes." 
                  : "Form is unlocked. Make your changes and click 'Save Changes'."}
              </motion.div>
              
              {/* Created/Updated Info */}
              {data?.createdAt && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-sm text-[#ababab] flex justify-between items-center pt-4 border-t border-[#333]"
                >
                  <div>
                    <span>Created: </span>
                    <span>{new Date(data.createdAt).toLocaleString()}</span>
                  </div>
                  {data?.updatedAt && (
                    <div>
                      <span>Last Updated: </span>
                      <span>{new Date(data.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </form>
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
        </>
      )}
     <div className="pb-12 sm:pb-16 md:pb-20 lg:pb-24"></div>
    </div>
  );
};

export default EmployeeEdit;