import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUtensils, 
  FaConcierge, 
  FaClock, 
  FaUser,
  FaEdit,
  FaAssign,
  FaUserPlus,
  FaChartLine,
  FaFilter,
  FaSearch
} from "react-icons/fa";
import { MdRestaurant, MdPendingActions, MdCheckCircle } from "react-icons/md";
import { 
  getWorkingOrders,
  getEmployeeWorkload,
  assignWaiterToOrder,
  assignCookToOrder,
  getEmployees
} from '../../api/index.js';

const EmployeeWorking = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState(""); // 'waiter' or 'cook'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch working orders
  const { data: workingOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["workingOrders", statusFilter, employeeTypeFilter],
    queryFn: () => getWorkingOrders({
      status: statusFilter !== "all" ? statusFilter : undefined,
      employeeType: employeeTypeFilter !== "all" ? employeeTypeFilter : undefined
    }),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch employee workload
  const { data: workloadData, isLoading: workloadLoading } = useQuery({
    queryKey: ["employeeWorkload"],
    queryFn: getEmployeeWorkload,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch employees for assignment
  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  // Assignment mutations
  const assignWaiterMutation = useMutation({
    mutationFn: assignWaiterToOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["employeeWorkload"] });
      enqueueSnackbar("Waiter assigned successfully!", { variant: "success" });
      setShowAssignModal(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Failed to assign waiter", { variant: "error" });
    },
  });

  const assignCookMutation = useMutation({
    mutationFn: assignCookToOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["employeeWorkload"] });
      enqueueSnackbar("Cook assigned successfully!", { variant: "success" });
      setShowAssignModal(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Failed to assign cook", { variant: "error" });
    },
  });

  // Filter employees by position
  const getFilteredEmployees = (position) => {
    return employeesData?.data?.filter(emp => 
      emp.position.toLowerCase().includes(position.toLowerCase()) &&
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  };

  const waiters = getFilteredEmployees("waiter");
  const cooks = getFilteredEmployees("cook");

  const handleAssignEmployee = (order, type) => {
    setSelectedOrder(order);
    setAssignmentType(type);
    setShowAssignModal(true);
  };

  const submitAssignment = (employeeId) => {
    if (assignmentType === "waiter") {
      assignWaiterMutation.mutate({
        orderId: selectedOrder._id,
        waiterId: employeeId
      });
    } else if (assignmentType === "cook") {
      assignCookMutation.mutate({
        orderId: selectedOrder._id,
        cookId: employeeId
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400';
      case 'preparing': return 'bg-blue-900/30 text-blue-400';
      case 'ready': return 'bg-green-900/30 text-green-400';
      case 'served': return 'bg-gray-900/30 text-gray-400';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

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
              Employee Working Dashboard
            </h2>
            <p className="text-sm text-[#ababab]">
              Track orders assigned to waiters and cooks
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#262626] p-1 rounded-lg">
          {[
            { id: "overview", label: "Overview", icon: FaChartLine },
            { id: "waiters", label: "Waiters", icon: FaConcierge },
            { id: "cooks", label: "Cooks", icon: FaUtensils },
            { id: "unassigned", label: "Unassigned Orders", icon: MdPendingActions }
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

        {/* Filters */}
        {activeTab !== "overview" && (
          <div className="bg-[#262626] p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#ababab] mb-2">Order Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#ababab] mb-2">Employee Type</label>
                <select
                  value={employeeTypeFilter}
                  onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                  className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                >
                  <option value="all">All Types</option>
                  <option value="waiter">Waiters Only</option>
                  <option value="cook">Cooks Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#ababab] mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Workload Summary Cards */}
              {workloadData?.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Waiters Summary */}
                  <div className="bg-[#262626] p-6 rounded-lg">
                    <h3 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
                      <FaConcierge className="text-blue-400" />
                      Active Waiters
                    </h3>
                    <div className="space-y-3">
                      {Object.values(workloadData.data.waiters).map((waiter) => (
                        <div key={waiter.employee._id} className="flex justify-between items-center p-3 bg-[#1f1f1f] rounded-md">
                          <div>
                            <p className="text-[#f5f5f5] font-medium">{waiter.employee.name}</p>
                            <p className="text-[#ababab] text-sm">ID: {waiter.employee.empid}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-blue-400 font-bold">{waiter.activeOrders}</p>
                            <p className="text-[#ababab] text-sm">active orders</p>
                          </div>
                        </div>
                      ))}
                      {Object.keys(workloadData.data.waiters).length === 0 && (
                        <p className="text-[#ababab] text-center py-4">No active waiters</p>
                      )}
                    </div>
                  </div>

                  {/* Cooks Summary */}
                  <div className="bg-[#262626] p-6 rounded-lg">
                    <h3 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
                      <FaUtensils className="text-orange-400" />
                      Active Cooks
                    </h3>
                    <div className="space-y-3">
                      {Object.values(workloadData.data.cooks).map((cook) => (
                        <div key={cook.employee._id} className="flex justify-between items-center p-3 bg-[#1f1f1f] rounded-md">
                          <div>
                            <p className="text-[#f5f5f5] font-medium">{cook.employee.name}</p>
                            <p className="text-[#ababab] text-sm">ID: {cook.employee.empid}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">{cook.activeOrders}</p>
                            <p className="text-[#ababab] text-sm">active orders</p>
                          </div>
                        </div>
                      ))}
                      {Object.keys(workloadData.data.cooks).length === 0 && (
                        <p className="text-[#ababab] text-center py-4">No active cooks</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Waiters Tab */}
          {activeTab === "waiters" && (
            <div className="space-y-6">
              {workingOrdersData?.data?.grouped?.waiters && Object.keys(workingOrdersData.data.grouped.waiters).length > 0 ? (
                Object.values(workingOrdersData.data.grouped.waiters).map((waiterData) => (
                  <div key={waiterData.employee._id} className="bg-[#262626] rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-[#333] flex justify-between items-center">
                      <div>
                        <h3 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
                          <FaConcierge className="text-blue-400" />
                          {waiterData.employee.name}
                        </h3>
                        <p className="text-[#ababab] text-sm">ID: {waiterData.employee.empid} • {waiterData.orders.length} active orders</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm">
                        Waiter
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#2f2f2f]">
                          <tr>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Order ID</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Customer</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Table</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Status</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Time</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Cook</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waiterData.orders.map((order) => (
                            <tr key={order._id} className="border-b border-[#333] hover:bg-[#333]">
                              <td className="px-4 py-3 text-[#f5f5f5] font-mono">
                                #{order._id.slice(-6)}
                              </td>
                              <td className="px-4 py-3 text-[#f5f5f5]">
                                {order.customerDetails.name}
                              </td>
                              <td className="px-4 py-3 text-[#f5f5f5]">
                                {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.orderStatus)}`}>
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#ababab]">
                                {formatTime(order.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                {order.assignedCook ? (
                                  <span className="text-orange-400">{order.assignedCook.name}</span>
                                ) : (
                                  <button
                                    onClick={() => handleAssignEmployee(order, "cook")}
                                    className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                  >
                                    Assign Cook
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#262626] p-8 rounded-lg text-center">
                  <FaConcierge className="text-4xl text-[#ababab] mx-auto mb-4" />
                  <p className="text-[#ababab]">No waiters with assigned orders</p>
                </div>
              )}
            </div>
          )}

          {/* Cooks Tab */}
          {activeTab === "cooks" && (
            <div className="space-y-6">
              {workingOrdersData?.data?.grouped?.cooks && Object.keys(workingOrdersData.data.grouped.cooks).length > 0 ? (
                Object.values(workingOrdersData.data.grouped.cooks).map((cookData) => (
                  <div key={cookData.employee._id} className="bg-[#262626] rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-[#333] flex justify-between items-center">
                      <div>
                        <h3 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
                          <FaUtensils className="text-orange-400" />
                          {cookData.employee.name}
                        </h3>
                        <p className="text-[#ababab] text-sm">ID: {cookData.employee.empid} • {cookData.orders.length} active orders</p>
                      </div>
                      <span className="px-3 py-1 bg-orange-900/30 text-orange-400 rounded-full text-sm">
                        Cook
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#2f2f2f]">
                          <tr>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Order ID</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Customer</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Table</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Status</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Time</th>
                            <th className="px-4 py-3 text-left text-[#f5f5f5]">Waiter</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cookData.orders.map((order) => (
                            <tr key={order._id} className="border-b border-[#333] hover:bg-[#333]">
                              <td className="px-4 py-3 text-[#f5f5f5] font-mono">
                                #{order._id.slice(-6)}
                              </td>
                              <td className="px-4 py-3 text-[#f5f5f5]">
                                {order.customerDetails.name}
                              </td>
                              <td className="px-4 py-3 text-[#f5f5f5]">
                                {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.orderStatus)}`}>
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#ababab]">
                                {formatTime(order.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                {order.assignedWaiter ? (
                                  <span className="text-blue-400">{order.assignedWaiter.name}</span>
                                ) : (
                                  <button
                                    onClick={() => handleAssignEmployee(order, "waiter")}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  >
                                    Assign Waiter
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#262626] p-8 rounded-lg text-center">
                  <FaUtensils className="text-4xl text-[#ababab] mx-auto mb-4" />
                  <p className="text-[#ababab]">No cooks with assigned orders</p>
                </div>
              )}
            </div>
          )}

          {/* Unassigned Orders Tab */}
          {activeTab === "unassigned" && (
            <div className="space-y-6">
              {/* Unassigned to Waiters */}
              <div className="bg-[#262626] rounded-lg overflow-hidden">
                <div className="p-4 border-b border-[#333]">
                  <h3 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
                    <FaConcierge className="text-blue-400" />
                    Orders Without Waiters
                  </h3>
                </div>
                
                {workingOrdersData?.data?.grouped?.unassigned?.waiter?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#2f2f2f]">
                        <tr>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Order ID</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Customer</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Table</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Status</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Time</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workingOrdersData.data.grouped.unassigned.waiter.map((order) => (
                          <tr key={order._id} className="border-b border-[#333] hover:bg-[#333]">
                            <td className="px-4 py-3 text-[#f5f5f5] font-mono">
                              #{order._id.slice(-6)}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {order.customerDetails.name}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#ababab]">
                              {formatTime(order.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleAssignEmployee(order, "waiter")}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Assign Waiter
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#ababab]">
                    All orders have waiters assigned
                  </div>
                )}
              </div>

              {/* Unassigned to Cooks */}
              <div className="bg-[#262626] rounded-lg overflow-hidden">
                <div className="p-4 border-b border-[#333]">
                  <h3 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
                    <FaUtensils className="text-orange-400" />
                    Orders Without Cooks
                  </h3>
                </div>
                
                {workingOrdersData?.data?.grouped?.unassigned?.cook?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#2f2f2f]">
                        <tr>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Order ID</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Customer</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Table</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Status</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Time</th>
                          <th className="px-4 py-3 text-left text-[#f5f5f5]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workingOrdersData.data.grouped.unassigned.cook.map((order) => (
                          <tr key={order._id} className="border-b border-[#333] hover:bg-[#333]">
                            <td className="px-4 py-3 text-[#f5f5f5] font-mono">
                              #{order._id.slice(-6)}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {order.customerDetails.name}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5]">
                              {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#ababab]">
                              {formatTime(order.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleAssignEmployee(order, "cook")}
                                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                              >
                                Assign Cook
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#ababab]">
                    All orders have cooks assigned
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
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
                Assign {assignmentType === "waiter" ? "Waiter" : "Cook"}
              </h2>
              
              {selectedOrder && (
                <div className="bg-[#1f1f1f] p-3 rounded-md mb-4">
                  <p className="text-[#f5f5f5] font-medium">
                    Order #{selectedOrder._id.slice(-6)}
                  </p>
                  <p className="text-[#ababab] text-sm">
                    {selectedOrder.customerDetails.name} • {selectedOrder.table ? `Table ${selectedOrder.table.tableNumber}` : 'Takeaway'}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-2 text-[#f5f5f5] mb-3"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {(assignmentType === "waiter" ? waiters : cooks).map((employee) => (
                  <motion.button
                    key={employee._id}
                    onClick={() => submitAssignment(employee._id)}
                    className="w-full text-left p-3 bg-[#333] hover:bg-[#3d3d3d] rounded-md transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-[#f5f5f5] font-medium">{employee.name}</p>
                    <p className="text-[#ababab] text-sm">ID: {employee.empid} • {employee.position}</p>
                  </motion.button>
                ))}
                
                {(assignmentType === "waiter" ? waiters : cooks).length === 0 && (
                  <p className="text-[#ababab] text-center py-4">
                    No {assignmentType}s found
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-[#333]">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-[#4a4a4a] text-[#f5f5f5] rounded-md hover:bg-[#5a5a5a]"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeWorking;
