import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUserCheck, 
  FaUserTimes, 
  FaEdit, 
  FaTrash, 
  FaPlus,
  FaSearch,
  FaEye,
  FaDownload,
  FaUserClock
} from "react-icons/fa";
import { MdAccessTime, MdToday, MdAssessment } from "react-icons/md";
import { 
  getAllAttendance, 
  getTodayAttendance, 
  markAttendance, 
  updateAttendance, 
  deleteAttendance,
  getEmployees,
  getAttendanceSummary
} from '../../api/index.js';

const EmployeeAttendance = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Mark attendance form data
  const [markFormData, setMarkFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().split('T')[0],
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: "",
    markedBy: "admin"
  });

  // Fetch today's attendance
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: getTodayAttendance,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all attendance with filters
  const { data: allAttendanceData, isLoading: allLoading } = useQuery({
    queryKey: ["attendance", "all", selectedDate, statusFilter, searchTerm, currentPage],
    queryFn: () => getAllAttendance({
      date: selectedDate,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page: currentPage,
      limit: 20
    }),
    enabled: activeTab === "all",
  });

  // Fetch employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  // Fetch attendance summary
  const { data: summaryData } = useQuery({
    queryKey: ["attendance", "summary", selectedDate],
    queryFn: () => getAttendanceSummary({
      startDate: selectedDate,
      endDate: selectedDate
    }),
    enabled: activeTab === "summary",
  });

  // Mark attendance mutation
  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      enqueueSnackbar("Attendance marked successfully!", { variant: "success" });
      setShowMarkModal(false);
      resetMarkForm();
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Failed to mark attendance", { variant: "error" });
    },
  });

  // Update attendance mutation
  const updateMutation = useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      enqueueSnackbar("Attendance updated successfully!", { variant: "success" });
      setShowEditModal(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Failed to update attendance", { variant: "error" });
    },
  });

  // Delete attendance mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      enqueueSnackbar("Attendance record deleted successfully!", { variant: "success" });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Failed to delete attendance", { variant: "error" });
    },
  });

  const resetMarkForm = () => {
    setMarkFormData({
      employeeId: "",
      date: new Date().toISOString().split('T')[0],
      checkIn: "",
      checkOut: "",
      status: "present",
      notes: "",
      markedBy: "admin"
    });
  };

  const handleMarkAttendance = (employee = null) => {
    if (employee) {
      setMarkFormData(prev => ({
        ...prev,
        employeeId: employee._id
      }));
      setSelectedEmployee(employee);
    }
    setShowMarkModal(true);
  };

  const handleEditAttendance = (attendance) => {
    setSelectedAttendance(attendance);
    setShowEditModal(true);
  };

  const handleDeleteAttendance = (attendanceId) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      deleteMutation.mutate(attendanceId);
    }
  };

  const submitMarkAttendance = (e) => {
    e.preventDefault();
    markMutation.mutate(markFormData);
  };

  const submitUpdateAttendance = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updateData = {
      checkIn: formData.get('checkIn') ? new Date(`${selectedAttendance.date.split('T')[0]}T${formData.get('checkIn')}`).toISOString() : null,
      checkOut: formData.get('checkOut') ? new Date(`${selectedAttendance.date.split('T')[0]}T${formData.get('checkOut')}`).toISOString() : null,
      status: formData.get('status'),
      notes: formData.get('notes')
    };
    updateMutation.mutate({ id: selectedAttendance._id, data: updateData });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-900/30 text-green-400';
      case 'absent': return 'bg-red-900/30 text-red-400';
      case 'late': return 'bg-yellow-900/30 text-yellow-400';
      case 'halfDay': return 'bg-blue-900/30 text-blue-400';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter employees for search
  const filteredEmployees = employees?.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empid.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="bg-[#1a1a1a] p-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-2 px-6 md:px-4"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="font-semibold text-[#f5f5f5] text-xl">
              Employee Attendance
            </h2>
            <p className="text-sm text-[#ababab]">
              Track and manage employee attendance records
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white bg-[#025cca] cursor-pointer"
            whileHover={{ scale: 1.03, backgroundColor: "#0273fa" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleMarkAttendance()}
          >
            <FaPlus /> Mark Attendance
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#262626] p-1 rounded-lg">
          {[
            { id: "today", label: "Today's Attendance", icon: MdToday },
            { id: "all", label: "All Records", icon: FaCalendarAlt },
            { id: "summary", label: "Summary", icon: MdAssessment }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md flex-1 transition-colors ${
                activeTab === tab.id 
                  ? "bg-[#025cca] text-white" 
                  : "text-[#ababab] hover:text-[#f5f5f5]"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Content based on active tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Today's Attendance Tab */}
          {activeTab === "today" && (
            <div className="space-y-6">
              {/* Today's Stats */}
              {todayData?.data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <motion.div 
                    className="bg-[#262626] p-4 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <FaUserCheck className="text-green-400 text-2xl" />
                      <div>
                        <p className="text-[#ababab] text-sm">Present</p>
                        <p className="text-[#f5f5f5] text-xl font-semibold">
                          {todayData.data.presentCount}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-[#262626] p-4 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <FaUserTimes className="text-red-400 text-2xl" />
                      <div>
                        <p className="text-[#ababab] text-sm">Absent</p>
                        <p className="text-[#f5f5f5] text-xl font-semibold">
                          {todayData.data.absentCount}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-[#262626] p-4 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <FaUserClock className="text-yellow-400 text-2xl" />
                      <div>
                        <p className="text-[#ababab] text-sm">Late</p>
                        <p className="text-[#f5f5f5] text-xl font-semibold">
                          {todayData.data.lateCount}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-[#262626] p-4 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-blue-400 text-2xl" />
                      <div>
                        <p className="text-[#ababab] text-sm">Total</p>
                        <p className="text-[#f5f5f5] text-xl font-semibold">
                          {todayData.data.totalEmployees}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Today's Attendance List */}
              <div className="bg-[#262626] rounded-lg overflow-hidden">
                <div className="p-4 border-b border-[#333]">
                  <h3 className="text-[#f5f5f5] text-lg font-semibold">
                    Today's Attendance Records
                  </h3>
                </div>
                
                {todayLoading ? (
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#2f2f2f]">
                        <tr>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Employee</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Check In</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Check Out</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Hours</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Status</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayData?.data?.markedAttendance?.map((attendance) => (
                          <motion.tr 
                            key={attendance._id}
                            className="border-b border-[#333] hover:bg-[#333]"
                            whileHover={{ backgroundColor: "#3d3d3d" }}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-[#f5f5f5] font-medium">
                                  {attendance.employeeId.name}
                                </p>
                                <p className="text-[#ababab] text-sm">
                                  ID: {attendance.employeeId.empid}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {formatTime(attendance.checkIn)}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {formatTime(attendance.checkOut)}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {attendance.totalHours ? `${attendance.totalHours.toFixed(2)}h` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(attendance.status)}`}>
                                {attendance.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditAttendance(attendance)}
                                  className="p-2 bg-[#025cca] text-white rounded-md hover:bg-[#0273fa]"
                                >
                                  <FaEdit size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteAttendance(attendance._id)}
                                  className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                  <FaTrash size={14} />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        
                        {/* Unmarked employees */}
                        {todayData?.data?.unmarkedEmployees?.map((employee) => (
                          <motion.tr 
                            key={`unmarked-${employee._id}`}
                            className="border-b border-[#333] hover:bg-[#333] opacity-60"
                            whileHover={{ backgroundColor: "#3d3d3d" }}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-[#f5f5f5] font-medium">
                                  {employee.name}
                                </p>
                                <p className="text-[#ababab] text-sm">
                                  ID: {employee.empid}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#ababab]">-</td>
                            <td className="px-4 py-3 text-[#ababab]">-</td>
                            <td className="px-4 py-3 text-[#ababab]">-</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-gray-900/30 text-gray-400">
                                Not Marked
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMarkAttendance(employee)}
                                className="px-3 py-1 bg-[#025cca] text-white rounded-md hover:bg-[#0273fa] text-sm"
                              >
                                Mark
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Records Tab */}
          {activeTab === "all" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-[#262626] p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    >
                      <option value="all">All Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="halfDay">Half Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="bg-[#262626] rounded-lg overflow-hidden">
                <div className="p-4 border-b border-[#333]">
                  <h3 className="text-[#f5f5f5] text-lg font-semibold">
                    Attendance Records
                  </h3>
                </div>
                
                {allLoading ? (
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#2f2f2f]">
                        <tr>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Date</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Employee</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Check In</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Check Out</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Hours</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Status</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAttendanceData?.data?.map((attendance) => (
                          <motion.tr 
                            key={attendance._id}
                            className="border-b border-[#333] hover:bg-[#333]"
                            whileHover={{ backgroundColor: "#3d3d3d" }}
                          >
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {formatDate(attendance.date)}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-[#f5f5f5] font-medium">
                                  {attendance.employeeId.name}
                                </p>
                                <p className="text-[#ababab] text-sm">
                                  ID: {attendance.employeeId.empid}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {formatTime(attendance.checkIn)}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {formatTime(attendance.checkOut)}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {attendance.totalHours ? `${attendance.totalHours.toFixed(2)}h` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(attendance.status)}`}>
                                {attendance.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditAttendance(attendance)}
                                  className="p-2 bg-[#025cca] text-white rounded-md hover:bg-[#0273fa]"
                                >
                                  <FaEdit size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteAttendance(attendance._id)}
                                  className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                  <FaTrash size={14} />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {allAttendanceData?.data?.length === 0 && (
                      <div className="p-8 text-center text-[#ababab]">
                        No attendance records found for the selected filters.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* Date Range Selector */}
              <div className="bg-[#262626] p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">From Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">To Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Table */}
              <div className="bg-[#262626] rounded-lg overflow-hidden">
                <div className="p-4 border-b border-[#333]">
                  <h3 className="text-[#f5f5f5] text-lg font-semibold">
                    Attendance Summary
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#2f2f2f]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[#f5f5f5]">Employee</th>
                        <th className="px-4 py-3 text-left text-[#f5f5f5]">Total Days</th>
                        <th className="px-4 py-3 text-left text-[#f5f5f5]">Present</th>
                        <th className="px-4 py-3 text-left text-[#f5f5f5]">Absent</th>
                        <th className="px-4 py-3 text-left text-[#f5f5f5]">Late</th>
                        <th className="px-4 py-3 text-left text-[#f5f5f5]">Total Hours</th>
                        <th className="px-4 py-3 text-left text-[#f5f5f5]">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData?.data?.map((summary) => (
                        <motion.tr 
                          key={summary._id}
                          className="border-b border-[#333] hover:bg-[#333]"
                          whileHover={{ backgroundColor: "#3d3d3d" }}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-[#f5f5f5] font-medium">
                                {summary.employee.name}
                              </p>
                              <p className="text-[#ababab] text-sm">
                                ID: {summary.employee.empid}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#f5f5f5]">{summary.totalDays}</td>
                          <td className="px-4 py-3 text-green-400">{summary.presentDays}</td>
                          <td className="px-4 py-3 text-red-400">{summary.absentDays}</td>
                          <td className="px-4 py-3 text-yellow-400">{summary.lateDays}</td>
                          <td className="px-4 py-3 text-[#f5f5f5]">{summary.totalHours}h</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              summary.attendancePercentage >= 90 ? 'bg-green-900/30 text-green-400' :
                              summary.attendancePercentage >= 75 ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-red-900/30 text-red-400'
                            }`}>
                              {summary.attendancePercentage}%
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Mark Attendance Modal */}
      <AnimatePresence>
        {showMarkModal && (
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
              <h2 className="text-xl font-semibold text-[#f5f5f5] mb-4">
                Mark Attendance
              </h2>
              
              <form onSubmit={submitMarkAttendance} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#ababab] mb-2">Employee</label>
                  <select
                    value={markFormData.employeeId}
                    onChange={(e) => setMarkFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    required
                    className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                  >
                    <option value="">Select Employee</option>
                    {employees?.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.empid})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#ababab] mb-2">Date</label>
                  <input
                    type="date"
                    value={markFormData.date}
                    onChange={(e) => setMarkFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">Check In</label>
                    <input
                      type="time"
                      value={markFormData.checkIn}
                      onChange={(e) => setMarkFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">Check Out</label>
                    <input
                      type="time"
                      value={markFormData.checkOut}
                      onChange={(e) => setMarkFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#ababab] mb-2">Status</label>
                  <select
                    value={markFormData.status}
                    onChange={(e) => setMarkFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="halfDay">Half Day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#ababab] mb-2">Notes</label>
                  <textarea
                    value={markFormData.notes}
                    onChange={(e) => setMarkFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMarkModal(false)}
                    className="px-4 py-2 bg-[#4a4a4a] text-[#f5f5f5] rounded-md hover:bg-[#5a5a5a]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={markMutation.isLoading}
                    className="px-6 py-2 bg-[#025cca] text-white rounded-md hover:bg-[#0273fa] disabled:opacity-50"
                  >
                    {markMutation.isLoading ? "Marking..." : "Mark Attendance"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Attendance Modal */}
      <AnimatePresence>
        {showEditModal && selectedAttendance && (
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
              <h2 className="text-xl font-semibold text-[#f5f5f5] mb-4">
                Edit Attendance
              </h2>
              
              <form onSubmit={submitUpdateAttendance} className="space-y-4">
                <div className="bg-[#1f1f1f] p-3 rounded-md">
                  <p className="text-[#f5f5f5] font-medium">
                    {selectedAttendance.employeeId.name}
                  </p>
                  <p className="text-[#ababab] text-sm">
                    {formatDate(selectedAttendance.date)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">Check In</label>
                    <input
                      type="time"
                      name="checkIn"
                      defaultValue={selectedAttendance.checkIn ? 
                        new Date(selectedAttendance.checkIn).toTimeString().slice(0, 5) : 
                        ""
                      }
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#ababab] mb-2">Check Out</label>
                    <input
                      type="time"
                      name="checkOut"
                      defaultValue={selectedAttendance.checkOut ? 
                        new Date(selectedAttendance.checkOut).toTimeString().slice(0, 5) : 
                        ""
                      }
                      className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#ababab] mb-2">Status</label>
                  <select
                    name="status"
                    defaultValue={selectedAttendance.status}
                    className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="halfDay">Half Day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#ababab] mb-2">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={selectedAttendance.notes || ""}
                    placeholder="Optional notes..."
                    className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-[#4a4a4a] text-[#f5f5f5] rounded-md hover:bg-[#5a5a5a]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={updateMutation.isLoading}
                    className="px-6 py-2 bg-[#025cca] text-white rounded-md hover:bg-[#0273fa] disabled:opacity-50"
                  >
                    {updateMutation.isLoading ? "Updating..." : "Update"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeAttendance;
