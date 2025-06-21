import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";
import Sidebar from "../shared/Sidebar";

// API function to add a new employee
const addEmployee = async (employeeData) => {
  const response = await axios.post("http://localhost:8000/api/employees", employeeData);
  return response.data;
};

const EmployeeAdd = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    empid: "",
    name: "",
    phone: "",
    address: "",
    position: ""
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Add employee mutation
  const mutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      enqueueSnackbar("Employee added successfully!", { variant: "success" });
      navigate("/employees");
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to add employee", { variant: "error" });
    },
  });

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.empid.trim()) {
      newErrors.empid = "Employee ID is required";
    }
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,12}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      mutation.mutate(formData);
    } else {
      enqueueSnackbar("Please correct the errors in the form", { variant: "error" });
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    navigate("/employees");
  };

  return (
    <div className="bg-[#1a1a1a] p-6 min-h-screen">
      <Sidebar />
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
              Add New Employee
            </h2>
            <p className="text-sm text-[#ababab]">
              Create a new employee record
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-[#333] cursor-pointer"
            whileHover={{ scale: 1.03, backgroundColor: "#3d3d3d" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCancel}
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
                  Employee ID *
                </label>
                <input
                  type="text"
                  name="empid"
                  value={formData.empid}
                  onChange={handleChange}
                  className={`w-full bg-[#333] border ${
                    errors.empid ? "border-red-500" : "border-[#4a4a4a]"
                  } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca]`}
                  placeholder="Enter employee ID"
                />
                {errors.empid && (
                  <p className="text-red-500 text-xs mt-1">{errors.empid}</p>
                )}
              </div>
              
              {/* Name */}
              <div className="relative">
                <label className="block text-sm font-medium text-[#ababab] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-[#333] border ${
                    errors.name ? "border-red-500" : "border-[#4a4a4a]"
                  } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca]`}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              
              {/* Phone */}
              <div className="relative">
                <label className="block text-sm font-medium text-[#ababab] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full bg-[#333] border ${
                    errors.phone ? "border-red-500" : "border-[#4a4a4a]"
                  } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca]`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              
              {/* Position */}
              <div className="relative">
                <label className="block text-sm font-medium text-[#ababab] mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`w-full bg-[#333] border ${
                    errors.position ? "border-red-500" : "border-[#4a4a4a]"
                  } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca]`}
                  placeholder="Enter position"
                />
                {errors.position && (
                  <p className="text-red-500 text-xs mt-1">{errors.position}</p>
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
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full bg-[#333] border ${
                  errors.address ? "border-red-500" : "border-[#4a4a4a]"
                } rounded-md px-3 py-2 text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#025cca] min-h-[100px]`}
                placeholder="Enter address"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </motion.div>
            
            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex justify-end gap-3 pt-4"
            >
              <motion.button
                type="button"
                onClick={handleCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-[#333] hover:bg-[#444] text-white"
              >
                <FaTimes /> Cancel
              </motion.button>
              
              <motion.button
                type="submit"
                disabled={mutation.isLoading}
                whileHover={{ scale: mutation.isLoading ? 1 : 1.05 }}
                whileTap={{ scale: mutation.isLoading ? 1 : 0.95 }}
                className={`flex items-center gap-2 px-6 py-2 rounded-md ${
                  mutation.isLoading ? "bg-[#025cca]/50" : "bg-[#025cca] hover:bg-[#0273fa]"
                } text-white`}
              >
                {mutation.isLoading ? (
                  <>
                    <motion.div 
                      animate={{ 
                        rotate: 360,
                        transition: { 
                          duration: 1, 
                          repeat: Infinity, 
                          ease: "linear" 
                        } 
                      }}
                      className="w-4 h-4 border-2 border-t-transparent border-white rounded-full"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Employee
                  </>
                )}
              </motion.button>
            </motion.div>
            
            {/* Required fields note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-[#ababab] text-sm mt-6"
            >
              * Required fields
            </motion.div>
          </form>
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
    </div>
  );
};

export default EmployeeAdd;