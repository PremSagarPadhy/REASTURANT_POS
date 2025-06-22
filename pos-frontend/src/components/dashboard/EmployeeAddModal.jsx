import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaSave, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.PROD 
  ? 'https://reasturant-pos-backend.onrender.com/api'
  : 'http://localhost:8000/api';

// API function to add a new employee
const addEmployee = async (employeeData) => {
  const response = await axios.post(`${API_URL}/employees`, employeeData);
  return response.data;
};

const EmployeeAddModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    empid: "",
    name: "",
    phone: "",
    address: "",
    position: ""
  });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      enqueueSnackbar("Employee added successfully!", { variant: "success" });
      onClose();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to add employee", { variant: "error" });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.empid.trim()) newErrors.empid = "Employee ID is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,12}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!formData.position.trim()) newErrors.position = "Position is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      mutation.mutate(formData);
    } else {
      enqueueSnackbar("Please correct the errors in the form", { variant: "error" });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#262626] rounded-lg shadow-lg p-6 w-full max-w-xl relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-[#f5f5f5] text-xl">
                Add New Employee
              </h2>
              <button
                onClick={onClose}
                className="text-[#ababab] hover:text-[#f5f5f5] text-xl"
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#ababab] mb-1">Employee ID *</label>
                  <input
                    type="text"
                    name="empid"
                    value={formData.empid}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${errors.empid ? "border-red-500" : "border-[#4a4a4a]"} rounded-md px-3 py-2 text-[#f5f5f5]`}
                    placeholder="Enter employee ID"
                  />
                  {errors.empid && <p className="text-red-500 text-xs">{errors.empid}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#ababab] mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${errors.name ? "border-red-500" : "border-[#4a4a4a]"} rounded-md px-3 py-2 text-[#f5f5f5]`}
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#ababab] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${errors.phone ? "border-red-500" : "border-[#4a4a4a]"} rounded-md px-3 py-2 text-[#f5f5f5]`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#ababab] mb-1">Position *</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className={`w-full bg-[#333] border ${errors.position ? "border-red-500" : "border-[#4a4a4a]"} rounded-md px-3 py-2 text-[#f5f5f5]`}
                    placeholder="Enter position"
                  />
                  {errors.position && <p className="text-red-500 text-xs">{errors.position}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#ababab] mb-1">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full bg-[#333] border ${errors.address ? "border-red-500" : "border-[#4a4a4a]"} rounded-md px-3 py-2 text-[#f5f5f5] min-h-[60px]`}
                  placeholder="Enter address"
                />
                {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={onClose}
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
              </div>
              <div className="text-[#ababab] text-xs mt-2">* Required fields</div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmployeeAddModal;