import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Chart from "react-apexcharts";
import ReactApexChart from "react-apexcharts";
import {
  getOrders,
  getTables,
  getInventoryItems,
  getCategories
} from "../../https";
import RadialChart from "./RadialChart";
import { metricsData, itemsData } from "../../constants";

const API_URL = 'https://reasturant-pos-backend.onrender.com/api';

const Analytics = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("last7days");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Add state for data fetching
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get today's date in local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  // Add date range state
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    
    // Format dates in local timezone
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
    };
  });
  const [isDateRangeActive, setIsDateRangeActive] = useState(false);
  
  // Add new state variables for the integrated charts
  const [dailyEarnings, setDailyEarnings] = useState({
    todayEarnings: 0,
    yesterdayEarnings: 0,
  });
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [dailyEarningsRange, setDailyEarningsRange] = useState("last7days");
  const [dailyEarningsData, setDailyEarningsData] = useState({
    labels: [],
    displayLabels: [],
    values: [],
    percentageChange: 0,
  });
  const [integratedDailyEarningsChart, setIntegratedDailyEarningsChart] = useState({
    series: [
      {
        name: "Daily Earnings",
        data: [],
        color: "#3B82F6",
      },
    ],
    options: {
      chart: {
        height: 200,
        type: "area",
        fontFamily: "Inter, sans-serif",
        sparkline: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 16,
          right: 16,
          top: 0,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
        colors: ['#3B82F6'],
        hover: {
          width: 3
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
        },
      },
      xaxis: {
        categories: [],
        labels: {
          show: false, 
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            return "₹" + value.toFixed(0);
          },
          style: {
            colors: "#1f1f1f",
          },
        },
      },
      tooltip: {
        enabled: true,
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const dateStr = w.globals.categoryLabels[dataPointIndex];
          const value = series[seriesIndex][dataPointIndex];
          const displayDate = dailyEarningsData.displayLabels[dataPointIndex];
          let formattedDate;
          
          try {
            const dateObj = new Date(dateStr);
            
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
            } else {
              const currentYear = new Date().getFullYear();
              formattedDate = `${displayDate}, ${currentYear}`;
            }
          } catch (e) {
            const currentYear = new Date().getFullYear();
            formattedDate = `${displayDate}, ${currentYear}`;
          }
          
          return `
            <div class="chart-tooltip py-2 px-3">
              <div class="text-center text-gray-400 mb-2">${formattedDate}</div>
              <div class="flex items-center">
                <span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                <span>Daily Earnings: ₹${(value || 0).toFixed(2)}</span>
              </div>
            </div>
          `;
        },
        theme: "dark",
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        },
        background: {
          color: '#1f2937',
          borderRadius: 4,
          opacity: 0.9,
        },
        fixed: {
          enabled: false
        },
        x: {
          show: false
        },
        y: {
          title: {
            formatter: function() {
              return '';
            }
          },
        },
        marker: {
          show: true
        },
        onDatasetHover: {
          highlightDataSeries: true,
        }
      },
    },
  });

  // Add new function to fetch total earnings (copied from Payments)
  const fetchTotalEarnings = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/payment/total-earnings`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setTotalEarnings(response.data.totalEarnings);
      }
    } catch (error) {
      console.error("Error fetching total earnings:", error);
      setError("Failed to fetch total earnings data");
    }
  };

  const fetchDailyEarnings = async () => {
    try {
      console.log("Fetching daily earnings for date:", selectedDate);
      const response = await axios.get(
        `${API_URL}/payment/daily-earnings?date=${selectedDate}`,
        { withCredentials: true }
      );

      console.log("Daily earnings response:", response.data);

      if (response.data.success) {
        const { todayEarnings, yesterdayEarnings } = response.data;

        console.log("Today's earnings:", todayEarnings, "Type:", typeof todayEarnings);
        console.log("Yesterday's earnings:", yesterdayEarnings, "Type:", typeof yesterdayEarnings);

        // Ensure values are numbers
        const todayEarningsNum = Number(todayEarnings) || 0;
        const yesterdayEarningsNum = Number(yesterdayEarnings) || 0;

        console.log("Converted - Today's earnings:", todayEarningsNum);
        console.log("Converted - Yesterday's earnings:", yesterdayEarningsNum);

        const change =
          yesterdayEarningsNum > 0
            ? ((todayEarningsNum - yesterdayEarningsNum) / yesterdayEarningsNum) * 100
            : todayEarningsNum > 0
            ? 100
            : 0;

        console.log("Percentage change:", change);

        setDailyEarnings(prevState => {
          // Only update if the values are actually different
          if (prevState.todayEarnings !== todayEarningsNum || prevState.yesterdayEarnings !== yesterdayEarningsNum) {
            console.log("Updating dailyEarnings state from:", prevState, "to:", {
              todayEarnings: todayEarningsNum,
              yesterdayEarnings: yesterdayEarningsNum,
            });
            return {
              todayEarnings: todayEarningsNum,
              yesterdayEarnings: yesterdayEarningsNum,
            };
          }
          console.log("Skipping dailyEarnings update - values unchanged");
          return prevState;
        });
        setPercentageChange(change);

        console.log("Daily earnings state updated:", {
          todayEarnings: todayEarningsNum,
          yesterdayEarnings: yesterdayEarningsNum,
        });

        // Remove the incorrect reference to setEarningsData
        // Instead, we'll update the chart directly if needed
      }
    } catch (error) {
      console.error("Error fetching daily earnings:", error);
      setError("Failed to fetch earnings data");
    }
  };

  // Updated fetchDailyEarningsByRange function with proper date display (copied from Payments)
const fetchDailyEarningsByRange = async (range = "last7days") => {
    try {
      console.log("Fetching earnings for range:", range);
      const response = await axios.get(
        `${API_URL}/payment/daily-earnings-range?range=${range}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const { dates: backendDates, earnings } = response.data;
        
        console.log("Raw backend dates:", backendDates);
        console.log("Raw backend earnings:", earnings);
        
        // Add debugging to check date issues
        debugBackendData(backendDates, earnings);
        
        // Create a direct mapping from backend dates to their earnings
        const directDateMap = {};
        
        // First, map the backend data directly
        for (let i = 0; i < backendDates.length; i++) {
          directDateMap[backendDates[i]] = earnings[i] || 0;
        }
        
        // Make sure today's date is included and visible in the debug logs
        const today = (() => {
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })();
        console.log("Today's date mapping:", today, "->", directDateMap[today] || "not found");
        
        // Now calculate the date range we need to display
        let startDate, endDate;
        const todayDate = new Date();
        // Don't set hours to avoid timezone issues - work with date objects directly
        
        switch(range) {
          case "today":
            startDate = new Date(todayDate);
            endDate = new Date(todayDate);
            break;
          case "yesterday":
            startDate = new Date(todayDate);
            startDate.setDate(startDate.getDate() - 1);
            endDate = new Date(startDate);
            break;
          case "last7days":
            startDate = new Date(todayDate);
            startDate.setDate(startDate.getDate() - 6); // 6 days back + today = 7 days
            endDate = new Date(todayDate);
            break;
          case "last30days":
            startDate = new Date(todayDate);
            startDate.setDate(startDate.getDate() - 29);
            endDate = new Date(todayDate);
            break;
          case "last90days":
            startDate = new Date(todayDate);
            startDate.setDate(startDate.getDate() - 89);
            endDate = new Date(todayDate);
            break;
          default:
            startDate = new Date(todayDate);
            startDate.setDate(startDate.getDate() - 6); // default to 7 days
            endDate = new Date(todayDate);
        }
        
        // Helper function to format date in local timezone
        const formatLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        // Generate all dates in the range with correct formatting
        const sortedDates = [];
        const sortedDisplayDates = [];
        const sortedEarnings = [];
        
        // Create a new Date object to iterate through the range
        const currentDate = new Date(startDate);
        
        // Loop through each date in the range
        while (currentDate <= endDate) {
          // Format the date as YYYY-MM-DD for comparison with backend data using local timezone
          const dateStr = formatLocalDate(currentDate);
          
          // Format the date for display
          const displayDate = currentDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
          });
          
          sortedDates.push(dateStr);
          sortedDisplayDates.push(displayDate);
          
          // Get the earnings for this date from our map, or use 0 if no data
          sortedEarnings.push(directDateMap[dateStr] || 0);
          
          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log("Processed dates:", sortedDates);
        console.log("Formatted display dates:", sortedDisplayDates);
        console.log("Processed earnings:", sortedEarnings);

        // Calculate percentage change
        let percentageChange = 0;
        if (sortedEarnings.length >= 2) {
          const latestDayEarnings = sortedEarnings[sortedEarnings.length - 1];
          const previousDayEarnings = sortedEarnings[sortedEarnings.length - 2];
          
          if (previousDayEarnings > 0) {
            percentageChange = ((latestDayEarnings - previousDayEarnings) / previousDayEarnings) * 100;
          } else if (latestDayEarnings > 0) {
            percentageChange = 100;
          }
        }

        // Update state with the processed data
        setDailyEarningsData({
          labels: sortedDates,
          displayLabels: sortedDisplayDates,
          values: sortedEarnings,
          percentageChange: percentageChange,
        });

        // Update the chart with new data
        setIntegratedDailyEarningsChart((prev) => ({
          ...prev,
          series: [
            {
              ...prev.series[0],
              data: sortedEarnings,
            },
          ],
          options: {
            ...prev.options,
            xaxis: {
              ...prev.options.xaxis,
              categories: sortedDates,
              labels: {
                show: true,
                formatter: function(value) {
                  // Find the index of this value in the sorted dates
                  const idx = sortedDates.indexOf(value);
                  // Return the corresponding display date
                  return idx >= 0 ? sortedDisplayDates[idx] : '';
                },
                style: {
                  colors: '#9ca3af',
                  fontSize: '10px',
                }
              }
            }
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching daily earnings range:", error);
      setError("Failed to fetch daily earnings data");
    }
  };

  // Fetch payments function (copied exactly from Payments)
  const fetchPayments = async () => {
    try {
      let response;

      if (isDateRangeActive) {
        response = await axios.get(
          `${API_URL}/payment/range?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          { withCredentials: true }
        );
      } else {
        response = await axios.get(
          showAllPayments
            ? `${API_URL}/payment/all`
            : `${API_URL}/payment?date=${selectedDate}`,
          { withCredentials: true }
        );
      }

      if (response.data.success) {
        setPayments(response.data.payments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to fetch payment data");
    }
  };

  // Fetch other data
  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      if (response?.data?.data) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await getTables();
      if (response?.data?.data) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response?.data?.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await getInventoryItems();
      if (response?.data) {
        setInventory(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventory([]);
    }
  };

  // Add dropdown refs for integrated charts
  const dropdownRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const [isDropdownHovering, setIsDropdownHovering] = useState(false);

  const [realtimeStats, setRealtimeStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    totalTables: 0,
    availableTables: 0,
    bookedTables: 0,
    totalCategories: 0,
    totalItems: 0,
    lowStockItems: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    revenueGrowth: 0,
  });
  const [orderStats, setOrderStats] = useState({
    inProgress: 0,
    ready: 0,
    completed: 0,
    total: 0,
  });
  const [dailyEarningsChart, setDailyEarningsChart] = useState({
    series: [{
      name: "Daily Revenue",
      data: [],
      color: "#3B82F6",
    }],
    options: {
      chart: {
        height: 350,
        type: "area",
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false },
        background: "transparent",
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
      },
      theme: { mode: "dark" },
      grid: {
        show: true,
        strokeDashArray: 4,
        borderColor: '#4a4a4a',
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 3,
        colors: ['#3B82F6'],
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
        },
      },
      xaxis: {
        categories: [],
        labels: {
          style: { colors: "#ababab" },
        },
        axisBorder: { color: "#4a4a4a" },
      },
      yaxis: {
        labels: {
          formatter: (value) => `₹${value.toLocaleString()}`,
          style: { colors: "#ababab" },
        },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (value) => `₹${value.toLocaleString()}`,
        },
      },
    },
  });
  const [orderStatusChart, setOrderStatusChart] = useState({
    series: [],
    options: {
      chart: {
        type: "donut",
        height: 300,
        background: "transparent",
      },
      theme: { mode: "dark" },
      colors: ["#f6b100", "#02ca3a", "#025cca"],
      labels: ["In Progress", "Ready", "Completed"],
      legend: {
        position: "bottom",
        labels: { colors: "#f5f5f5" },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (value) => `${value} orders`,
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total Orders",
                color: "#f5f5f5",
                formatter: () => orderStats.total,
              },
            },
          },
        },
      },
    },
  });

  // Add this function to your component
  const debugDates = () => {
    console.log("=== DEBUG DATES ===");
    console.log("Selected date:", selectedDate);
    console.log("Date range:", dateRange);
    console.log("Is date range active:", isDateRangeActive);
    console.log("Daily earnings range:", dailyEarningsRange);
  };

  // Add this function to help debug date issues
  const debugDate = (dateString) => {
    console.log(`Debug date: ${dateString}`);
    const date = new Date(dateString);
    console.log(`  Original: ${dateString}`);
    console.log(`  Date object: ${date}`);
    console.log(`  ISO string: ${date.toISOString()}`);
    console.log(`  Local date string: ${date.toLocaleDateString()}`);
    console.log(`  Formatted (YYYY-MM-DD): ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  // Add this debugger function to help identify data issues
  const debugBackendData = (backendDates, earnings) => {
    console.log("=== DEBUG BACKEND DATA ===");
    const today = new Date().toISOString().split('T')[0];
    console.log("Today's date (ISO format):", today);
    console.log("Does backend include today?", backendDates.includes(today));
    
    // Check if any dates correspond to today
    backendDates.forEach((date, index) => {
      if (date === today) {
        console.log(`Found today at index ${index} with earnings: ${earnings[index]}`);
      }
    });
    
    // Check if the date formatting is consistent
    console.log("Backend date formats:");
    backendDates.forEach(date => {
      console.log(`${date} -> type: ${typeof date}`);
    });
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPayments(),
          fetchOrders(),
          fetchTables(),
          fetchCategories(),
          fetchInventory(),
          fetchTotalEarnings(),
          fetchDailyEarnings()
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    
    // Set up interval for real-time updates  
    const interval = setInterval(() => {
      fetchOrders();
      fetchTables();
      // Only fetch daily earnings every other interval to reduce conflicts
      if (Date.now() % 60000 < 30000) { // Every minute, not every 30 seconds
        fetchDailyEarnings();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedDate, isDateRangeActive, dateRange]);

  // Fetch daily earnings range when range changes
  useEffect(() => {
    fetchDailyEarningsByRange(dailyEarningsRange);
  }, [dailyEarningsRange]);

  // Create daily earnings chart data using payment data
  const generateDailyEarningsChart = (payments, period) => {
    if (!payments || !payments.length) {
      return { values: [], labels: [], displayLabels: [], percentageChange: 0 };
    }

    const days = period === "last7days" ? 7 : period === "last30days" ? 30 : period === "last3months" ? 90 : period === "last6months" ? 180 : 7;
    const today = new Date();
    const chartData = [];
    const labels = [];
    const displayLabels = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.createdAt).toISOString().split('T')[0];
        return paymentDate === dateStr && payment.status === 'completed';
      });
      
      const dayRevenue = dayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      chartData.push(dayRevenue);
      labels.push(dateStr);
      
      if (period === "last7days" || period === "last30days") {
        displayLabels.push(date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }));
      } else {
        displayLabels.push(date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }));
      }
    }

    // Calculate percentage change
    let percentageChange = 0;
    if (chartData.length >= 2) {
      const current = chartData[chartData.length - 1] || 0;
      const previous = chartData[chartData.length - 2] || 0;
      if (previous > 0) {
        percentageChange = ((current - previous) / previous) * 100;
      }
    }

    return { values: chartData, labels, displayLabels, percentageChange };
  };

  // Fallback function to generate chart data from orders when payment data is not available
  const generateDailyEarningsChartFromOrders = (orders, period) => {
    if (!orders || !orders.length) {
      return { values: [], labels: [], displayLabels: [], percentageChange: 0 };
    }

    const days = period === "last7days" ? 7 : period === "last30days" ? 30 : period === "last3months" ? 90 : period === "last6months" ? 180 : 7;
    const today = new Date();
    const chartData = [];
    const labels = [];
    const displayLabels = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === dateStr;
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      chartData.push(dayRevenue);
      labels.push(dateStr);
      
      if (period === "last7days" || period === "last30days") {
        displayLabels.push(date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }));
      } else {
        displayLabels.push(date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }));
      }
    }

    // Calculate percentage change
    let percentageChange = 0;
    if (chartData.length >= 2) {
      const current = chartData[chartData.length - 1] || 0;
      const previous = chartData[chartData.length - 2] || 0;
      if (previous > 0) {
        percentageChange = ((current - previous) / previous) * 100;
      }
    }

    return { values: chartData, labels, displayLabels, percentageChange };
  };

  // Add functions for integrated charts dropdown
  const showDropdown = () => {
    if (dropdownRef.current) {
      dropdownRef.current.classList.remove("hidden");
    }
  };
  
  const hideDropdown = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      if (dropdownRef.current && !isDropdownHovering) {
        dropdownRef.current.classList.add("hidden");
      }
    }, 300);
  };

  const cancelHideDropdown = () => {
    setIsDropdownHovering(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const allowHideDropdown = () => {
    setIsDropdownHovering(false);
    hideDropdown();
  };

  const handleRangeSelection = (range) => {
    hideDropdown();
    handleChartRangeChange(range);
  };

  const handleChartRangeChange = async (newRange) => {
    try {
      setDailyEarningsRange(newRange);
      await fetchDailyEarningsByRange(newRange);
    } catch (error) {
      console.error("Error changing chart range:", error);
    }
  };

  // Calculate real-time statistics
  useEffect(() => {
    if (orders.length > 0 && tables.length > 0) {
      // Use payment data if available, otherwise fall back to order data
      let usePaymentData = payments.length > 0;
      
      // Handle inventory data
      const inventoryItems = inventory || [];

      // Calculate order statistics
      const orderStatistics = orders.reduce(
        (acc, order) => {
          acc.total++;
          if (order.orderStatus === "In Progress") acc.inProgress++;
          else if (order.orderStatus === "Ready") acc.ready++;
          else if (order.orderStatus === "Completed") acc.completed++;
          return acc;
        },
        { inProgress: 0, ready: 0, completed: 0, total: 0 }
      );

      // Calculate revenue - use payment data if available, otherwise order data
      let totalRevenue, avgOrderValue, completedPayments;
      
      if (usePaymentData) {
        completedPayments = payments.filter(payment => payment.status === 'completed');
        totalRevenue = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        avgOrderValue = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;
      } else {
        // Fallback to order data
        totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        completedPayments = orders.filter(order => order.orderStatus === 'Completed');
      }

      // Calculate table statistics
      const availableTables = tables.filter(table => table.status === "Available").length;
      const bookedTables = tables.filter(table => table.status === "Booked").length;

      // Calculate inventory statistics
      const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minQuantity).length;

      // Calculate today's and yesterday's revenue
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let todayRevenue, yesterdayRevenue;
      
      if (usePaymentData) {
        const todayPayments = completedPayments.filter(payment => 
          new Date(payment.createdAt).toISOString().split('T')[0] === today
        );
        const yesterdayPayments = completedPayments.filter(payment => 
          new Date(payment.createdAt).toISOString().split('T')[0] === yesterday
        );
        
        todayRevenue = todayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        yesterdayRevenue = yesterdayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      } else {
        // Fallback to order data
        const todayOrders = orders.filter(order => 
          new Date(order.createdAt).toISOString().split('T')[0] === today
        );
        const yesterdayOrders = orders.filter(order => 
          new Date(order.createdAt).toISOString().split('T')[0] === yesterday
        );
        
        todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      }
      
      const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

      // Don't update dailyEarnings here as it's handled by fetchDailyEarnings API
      // setDailyEarnings({
      //   todayEarnings: todayRevenue,
      //   yesterdayEarnings: yesterdayRevenue,
      // });
      // setPercentageChange(revenueGrowth);

      // Count total menu items
      const totalItems = categories.reduce((sum, category) => sum + (category.items?.length || 0), 0);

      setRealtimeStats({
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue,
        totalCustomers: new Set(orders.map(order => order.customerDetails?.name).filter(Boolean)).size,
        totalTables: tables.length,
        availableTables,
        bookedTables,
        totalCategories: categories.length,
        totalItems,
        lowStockItems,
        todayRevenue,
        yesterdayRevenue,
        revenueGrowth,
      });

      setOrderStats(orderStatistics);
      setOrderStatusChart(prev => ({
        ...prev,
        series: [orderStatistics.inProgress, orderStatistics.ready, orderStatistics.completed],
      }));

      // Update daily earnings chart with appropriate data
      const originalChartData = usePaymentData ? 
        generateDailyEarningsChart(payments, selectedTimePeriod) :
        generateDailyEarningsChartFromOrders(orders, selectedTimePeriod);
        
      setDailyEarningsChart(prev => ({
        ...prev,
        series: [{
          ...prev.series[0],
          data: originalChartData.values,
        }],
        options: {
          ...prev.options,
          xaxis: {
            ...prev.options.xaxis,
            categories: originalChartData.displayLabels,
          },
        },
      }));
    }
  }, [orders, tables, categories, inventory, payments, selectedTimePeriod, dailyEarningsRange]);

  const timePeriods = [
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "last3months", label: "Last 3 Months" },
    { value: "last6months", label: "Last 6 Months" },
  ];

  const isLoading = loading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-2 px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-center h-64 sm:h-80 md:h-96">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 border-b-2 border-[#025cca]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto scrollbar-hide">
      <div className="container mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-4 sm:space-y-5 md:space-y-6 pb-6 sm:pb-8 md:pb-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
      >
        <div className="flex-1">
          <h2 className="font-semibold text-[#f5f5f5] text-lg sm:text-xl md:text-2xl lg:text-2xl">
            Restaurant Analytics Dashboard
          </h2>
          <p className="text-xs sm:text-sm md:text-sm text-[#ababab] mt-1">
            Real-time insights into your restaurant's performance and operations
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-md text-[#f5f5f5] bg-[#1a1a1a] border border-[#4a4a4a] hover:bg-[#2a2a2a] transition-colors text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">
              {timePeriods.find(p => p.value === selectedTimePeriod)?.label}
            </span>
            <span className="sm:hidden">
              {timePeriods.find(p => p.value === selectedTimePeriod)?.label.split(' ')[0]}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="4"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 right-0 bg-[#333] border border-[#4a4a4a] rounded-md shadow-lg z-10 min-w-[120px] sm:min-w-[150px]"
              >
                {timePeriods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => {
                      setSelectedTimePeriod(period.value);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 sm:px-4 py-2 text-[#f5f5f5] hover:bg-[#4a4a4a] first:rounded-t-md last:rounded-b-md text-xs sm:text-sm"
                  >
                    {period.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>        {/* Main Metrics - Using existing design pattern */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
        <div className="bg-[#025cca] rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="flex justify-between items-start sm:items-center">
            <p className="font-medium text-xs sm:text-xs md:text-sm text-[#f5f5f5]">Total Revenue</p>
            <div className="flex items-center gap-1">
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                style={{ color: realtimeStats.revenueGrowth >= 0 ? "#f5f5f5" : "red" }}
              >
                <path d={realtimeStats.revenueGrowth >= 0 ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              <p className="font-medium text-xs text-[#f5f5f5]">
                {Math.abs(realtimeStats.revenueGrowth).toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="mt-1 font-semibold text-xl sm:text-2xl lg:text-2xl text-[#f5f5f5]">
            ₹{realtimeStats.totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#02ca3a] rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="flex justify-between items-start sm:items-center">
            <p className="font-medium text-xs sm:text-xs md:text-sm text-[#f5f5f5]">Total Orders</p>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-[#f5f5f5]" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path d="M5 15l7-7 7 7" />
              </svg>
              <p className="font-medium text-xs text-[#f5f5f5]">Live</p>
            </div>
          </div>
          <p className="mt-1 font-semibold text-xl sm:text-2xl lg:text-2xl text-[#f5f5f5]">
            {realtimeStats.totalOrders}
          </p>
        </div>

        <div className="bg-[#f6b100] rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="flex justify-between items-start sm:items-center">
            <p className="font-medium text-xs sm:text-xs md:text-sm text-[#f5f5f5]">Avg Order Value</p>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-[#f5f5f5]" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path d="M5 15l7-7 7 7" />
              </svg>
              <p className="font-medium text-xs text-[#f5f5f5]">Live</p>
            </div>
          </div>
          <p className="mt-1 font-semibold text-xl sm:text-2xl lg:text-2xl text-[#f5f5f5]">
            ₹{realtimeStats.avgOrderValue.toFixed(0)}
          </p>
        </div>

        <div className="bg-[#be3e3f] rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="flex justify-between items-start sm:items-center">
            <p className="font-medium text-xs sm:text-xs md:text-sm text-[#f5f5f5]">Active Customers</p>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-[#f5f5f5]" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path d="M5 15l7-7 7 7" />
              </svg>
              <p className="font-medium text-xs text-[#f5f5f5]">Live</p>
            </div>
          </div>
          <p className="mt-1 font-semibold text-xl sm:text-2xl lg:text-2xl text-[#f5f5f5]">
            {realtimeStats.totalCustomers}
          </p>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Order Progress Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#262626] rounded-lg p-3 sm:p-4 md:p-6"
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
                <h5 className="text-lg sm:text-xl font-bold leading-none text-[#f5f5f5] pe-1">Order Progress</h5>
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
            className="bg-[#1f1f1f] p-2 sm:p-3 rounded-lg"
            whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2">
              <motion.dl 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#333] rounded-lg flex flex-col items-center justify-center h-[60px] sm:h-[70px] md:h-[78px]"
                whileHover={{ scale: 1.05, backgroundColor: "#3d3d3d" }}
              >
                <dt className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-[#f6b100] bg-opacity-20 text-[#f6b100] text-xs sm:text-sm font-medium flex items-center justify-center mb-1">
                  {orderStats.inProgress}
                </dt>
                <dd className="text-[#f6b100] text-xs sm:text-sm font-medium text-center">In Progress</dd>
              </motion.dl>
              
              <motion.dl 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[#333] rounded-lg flex flex-col items-center justify-center h-[60px] sm:h-[70px] md:h-[78px]"
                whileHover={{ scale: 1.05, backgroundColor: "#3d3d3d" }}
              >
                <dt className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-[#02ca3a] bg-opacity-20 text-[#02ca3a] text-xs sm:text-sm font-medium flex items-center justify-center mb-1">
                  {orderStats.ready}
                </dt>
                <dd className="text-[#02ca3a] text-xs sm:text-sm font-medium text-center">Ready</dd>
              </motion.dl>
              
              <motion.dl 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[#333] rounded-lg flex flex-col items-center justify-center h-[60px] sm:h-[70px] md:h-[78px]"
                whileHover={{ scale: 1.05, backgroundColor: "#3d3d3d" }}
              >
                <dt className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-[#025cca] bg-opacity-20 text-[#025cca] text-xs sm:text-sm font-medium flex items-center justify-center mb-1">
                  {orderStats.completed}
                </dt>
                <dd className="text-[#025cca] text-xs sm:text-sm font-medium text-center">Completed</dd>
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

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 sm:pt-4 mt-3 sm:mt-4 gap-3 sm:gap-0"
          >
            <RadialChart orderStats={orderStats} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="grid grid-cols-1 items-center border-t border-[#4a4a4a] justify-between"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 sm:pt-5 gap-3 sm:gap-0">
              <motion.select 
                className="text-xs sm:text-sm font-medium text-[#f5f5f5] bg-[#333] hover:bg-[#3d3d3d] rounded-md px-2 sm:px-3 py-1 border border-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#025cca] cursor-pointer w-full sm:w-auto"
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
                className="uppercase text-xs sm:text-sm font-semibold inline-flex items-center rounded-lg text-[#025cca] hover:text-[#0273fa] px-3 sm:px-3 py-2"
              >
                <span className="hidden sm:inline">Detailed report</span>
                <span className="sm:hidden">Report</span>
                <svg className="w-2.5 h-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>

        {/* CSAT Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#262626] rounded-lg p-3 sm:p-4 md:p-6"
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
                <h5 className="text-lg sm:text-xl font-bold leading-none text-[#f5f5f5] pe-1">Customer Satisfaction</h5>
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

          {/* CSAT Summary Cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#1f1f1f] p-2 sm:p-3 rounded-lg mb-3 sm:mb-4"
            whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }}
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[#333] rounded-lg p-2 sm:p-3 text-center"
                whileHover={{ scale: 1.02, backgroundColor: "#3d3d3d" }}
              >
                <div className="text-xl sm:text-2xl font-bold text-[#02ca3a] mb-1">4.6</div>
                <div className="text-xs text-[#ababab]">Overall Rating</div>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${star <= 4 ? 'text-[#f6b100]' : 'text-[#4a4a4a]'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[#333] rounded-lg p-2 sm:p-3 text-center"
                whileHover={{ scale: 1.02, backgroundColor: "#3d3d3d" }}
              >
                <div className="text-xl sm:text-2xl font-bold text-[#025cca] mb-1">156</div>
                <div className="text-xs text-[#ababab]">Total Reviews</div>
                <div className="text-xs text-[#02ca3a] mt-1">↗ +12 this week</div>
              </motion.div>
            </div>
          </motion.div>

          {/* CSAT Reviews Table */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-[#1f1f1f] rounded-lg overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[#4a4a4a]">
              <h6 className="text-sm font-semibold text-[#f5f5f5]">Recent Reviews</h6>
            </div>

            <div className="max-h-40 sm:max-h-48 overflow-y-auto">
              {[
                { 
                  id: 1, 
                  customer: "John Smith", 
                  rating: 5, 
                  comment: "Excellent service and delicious food!", 
                  date: "2 hours ago",
                  order: "#1245"
                },
                { 
                  id: 2, 
                  customer: "Emma Wilson", 
                  rating: 4, 
                  comment: "Great atmosphere, food was good but took a while.", 
                  date: "5 hours ago",
                  order: "#1238"
                },
                { 
                  id: 3, 
                  customer: "Michael Davis", 
                  rating: 5, 
                  comment: "Perfect dining experience. Will come back!", 
                  date: "1 day ago",
                  order: "#1229"
                },
                { 
                  id: 4, 
                  customer: "Sarah Johnson", 
                  rating: 3, 
                  comment: "Food was okay, service could be improved.", 
                  date: "1 day ago",
                  order: "#1225"
                },
                { 
                  id: 5, 
                  customer: "David Brown", 
                  rating: 4, 
                  comment: "Nice place, good value for money.", 
                  date: "2 days ago",
                  order: "#1218"
                },
                { 
                  id: 6, 
                  customer: "Lisa Garcia", 
                  rating: 5, 
                  comment: "Amazing pasta and friendly staff!", 
                  date: "2 days ago",
                  order: "#1215"
                }
              ].map((review, index) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="px-2 sm:px-3 py-2 border-b border-[#333] hover:bg-[#2a2a2a] transition-colors"
                  whileHover={{ backgroundColor: "#2a2a2a" }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#025cca] flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                        {review.customer.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-[#f5f5f5] truncate">{review.customer}</div>
                        <div className="text-xs text-[#ababab]">Order {review.order}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${star <= review.rating ? 'text-[#f6b100]' : 'text-[#4a4a4a]'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                      <div className="text-xs text-[#ababab]">{review.date}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#f5f5f5] leading-relaxed overflow-hidden">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CSAT Footer */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 sm:pt-4 border-t border-[#4a4a4a] mt-3 sm:mt-4 gap-3 sm:gap-0"
          >
            <motion.select 
              className="text-xs sm:text-sm font-medium text-[#f5f5f5] bg-[#333] hover:bg-[#3d3d3d] rounded-md px-2 sm:px-3 py-1 border border-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#025cca] cursor-pointer w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <option value="7" className="bg-[#333] text-[#f5f5f5]">Last 7 days</option>
              <option value="30" className="bg-[#333] text-[#f5f5f5]">Last 30 days</option>
              <option value="90" className="bg-[#333] text-[#f5f5f5]">Last 90 days</option>
            </motion.select>
            
            <motion.a
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              href="#"
              className="uppercase text-xs sm:text-sm font-semibold inline-flex items-center rounded-lg text-[#025cca] hover:text-[#0273fa] px-2 sm:px-3 py-2"
            >
              <span className="hidden sm:inline">View all reviews</span>
              <span className="sm:hidden">All reviews</span>
              <svg className="w-2.5 h-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Integrated Charts from Payments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Daily Earnings Overview */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#262626] p-3 sm:p-4 md:p-5 rounded-lg shadow-lg"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-[#f5f5f5]">Daily Earnings</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1 bg-[#1a1a1a] p-2 sm:p-3 rounded-lg shadow-md">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-[#f5f5f5]">Current Period</h4>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">
                ₹{dailyEarningsData.values && dailyEarningsData.values.length > 0 
                  ? dailyEarningsData.values.reduce((sum, val) => sum + val, 0).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {dailyEarningsRange === "last7days"
                  ? "Last 7 days"
                  : dailyEarningsRange === "yesterday"
                  ? "Yesterday"
                  : dailyEarningsRange === "today"
                  ? "Today"
                  : dailyEarningsRange === "last30days"
                  ? "Last 30 days"
                  : "Last 90 days"}
              </p>
            </div>
            <div className="flex-1 bg-[#1a1a1a] p-2 sm:p-3 rounded-lg shadow-md">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-[#f5f5f5]">Average Daily</h4>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400">
                ₹{dailyEarningsData.values && dailyEarningsData.values.length > 0 
                  ? (dailyEarningsData.values.reduce((sum, val) => sum + val, 0) / dailyEarningsData.values.length).toFixed(2) 
                  : "0.00"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <span className={dailyEarningsData.percentageChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {dailyEarningsData.percentageChange >= 0 ? "▲" : "▼"} {Math.abs(dailyEarningsData.percentageChange).toFixed(2)}%
                </span> {' '}
                trend
              </p>
            </div>
          </div>

          <div className="h-28 sm:h-32 md:h-36">
            {integratedDailyEarningsChart.series[0].data.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ReactApexChart
                  options={{
                    chart: {
                      height: "100%",
                      width: "100%",
                      type: "area",
                      fontFamily: "Inter, sans-serif",
                      toolbar: {
                        show: false,
                      },
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        },
                        dynamicAnimation: {
                          enabled: true,
                          speed: 350
                        }
                      },
                    },
                    colors: ["#3B82F6", "#22c55e"],
                    dataLabels: {
                      enabled: false,
                    },
                    stroke: {
                      curve: "smooth",
                      width: 3,
                      hover: {
                        width: 4 
                      }
                    },
                    fill: {
                      type: "gradient",
                      gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.2,
                        stops: [0, 90, 100]
                      },
                    },
                    grid: { 
                      show: true,
                      borderColor: '#333',
                      strokeDashArray: 2,
                      position: 'back',
                      xaxis: {
                        lines: { show: false }
                      },
                      yaxis: {
                        lines: { show: true }
                      },
                      padding: {
                        left: 10,
                        right: 10,
                        top: 0,
                        bottom: 0
                      }
                    },
                    xaxis: { 
                      categories: integratedDailyEarningsChart.options.xaxis.categories,
                      labels: { 
                        show: true,
                        style: {
                          colors: '#9ca3af',
                          fontSize: '10px',
                        },
                        formatter: function(value) {
                          const idx = dailyEarningsData.labels.indexOf(value);
                          return idx >= 0 ? dailyEarningsData.displayLabels[idx] : '';
                        },
                        offsetY: 5,
                      },
                      axisBorder: {
                        show: false,
                      },
                      axisTicks: {
                        show: false,
                      }
                    },
                    yaxis: { 
                      show: true,
                      min: function(min) { return min * 0.85; },
                      labels: { 
                        show: true,
                        formatter: function(value) {
                          return '₹' + value.toFixed(0);
                        },
                        style: {
                          colors: "#9ca3af",
                          fontSize: '10px',
                        }
                      },
                      tickAmount: 4,
                    },
                    tooltip: {
                      enabled: true,
                      custom: function({ series, seriesIndex, dataPointIndex, w }) {
                        const dateStr = w.globals.categoryLabels[dataPointIndex];
                        const value = series[seriesIndex][dataPointIndex];
                        const displayDate = dailyEarningsData.displayLabels[dataPointIndex];
                        
                        const currentYear = new Date().getFullYear();
                        const formattedDate = `${displayDate}, ${currentYear}`;
                        
                        return `
                          <div class="chart-tooltip py-2 px-3">
                            <div class="text-center text-gray-400 mb-2">${formattedDate}</div>
                            <div class="flex items-center">
                              <span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                              <span>Daily Earnings: ₹${(value || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        `;
                      },
                      theme: "dark",
                      style: {
                        fontSize: '12px',
                        fontFamily: 'Inter, sans-serif'
                      },
                      background: {
                        color: '#1f2937',
                        borderRadius: 4,
                        opacity: 0.9,
                      },
                      fixed: {
                        enabled: false
                      },
                      marker: {
                        show: true
                      },
                      onDatasetHover: {
                        highlightDataSeries: true,
                      }
                    },
                    states: {
                      hover: {
                        filter: {
                          type: 'lighten',
                          value: 0.1,
                        }
                      },
                      active: {
                        filter: {
                          type: 'darken',
                          value: 0.2,
                        }
                      }
                    },
                    markers: {
                      size: 0,
                      strokeWidth: 2,
                      fillOpacity: 1,
                      strokeOpacity: 1,
                      strokeColors: ["#ffffff"],
                      colors: ["#3B82F6"],
                      hover: {
                        size: 7,
                        sizeOffset: 3
                      }
                    }
                  }}
                  series={integratedDailyEarningsChart.series}
                  type="area"
                  height="95%"
                  width="100%"
                />
              </motion.div>
            ) : (
              <motion.div 
                className="flex h-full items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-gray-400 text-sm">Loading chart data...</p>
              </motion.div>
            )}
          </div>

          <div className="mt-2 pt-3 border-t border-gray-700">
            <div className="relative" onMouseLeave={hideDropdown}>
              <button
                id="timeRangeDropdown"
                onClick={() => {
                  if (dropdownRef.current?.classList.contains("hidden")) {
                    showDropdown();
                  } else {
                    hideDropdown();
                  }
                }}
                className="text-xs font-medium text-gray-400 hover:text-white text-center inline-flex items-center"
                type="button"
              >
                {dailyEarningsRange === "last7days"
                  ? "Last 7 days"
                  : dailyEarningsRange === "yesterday"
                  ? "Yesterday"
                  : dailyEarningsRange === "today"
                  ? "Today"
                  : dailyEarningsRange === "last30days"
                  ? "Last 30 days"
                  : dailyEarningsRange === "last90days"
                  ? "Last 90 days"
                  : "Custom Range"}
                <svg
                  className="w-2 m-2 ms-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              <div
                id="timeRangeOptions"
                ref={dropdownRef}
                onMouseEnter={cancelHideDropdown}
                onMouseLeave={allowHideDropdown}
                className="hidden absolute z-10 bg-[#1a1a1a] divide-y divide-gray-700 rounded-lg shadow-lg w-44 mt-1"
              >
                <ul className="py-2 text-sm text-gray-200">
                  <li>
                    <button
                      onClick={() => handleRangeSelection("yesterday")}
                      className="block w-full text-left px-4 py-2 hover:bg-[#262626]"
                    >
                      Yesterday
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleRangeSelection("today")}
                      className="block w-full text-left px-4 py-2 hover:bg-[#262626]"
                    >
                      Today
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleRangeSelection("last7days")}
                      className="block w-full text-left px-4 py-2 hover:bg-[#262626]"
                    >
                      Last 7 days
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleRangeSelection("last30days")}
                      className="block w-full text-left px-4 py-2 hover:bg-[#262626]"
                    >
                      Last 30 days
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleRangeSelection("last90days")}
                      className="block w-full text-left px-4 py-2 hover:bg-[#262626]"
                    >
                      Last 90 days
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison chart component */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#262626] p-3 sm:p-4 md:p-5 rounded-lg shadow-lg"
        >
          <h3 className="text-base sm:text-lg font-semibold mb-3 text-[#f5f5f5]">Compared to Yesterday</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 bg-[#1a1a1a] p-2 sm:p-3 rounded-lg shadow-md">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-[#f5f5f5]">Today's Earnings</h4>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">
                ₹{dailyEarnings.todayEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {percentageChange >= 0
                  ? "▲"
                  : "▼"}{" "}
                {Math.abs(percentageChange).toFixed(2)}% compared to yesterday
              </p>
            </div>
            <div className="flex-1 bg-[#1a1a1a] p-2 sm:p-3 rounded-lg shadow-md">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-[#f5f5f5]">Yesterday's Earnings</h4>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-400">
                ₹{dailyEarnings.yesterdayEarnings.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-3 h-40 sm:h-44 md:h-48">
            <Chart
              options={{
                chart: {
                  height: "100%",
                  width: "100%",
                  type: "area",
                  fontFamily: "Inter, sans-serif",
                  toolbar: {
                    show: false,
                  },
                  animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: {
                      enabled: true,
                      delay: 150
                    },
                    dynamicAnimation: {
                      enabled: true,
                      speed: 350
                    }
                  },
                },
                colors: ["#3B82F6", "#7E3BF2"],
                dataLabels: {
                  enabled: false,
                },
                stroke: {
                  curve: "smooth",
                  width: 3,
                  hover: {
                    width: 4 
                  }
                },
                fill: {
                  type: "gradient",
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.55,
                    opacityTo: 0.1,
                  },
                },
                xaxis: {
                  categories: dailyEarningsData.displayLabels || ["Yesterday", "Today"],
                  labels: {
                    show: true,
                    style: {
                      colors: '#9ca3af',
                      fontSize: '10px',
                    },
                  },
                  axisBorder: {
                    show: false,
                  },
                  axisTicks: {
                    show: false,
                  },
                },
                yaxis: {
                  show: true,
                  labels: {
                    style: {
                      colors: '#9ca3af',
                      fontSize: '10px',
                    },
                    formatter: function (value) {
                      return '₹' + value.toFixed(0);
                    }
                  }
                },
                grid: {
                  show: true,
                  borderColor: '#333',
                  strokeDashArray: 2,
                  position: 'back',
                  xaxis: {
                    lines: { show: false }
                  },
                  yaxis: {
                    lines: { show: true }
                  },
                  padding: {
                    left: 10,
                    right: 10
                  }
                },
                tooltip: {
                  enabled: true,
                  custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const displayDate = dailyEarningsData.displayLabels ? 
                      dailyEarningsData.displayLabels[dataPointIndex] : 
                      (dataPointIndex === 0 ? "Yesterday" : "Today");
                    
                    const value = series[seriesIndex][dataPointIndex];
                    const todayValue = series[0][dataPointIndex];
                    const previousDayValue = series[1][dataPointIndex];
                    
                    const currentYear = new Date().getFullYear();
                    const formattedDate = `${displayDate}, ${currentYear}`;
                    
                    const seriesName = w.globals.seriesNames[seriesIndex];
                    
                    return `
                      <div class="chart-tooltip py-2 px-3">
                        <div class="text-center text-gray-400 mb-2">${formattedDate}</div>
                        <div class="flex items-center mb-1">
                          <span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          <span>Today: ₹${(todayValue || 0).toFixed(2)}</span>
                        </div>
                        <div class="flex items-center">
                          <span class="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                          <span>Previous Day: ₹${(previousDayValue || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    `;
                  },
                  theme: "dark",
                  style: {
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif'
                  },
                  background: {
                    color: '#1f2937',
                    borderRadius: 4,
                    opacity: 0.9,
                  },
                  fixed: {
                    enabled: false
                  },
                  marker: {
                    show: true
                  },
                  onDatasetHover: {
                    highlightDataSeries: true,
                  }
                },
                legend: {
                  show: true,
                  position: 'top',
                  horizontalAlign: 'right',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif',
                  labels: {
                    colors: '#9ca3af'
                  }
                }
              }}
              series={[
                {
                  name: "Today",
                  data: dailyEarningsData.values || [0, dailyEarnings.todayEarnings],
                  color: "#3B82F6",
                },
                {
                  name: "Previous Day",
                  data: dailyEarningsData.values ? 
                    [0].concat(dailyEarningsData.values.slice(0, -1)) : 
                    [dailyEarnings.yesterdayEarnings, 0],
                  color: "#7E3BF2",
                }
              ]}
              type="area"
              height="100%"
              width="100%"
            />
          </div>
        </motion.div>
      </div>

      {/* Bottom padding for better scrolling */}
      <div className="pb-12 sm:pb-16 md:pb-20 lg:pb-24"></div>
      </div>
    </div>
  );
};

export default Analytics;
