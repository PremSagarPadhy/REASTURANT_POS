import React, { useState, useEffect, useRef } from "react";
import { MdOutlineInventory2, MdAdd, MdEdit, MdDelete, MdRefresh, MdAddCircleOutline } from "react-icons/md";
import { BiDetail, BiSearchAlt } from "react-icons/bi";
import { FiFilter } from "react-icons/fi";
import { TbArrowsSort } from "react-icons/tb";
import { Link } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";
import Spinner from "../shared/Spinner";
import ApexCharts from 'apexcharts';
import api from "../../api"; // Import your configured API client

// IMPORTANT FIX: Move API functions to a separate file or import them directly
// Don't define them inside the component file to avoid Fast Refresh issues

const InventoryMovementChart = ({ chartData, period }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Skip chart creation if the ref isn't available
    if (!chartRef.current) return;

    // Destructure data from props with fallbacks to prevent errors
    const labels = chartData?.labels || [];
    const restockData = chartData?.datasets?.[0]?.data || [];
    const usageData = chartData?.datasets?.[1]?.data || [];

    // Set up chart options
    const options = {
      series: [
        {
          name: "Restock",
          data: restockData,
          color: "#3B82F6", // Blue color for restock
        },
        {
          name: "Usage",
          data: usageData,
          color: "#7E3BF2", 
        },
      ],
      chart: {
        height: "70%",
        width: "100%",
        type: "area",
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        background: 'transparent',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        }
      },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            colors: "#6e6e6e",
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          }
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          show: true,
          position: 'back',
          stroke: {
            color: '#444',
            width: 1,
            dashArray: 5,
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#6e6e6e",
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          },
          formatter: function(val) {
            return val.toFixed(0);
          }
        },
        tickAmount: 6,
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        x: {
          show: true,
          format: 'MMM dd',
        },
        y: {
          formatter: function (value) {
            return value.toFixed(2) + " units";
          }
        },
        marker: {
          show: true,
        },
        fixed: {
          enabled: false,
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0.05,
          shadeIntensity: 1,
          stops: [0, 95, 100],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        labels: {
          colors: '#f5f5f5'
        },
        markers: {
          width: 8,
          height: 8,
          radius: 12,
        },
        itemMargin: {
          horizontal: 10,
        },
        offsetY: 0,
        offsetX: 10
      },
      grid: {
        show: true,
        borderColor: '#333',
        strokeDashArray: 5,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 10
        },
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          size: 5,
        }
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 280
            },
            legend: {
              position: 'bottom',
              offsetY: 0,
              offsetX: 0
            }
          }
        }
      ]
    };

    // Clean up previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create and render the chart
    try {
      const chart = new ApexCharts(chartRef.current, options);
      chartInstance.current = chart;
      chart.render();
    } catch (err) {
      console.error("Failed to create chart:", err);
    }

    // Clean up when component unmounts or before re-rendering
    return () => {
      // Safely destroy the chart instance if it exists
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
        } catch (err) {
          console.error("Error destroying chart:", err);
        }
        chartInstance.current = null;
      }
    };
  }, [chartData, period]);

  return (
    <div className="w-full h-64" ref={chartRef}></div>
  );
};

