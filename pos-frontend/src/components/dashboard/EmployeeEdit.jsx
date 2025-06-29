import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { motion } from "framer-motion";
import { FaLock, FaSave, FaArrowLeft } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md"; // Import pen edit icon
import { getEmployeeById, updateEmployee } from '../../api/index.js';

const EmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [formLocked, setFormLocked] = useState(true);
  const [formData, setFormData] = useState({
    empid: "",
    name: "",
    phone: "",
    address: "",
    position: ""
  });
  
  // Fetch employee data
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployeeById(id),
    enabled: !!id,
  });

  // Update employee mutation
  const mutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      enqueueSnackbar("Employee updated successfully!", { variant: "success" });
      setFormLocked(true);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to update employee", { variant: "error" });
    },
  });

  // Set form data when employee data is loaded
  useEffect(() => {
    if (data?.data) {
      setFormData({
        empid: data.data.empid || "",
        name: data.data.name || "",
        phone: data.data.phone || "",
        address: data.data.address || "",
        position: data.data.position || ""
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
    
    mutation.mutate({ id, data: formData });
  };

  // Handle unlock form
  const handleUnlockForm = () => {
    setFormLocked(false);
  };

  // Handle back button click
  const handleBack = () => {
    navigate("/employees");
  };

  if (isError) {
    enqueueSnackbar("Failed to load employee data!", { variant: "error" });
  }

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
              {data?.data?.createdAt && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-sm text-[#ababab] flex justify-between items-center pt-4 border-t border-[#333]"
                >
                  <div>
                    <span>Created: </span>
                    <span>{new Date(data.data.createdAt).toLocaleString()}</span>
                  </div>
                  {data?.data?.updatedAt && (
                    <div>
                      <span>Last Updated: </span>
                      <span>{new Date(data.data.updatedAt).toLocaleString()}</span>
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
    </div>
  );
};

export default EmployeeEdit;