const Inventory = () => {
  // Fix 1: Check if showNotification exists and provide a fallback
  const notificationContext = useNotification() || {};
  const showNotification = notificationContext.showNotification || 
    ((type, title, message) => console.log(`${type}: ${title} - ${message}`));
  
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    categoryBreakdown: [],
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [chartTotals, setChartTotals] = useState({
    usage: 0,
    restock: 0,
    net: 0,
  });
  const [chartPeriod, setChartPeriod] = useState('7days');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemTransactions, setItemTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [categories, setCategories] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    unit: '',
    price: 0,
    minQuantity: 5,
    supplier: '',
    description: '',
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockData, setRestockData] = useState({
    itemId: null,
    quantity: 1,
    note: '',
  });
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [useData, setUseData] = useState({
    itemId: null,
    quantity: 1,
    note: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch inventory data
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/inventory');
      
      // Fix 3: Check if response.data is an array before using map
      if (Array.isArray(response.data)) {
        setInventory(response.data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(response.data.map(item => item.category))];
        setCategories(uniqueCategories);
      } else {
        console.error('Expected an array but got:', response.data);
        setInventory([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showNotification('error', 'Error', 'Failed to load inventory items');
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch inventory stats
  const fetchInventoryStats = async () => {
    try {
      const response = await api.get('/inventory/stats');
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      // Use default stats structure
    }
  };

  // Fetch chart data
  const fetchChartData = async (period = '7days') => {
    try {
      const response = await api.get(`/inventory/chart-data?period=${period}`);
      
      // Fix 4: Check if the expected data structure exists before accessing properties
      if (response.data && response.data.chartData && response.data.chartData.labels) {
        setChartData({
          labels: response.data.chartData.labels,
          datasets: [
            {
              label: 'Restock',
              data: response.data.chartData.restock || [],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
            },
            {
              label: 'Usage',
              data: response.data.chartData.usage || [],
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4,
            }
          ],
        });
        
        if (response.data.totals) {
          setChartTotals(response.data.totals);
        }
      } else {
        // Fallback for empty or incorrect data
        setChartData({
          labels: [],
          datasets: [
            {
              label: 'Restock',
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
            },
            {
              label: 'Usage',
              data: [],
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4,
            }
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Fetch item transactions
  const fetchItemTransactions = async (itemId) => {
    try {
      const response = await api.get(`/inventory/${itemId}/transactions`);
      setItemTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('error', 'Error', 'Failed to load transaction history');
      setItemTransactions([]);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchInventory();
    fetchInventoryStats();
    fetchChartData(chartPeriod);
  }, []);

  // Handle chart period change
  useEffect(() => {
    fetchChartData(chartPeriod);
  }, [chartPeriod]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedInventory = React.useMemo(() => {
    let sortableItems = [...inventory];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [inventory, sortConfig]);

  // Fix 2: Safe check for properties before calling toLowerCase()
  const filteredInventory = sortedInventory.filter(item => {
    // Safely check properties before accessing them
    const itemName = item.name || '';
    const itemSku = item.sku || '';
    const itemCategory = item.category || '';
    
    const matchesSearch = 
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      itemSku.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || itemCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // Handle form submissions
  const handleAddItem = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post('/inventory', newItem);
      showNotification('success', 'Success', 'Inventory item added successfully');
      setIsAddModalOpen(false);
      setNewItem({
        name: '',
        sku: '',
        category: '',
        quantity: 0,
        unit: '',
        price: 0,
        minQuantity: 5,
        supplier: '',
        description: '',
      });
      fetchInventory();
      fetchInventoryStats();
    } catch (error) {
      console.error('Error adding item:', error);
      showNotification('error', 'Error', error.response?.data?.message || 'Failed to add inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.put(`/inventory/${editItem._id}`, editItem);
      showNotification('success', 'Success', 'Inventory item updated successfully');
      setIsEditModalOpen(false);
      fetchInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      showNotification('error', 'Error', error.response?.data?.message || 'Failed to update inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestockItem = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post(`/inventory/${restockData.itemId}/restock`, {
        quantity: restockData.quantity,
        note: restockData.note
      });
      showNotification('success', 'Success', 'Item restocked successfully');
      setIsRestockModalOpen(false);
      fetchInventory();
      fetchInventoryStats();
      fetchChartData(chartPeriod);
    } catch (error) {
      console.error('Error restocking item:', error);
      showNotification('error', 'Error', error.response?.data?.message || 'Failed to restock item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseItem = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post(`/inventory/${useData.itemId}/use`, {
        quantity: useData.quantity,
        note: useData.note
      });
      showNotification('success', 'Success', 'Item usage recorded successfully');
      setIsUseModalOpen(false);
      fetchInventory();
      fetchInventoryStats();
      fetchChartData(chartPeriod);
    } catch (error) {
      console.error('Error using item:', error);
      showNotification('error', 'Error', error.response?.data?.message || 'Failed to record item usage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await api.delete(`/inventory/${itemId}`);
        showNotification('success', 'Success', 'Inventory item deleted successfully');
        fetchInventory();
        fetchInventoryStats();
      } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('error', 'Error', error.response?.data?.message || 'Failed to delete inventory item');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    fetchItemTransactions(item._id);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem({ ...item });
    setIsEditModalOpen(true);
  };

  const openRestockModal = (itemId) => {
    setRestockData({
      itemId,
      quantity: 1,
      note: ''
    });
    setIsRestockModalOpen(true);
  };

  const openUseModal = (itemId) => {
    setUseData({
      itemId,
      quantity: 1,
      note: ''
    });
    setIsUseModalOpen(true);
  };

  if (isLoading && inventory.length === 0) {
    return <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>;
  }

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 7rem)" }}>
      <div className="absolute inset-0 overflow-y-auto custom-scrollbar-hidden pb-8">
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center text-[#f5f5f5]">
              <MdOutlineInventory2 className="mr-2" size={28} />
              Inventory Management
            </h1>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#025cca] hover:bg-[#0273fa] text-[#f5f5f5] py-2 px-4 rounded-md flex items-center transition-all duration-300 transform hover:scale-105"
              >
                <MdAdd className="mr-2" size={20} />
                Add New Item
              </button>
              <button
                onClick={() => {
                  fetchInventory();
                  fetchInventoryStats();
                  fetchChartData(chartPeriod);
                  showNotification(
                    "info",
                    "Refreshing",
                    "Updating inventory data..."
                  );
                }}
                className="bg-[#333] hover:bg-[#444] text-[#f5f5f5] py-2 px-4 rounded-md flex items-center transition-all duration-300 transform hover:scale-105 border border-[#4a4a4a]"
              >
                <MdRefresh className="mr-2" size={20} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#262626] rounded-lg shadow-md p-4 border-l-4 border-[#025cca]">
              <p className="text-[#ababab] text-sm">Total Items</p>
              <p className="text-2xl font-bold text-[#f5f5f5]">
                {stats.totalItems}
              </p>
            </div>
            <div className="bg-[#262626] rounded-lg shadow-md p-4 border-l-4 border-red-500">
              <p className="text-[#ababab] text-sm">Low Stock Items</p>
              <p className="text-2xl font-bold text-[#f5f5f5]">
                {stats.lowStockItems}
              </p>
            </div>
            <div className="bg-[#262626] rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <p className="text-[#ababab] text-sm">Inventory Value</p>
              <p className="text-2xl font-bold text-[#f5f5f5]">
                ₹ {stats.totalValue?.toFixed(2) || 0}
              </p>
            </div>
            <div className="bg-[#262626] rounded-lg shadow-md p-4 border-l-4 border-purple-500">
              <p className="text-[#ababab] text-sm">Categories</p>
              <p className="text-2xl font-bold text-[#f5f5f5]">
                {categories.length}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-[#262626] rounded-lg shadow-md p-4 mb-6 border border-[#4a4a4a]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-[#f5f5f5]">
                Inventory Movement
              </h2>
              <div className="flex space-x-2">
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="bg-[#333] border border-[#4a4a4a] rounded-md px-3 py-1 text-sm text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                >
                  <option value="7days" className="bg-[#333] text-[#f5f5f5]">
                    Last 7 Days
                  </option>
                  <option value="30days" className="bg-[#333] text-[#f5f5f5]">
                    Last 30 Days
                  </option>
                  <option value="90days" className="bg-[#333] text-[#f5f5f5]">
                    Last 90 Days
                  </option>
                </select>
              </div>
            </div>

            {/* Replace the existing Line chart with the new component */}
            <InventoryMovementChart
              chartData={chartData}
              period={chartPeriod}
            />

            {/* Movement statistics cards */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-2 bg-[#333] rounded border border-green-700">
                <p className="text-sm text-[#ababab]">Total Restock</p>
                <p className="font-semibold text-[#f5f5f5]">
                  {chartTotals.restock?.toFixed(2) || 0}
                </p>
              </div>
              <div className="text-center p-2 bg-[#333] rounded border border-red-700">
                <p className="text-sm text-[#ababab]">Total Usage</p>
                <p className="font-semibold text-[#f5f5f5]">
                  {chartTotals.usage?.toFixed(2) || 0}
                </p>
              </div>
              <div className="text-center p-2 bg-[#333] rounded border border-[#025cca]">
                <p className="text-sm text-[#ababab]">Net Change</p>
                <p className="font-semibold text-[#f5f5f5]">
                  {chartTotals.net?.toFixed(2) || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-[#262626] rounded-lg shadow-md p-4 mb-6 border border-[#4a4a4a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-grow max-w-md">
                <input
                  type="text"
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#333] border border-[#4a4a4a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#025cca] text-[#f5f5f5]"
                />
                <BiSearchAlt
                  className="absolute left-3 top-2.5 text-[#ababab]"
                  size={20}
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <FiFilter
                    className="absolute left-3 top-2.5 text-[#ababab]"
                    size={16}
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[#333] border border-[#4a4a4a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#025cca] text-[#f5f5f5]"
                  >
                    <option value="all" className="bg-[#333] text-[#f5f5f5]">
                      All Categories
                    </option>
                    {categories.map((category, index) => (
                      <option
                        key={index}
                        value={category}
                        className="bg-[#333] text-[#f5f5f5]"
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-[#262626] rounded-lg shadow-md overflow-hidden border border-[#4a4a4a]">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-[#333]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center focus:outline-none"
                      >
                        Item
                        <TbArrowsSort className="ml-1" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("category")}
                        className="flex items-center focus:outline-none"
                      >
                        Category
                        <TbArrowsSort className="ml-1" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("quantity")}
                        className="flex items-center focus:outline-none"
                      >
                        Quantity
                        <TbArrowsSort className="ml-1" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("price")}
                        className="flex items-center focus:outline-none"
                      >
                        Price
                        <TbArrowsSort className="ml-1" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#ababab] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#444] bg-[#262626] text-[#f5f5f5]">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-[#333] transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#f5f5f5]">
                            {item.name}
                          </div>
                          <div className="text-xs text-[#ababab]">
                            {item.sku || "No SKU"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#025cca] bg-opacity-20 text-[#025cca]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#f5f5f5]">
                            {item.quantity} {item.unit}
                          </div>
                          <div className="text-xs text-[#ababab]">
                            Min: {item.minQuantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5]">
                          ₹ {item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.quantity <= item.minQuantity ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-400">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-400">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openItemModal(item)}
                            className="text-[#025cca] hover:text-[#0273fa] p-1"
                          >
                            <BiDetail size={18} />
                          </button>
                          <button
                            onClick={() => openRestockModal(item._id)}
                            className="text-green-400 hover:text-green-300 p-1"
                          >
                            <MdAddCircleOutline size={18} />
                          </button>
                          <button
                            onClick={() => openUseModal(item._id)}
                            className="text-orange-400 hover:text-orange-300 p-1"
                          >
                            <MdOutlineInventory2 size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-[#025cca] hover:text-[#0273fa] p-1"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <MdDelete size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-[#ababab]"
                      >
                        No inventory items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredInventory.length > itemsPerPage && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-[#444]">
                <div className="flex-1 flex justify-between items-center">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-[#4a4a4a] text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "bg-[#333] text-[#666] cursor-not-allowed"
                        : "bg-[#333] text-[#f5f5f5] hover:bg-[#444]"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#ababab]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-[#4a4a4a] text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? "bg-[#333] text-[#666] cursor-not-allowed"
                        : "bg-[#333] text-[#f5f5f5] hover:bg-[#444]"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Item Details Modal */}
          {isModalOpen && selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-[#262626] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#4a4a4a]">
                <div className="border-b border-[#444] px-6 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[#f5f5f5]">
                    {selectedItem.name} Details
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-[#ababab] hover:text-[#f5f5f5] focus:outline-none"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Item Information */}
                    <div>
                      <h4 className="font-medium mb-2 text-[#f5f5f5]">
                        Item Information
                      </h4>
                      {/* Split into 2 columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#ababab]">
                        {/* Left Side */}
                        <div className="space-y-2">
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              Name:
                            </span>{" "}
                            {selectedItem.name}
                          </p>
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              SKU:
                            </span>{" "}
                            {selectedItem.sku || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              Category:
                            </span>{" "}
                            {selectedItem.category}
                          </p>
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              Quantity:
                            </span>{" "}
                            {selectedItem.quantity} {selectedItem.unit}
                          </p>
                        </div>
                        {/* Right Side */}
                        <div className="space-y-2">
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              Min Quantity:
                            </span>{" "}
                            {selectedItem.minQuantity} {selectedItem.unit}
                          </p>
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              Price:
                            </span>{" "}
                            ₹ {selectedItem.price.toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              Supplier:
                            </span>{" "}
                            {selectedItem.supplier || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium text-[#f5f5f5]">
                              Description:
                            </span>{" "}
                            {selectedItem.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Transaction History */}
                    <div>
                      <h4 className="font-medium mb-2 text-[#f5f5f5]">
                        Transaction History
                      </h4>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-[#444]">
                          <thead className="bg-[#333]">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                                Note
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-[#2a2a2a] divide-y divide-[#444]">
                            {itemTransactions.length > 0 ? (
                              itemTransactions.map((transaction, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        transaction.type === "restock"
                                          ? "bg-green-900 text-green-400"
                                          : "bg-red-900 text-red-400"
                                      }`}
                                    >
                                      {transaction.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-[#f5f5f5]">
                                    {transaction.quantity}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-[#f5f5f5]">
                                    {new Date(
                                      transaction.date
                                    ).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-[#f5f5f5]">
                                    {transaction.note || "N/A"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="px-4 py-2 text-center text-sm text-[#ababab]"
                                >
                                  No transactions found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  {/* Close Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="bg-[#444] text-[#f5f5f5] px-4 py-2 rounded-md hover:bg-[#555] mr-2 border border-[#4a4a4a]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Use Modal - Fixed Quantity Input */}
          {isUseModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#262626] rounded-lg shadow-xl w-full max-w-md">
                <div className="border-b border-[#444] px-6 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[#f5f5f5]">
                    Record Item Usage
                  </h3>
                  <button
                    onClick={() => setIsUseModalOpen(false)}
                    className="text-[#ababab] hover:text-[#f5f5f5] focus:outline-none"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleUseItem} className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Quantity to Use
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={useData.quantity || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value);
                        setUseData({ ...useData, quantity: value });
                      }}
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Note (Optional)
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Usage details..."
                      value={useData.note}
                      onChange={(e) =>
                        setUseData({ ...useData, note: e.target.value })
                      }
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>
                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => setIsUseModalOpen(false)}
                      className="bg-[#4a4a4a] text-[#f5f5f5] px-4 py-2 rounded-md hover:bg-[#5a5a5a] mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                    >
                      Record Usage
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Item Modal - Fixed Quantity Input */}
          {isEditModalOpen && editItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#262626] rounded-lg shadow-xl w-full max-w-2xl">
                <div className="border-b border-[#444] px-6 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[#f5f5f5]">
                    Edit Item: {editItem.name}
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-[#ababab] hover:text-[#f5f5f5] focus:outline-none"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleEditItem} className="p-6">
                  {/* Text fields remain the same */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editItem.name}
                        onChange={(e) =>
                          setEditItem({ ...editItem, name: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        SKU (Optional)
                      </label>
                      <input
                        type="text"
                        value={editItem.sku || ""}
                        onChange={(e) =>
                          setEditItem({ ...editItem, sku: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Category
                      </label>
                      <input
                        type="text"
                        required
                        list="edit-categories"
                        value={editItem.category}
                        onChange={(e) =>
                          setEditItem({ ...editItem, category: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                      <datalist id="edit-categories">
                        {categories.map((category, index) => (
                          <option key={index} value={category} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Unit
                      </label>
                      <input
                        type="text"
                        required
                        value={editItem.unit}
                        onChange={(e) =>
                          setEditItem({ ...editItem, unit: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                  </div>

                  {/* Number inputs with fixed handling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Price
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={editItem.price || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setEditItem({ ...editItem, price: value });
                        }}
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Min Quantity
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={editItem.minQuantity || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setEditItem({ ...editItem, minQuantity: value });
                        }}
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Supplier (Optional)
                    </label>
                    <input
                      type="text"
                      value={editItem.supplier || ""}
                      onChange={(e) =>
                        setEditItem({ ...editItem, supplier: e.target.value })
                      }
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Description (Optional)
                    </label>
                    <textarea
                      rows="3"
                      value={editItem.description || ""}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="bg-[#4a4a4a] text-[#f5f5f5] px-4 py-2 rounded-md hover:bg-[#5a5a5a] mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#025cca] text-[#f5f5f5] px-4 py-2 rounded-md hover:bg-[#0273fa]"
                    >
                      Update Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Restock Modal - Fixed Quantity Input */}
          {isRestockModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#262626] rounded-lg shadow-xl w-full max-w-md">
                <div className="border-b border-[#444] px-6 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[#f5f5f5]">
                    Restock Item
                  </h3>
                  <button
                    onClick={() => setIsRestockModalOpen(false)}
                    className="text-[#ababab] hover:text-[#f5f5f5] focus:outline-none"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleRestockItem} className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Quantity to Add
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={restockData.quantity || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value);
                        setRestockData({ ...restockData, quantity: value });
                      }}
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Note (Optional)
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Restock details..."
                      value={restockData.note}
                      onChange={(e) =>
                        setRestockData({ ...restockData, note: e.target.value })
                      }
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>
                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => setIsRestockModalOpen(false)}
                      className="bg-[#4a4a4a] text-[#f5f5f5] px-4 py-2 rounded-md hover:bg-[#5a5a5a] mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Restock
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Item Modal - Fixed Quantity Input */}
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#262626] rounded-lg shadow-xl w-full max-w-2xl">
                <div className="border-b border-[#444] px-6 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[#f5f5f5]">
                    Add New Inventory Item
                  </h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-[#ababab] hover:text-[#f5f5f5] focus:outline-none"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleAddItem} className="p-6">
                  {/* Text fields remain the same */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        SKU (Optional)
                      </label>
                      <input
                        type="text"
                        value={newItem.sku}
                        onChange={(e) =>
                          setNewItem({ ...newItem, sku: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Category
                      </label>
                      <input
                        type="text"
                        required
                        list="categories"
                        value={newItem.category}
                        onChange={(e) =>
                          setNewItem({ ...newItem, category: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                      <datalist id="categories">
                        {categories.map((category, index) => (
                          <option key={index} value={category} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Unit
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="kg, pcs, bottles, etc."
                        value={newItem.unit}
                        onChange={(e) =>
                          setNewItem({ ...newItem, unit: e.target.value })
                        }
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                  </div>

                  {/* Number inputs with fixed handling */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Quantity
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newItem.quantity || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setNewItem({ ...newItem, quantity: value });
                        }}
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Price
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newItem.price || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setNewItem({ ...newItem, price: value });
                        }}
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#f5f5f5]">
                        Min Quantity
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newItem.minQuantity || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setNewItem({ ...newItem, minQuantity: value });
                        }}
                        className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Supplier (Optional)
                    </label>
                    <input
                      type="text"
                      value={newItem.supplier}
                      onChange={(e) =>
                        setNewItem({ ...newItem, supplier: e.target.value })
                      }
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#f5f5f5]">
                      Description (Optional)
                    </label>
                    <textarea
                      rows="3"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      className="mt-1 block w-full bg-[#333] text-[#f5f5f5] border border-[#4a4a4a] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#025cca]"
                    />
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="bg-[#4a4a4a] text-[#f5f5f5] px-4 py-2 rounded-md hover:bg-[#5a5a5a] mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#025cca] text-[#f5f5f5] px-4 py-2 rounded-md hover:bg-[#0273fa]"
                    >
                      Add Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;