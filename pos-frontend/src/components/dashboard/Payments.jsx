import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
// Import ApexCharts
import ReactApexChart from "react-apexcharts";
import Chart from "react-apexcharts";
// Import Framer Motion at the top of your file
import { motion, AnimatePresence } from "framer-motion";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyEarnings, setDailyEarnings] = useState({
    todayEarnings: 0,
    yesterdayEarnings: 0,
  });
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  // Add date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [isDateRangeActive, setIsDateRangeActive] = useState(false);

  // Add new state for daily earnings chart
  const [dailyEarningsRange, setDailyEarningsRange] = useState("last7days");
  const [dailyEarningsData, setDailyEarningsData] = useState({
    labels: [],
    values: [],
    percentageChange: 0,
  });
  const [dailyEarningsChart, setDailyEarningsChart] = useState({
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
        colors: ['#3B82F6'], // Default color
        hover: {
          width: 3 // Increase width on hover
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
              //full date format 
              formattedDate = dateObj.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
            } else {
              //using to display label with added year
              const currentYear = new Date().getFullYear();
              formattedDate = `${displayDate}, ${currentYear}`;
            }
          } catch (e) {
            // If any error occurs in date parsing, use the display label
            const currentYear = new Date().getFullYear();
            formattedDate = `${displayDate}, ${currentYear}`;
          }
          
          return `
            <div class="chart-tooltip py-2 px-3">
              <div class="text-center text-gray-400 mb-2">${formattedDate}</div>
              <div class="flex items-center">
                <span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                <span>Daily Earnings: ₹${value.toFixed(2)}</span>
              </div>
            </div>
          `;
        },
        // Keep the rest of your tooltip configuration the same
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
        // Remove border and make it more elegant
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

  // Add new function to fetch total earnings
  const fetchTotalEarnings = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/payment/total-earnings",
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
      const response = await axios.get(
        `http://localhost:8000/api/payment/daily-earnings?date=${selectedDate}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const { todayEarnings, yesterdayEarnings } = response.data;

        const change =
          yesterdayEarnings > 0
            ? ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100
            : todayEarnings > 0
            ? 100
            : 0;

        setDailyEarnings({
          todayEarnings,
          yesterdayEarnings,
        });
        setPercentageChange(change);

        // Remove the incorrect reference to setEarningsData
        // Instead, we'll update the chart directly if needed
      }
    } catch (error) {
      console.error("Error fetching daily earnings:", error);
      setError("Failed to fetch earnings data");
    }
  };

  // Updated fetchDailyEarningsByRange function with proper date display
  const fetchDailyEarningsByRange = async (range = "last7days") => {
    try {
      console.log("Fetching earnings for range:", range);
      const response = await axios.get(
        `http://localhost:8000/api/payment/daily-earnings-range?range=${range}`,
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
        const today = new Date().toISOString().split('T')[0];
        console.log("Today's date mapping:", today, "->", directDateMap[today] || "not found");
        
        // Now calculate the date range we need to display
        let startDate, endDate;
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
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
        
        // Generate all dates in the range with correct formatting
        const sortedDates = [];
        const sortedDisplayDates = [];
        const sortedEarnings = [];
        
        // Create a new Date object to iterate through the range
        const currentDate = new Date(startDate);
        
        // Loop through each date in the range
        while (currentDate <= endDate) {
          // Format the date as YYYY-MM-DD for comparison with backend data
          const dateStr = currentDate.toISOString().split('T')[0];
          
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

        // Update chart with the processed data
        setDailyEarningsChart((prev) => ({
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

  // Add new function to fetch payments by date range
  const fetchPaymentsByDateRange = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/payment/range?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setPayments(response.data.payments);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching payments by date range:", error);
      setError("Failed to fetch payment data by date range");
      setLoading(false);
    }
  };

  // Update fetchPayments function
  const fetchPayments = async () => {
    setLoading(true);
    try {
      let response;

      if (isDateRangeActive) {
        response = await axios.get(
          `http://localhost:8000/api/payment/range?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          { withCredentials: true }
        );
      } else {
        response = await axios.get(
          showAllPayments
            ? `http://localhost:8000/api/payment/all`
            : `http://localhost:8000/api/payment?date=${selectedDate}`,
          { withCredentials: true }
        );
      }

      if (response.data.success) {
        setPayments(response.data.payments);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to fetch payment data");
      setLoading(false);
    }
  };

  // Add this function to your component
  const debugDates = () => {
    console.log("Daily Earnings Data:");
    console.log("Labels:", dailyEarningsData.labels);
    console.log("Values:", dailyEarningsData.values);
    console.log("Chart Categories:", dailyEarningsChart.options.xaxis.categories);
    console.log("Chart Series Data:", dailyEarningsChart.series[0].data);
  };

  // Add this function to help debug date issues
  const debugDate = (dateString) => {
    console.log({
      original: dateString,
      parsed: new Date(dateString),
      formatted: new Date(dateString).toISOString().split('T')[0],
      display: formatDate(dateString)
    });
    return dateString;
  };

  // Add this debugger function to the component to help identify the issue
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

  const dropdownRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  
  // Add state to track if we should ignore the hide action
  const [isDropdownHovering, setIsDropdownHovering] = useState(false);

  // Function to show dropdown
  const showDropdown = () => {
    if (dropdownRef.current) {
      dropdownRef.current.classList.remove("hidden");
    }
  };
  
  // Updated hide dropdown function with delay
  const hideDropdown = () => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Set a new timeout to hide the dropdown after a delay
    hideTimeoutRef.current = setTimeout(() => {
      if (dropdownRef.current && !isDropdownHovering) {
        dropdownRef.current.classList.add("hidden");
      }
    }, 300); // 300ms delay before hiding
  };

  // Function to cancel hide when mouse enters dropdown
  const cancelHideDropdown = () => {
    setIsDropdownHovering(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  // Function to allow hide when mouse leaves dropdown
  const allowHideDropdown = () => {
    setIsDropdownHovering(false);
    hideDropdown();
  };

  // Function to handle option selection and hide dropdown
  const handleRangeSelection = (range) => {
    hideDropdown();
    handleChartRangeChange(range);
  };

  useEffect(() => {
    document.title = "POS | Payments";

    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPayments(),
          fetchDailyEarnings(),
          fetchTotalEarnings(),
          fetchDailyEarningsByRange(dailyEarningsRange),
        ]);
        // Debug dates after data is fetched
        debugDates();
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load some data components");
        setLoading(false);
      }
    };

    fetchData();
    // Remove dailyEarningsRange from the dependency array
  }, [selectedDate, isDateRangeActive, dateRange]);

  // Add a separate effect just for chart data
  useEffect(() => {
    fetchDailyEarningsByRange(dailyEarningsRange);
  }, [dailyEarningsRange]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Update filteredPayments to consider date range
  const filteredPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.createdAt).toISOString().split("T")[0];

    let dateMatches = true;
    if (!showAllPayments && !isDateRangeActive) {
      dateMatches = paymentDate === selectedDate;
    }

    return (
      dateMatches &&
      (payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.method.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const roundedPercentageChange = percentageChange.toFixed(2);
  const isPositiveChange = percentageChange >= 0;

  // Add these state updates to sync chart range with payment table
  const handleChartRangeChange = async (newRange) => {
    try {
      // Update the chart range state only
      setDailyEarningsRange(newRange);
      
      // Fetch chart data for the new range
      await fetchDailyEarningsByRange(newRange);
    } catch (error) {
      console.error("Error changing chart range:", error);
      setError("Failed to update chart data");
    }
  };

  return (
    <div className="container mx-auto px-6 py-6 text-white">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Earnings Overview */}
        <div className="bg-[#262626] p-5 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Daily Earnings</h3>
            {/* Remove refresh button */}
          </div>
          
          {/* Keep info boxes but remove percentage change indicator */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-lg shadow-md">
              <h4 className="text-sm font-semibold mb-1">Current Period</h4>
              <p className="text-2xl font-bold text-blue-400">
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
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-lg shadow-md">
              <h4 className="text-sm font-semibold mb-1">Average Daily</h4>
              <p className="text-2xl font-bold text-purple-400">
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

          {/* Remove percentage change indicator section completely */}

          <div className="h-36">
            {dailyEarningsChart.series[0].data.length > 0 ? (
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
                      categories: dailyEarningsChart.options.xaxis.categories,
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
                        show: false, // Remove x-axis border line
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
                              <span>Daily Earnings: ₹${value.toFixed(2)}</span>
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
                      size: 0, // Keep markers hidden by default
                      strokeWidth: 2,
                      fillOpacity: 1,
                      strokeOpacity: 1,
                      strokeColors: ["#ffffff"],
                      colors: ["#3B82F6"],
                      hover: {
                        size: 7, // Show markers on hover with this size
                        sizeOffset: 3
                      }
                    }
                  }}
                  series={dailyEarningsChart.series}
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
              {/* Dropdown content remains unchanged */}
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
        </div>

        {/* Comparison chart component */}
        <div className="bg-[#262626] p-5 rounded-lg shadow-lg">
          {/* Daily comparison chart (Yesterday vs Today) */}
          <h3 className="text-lg font-semibold mb-3">Compared to Yesterday</h3>
          <div className="flex gap-4">
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-lg shadow-md">
              <h4 className="text-sm font-semibold mb-1">Today's Earnings</h4>
              <p className="text-2xl font-bold text-green-400">
                ₹{dailyEarnings.todayEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {roundedPercentageChange >= 0
                  ? "▲"
                  : "▼"}{" "}
                {roundedPercentageChange}% compared to yesterday
              </p>
            </div>
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-lg shadow-md">
              <h4 className="text-sm font-semibold mb-1">Yesterday's Earnings</h4>
              <p className="text-2xl font-bold text-red-400">
                ₹{dailyEarnings.yesterdayEarnings.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-3">
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
                    // Get the display date from our labels array
                    const displayDate = dailyEarningsData.displayLabels ? 
                      dailyEarningsData.displayLabels[dataPointIndex] : 
                      (dataPointIndex === 0 ? "Yesterday" : "Today");
                    
                    // Get current series value
                    const value = series[seriesIndex][dataPointIndex];
                    
                    // Get both series values for this data point
                    const todayValue = series[0][dataPointIndex];
                    const previousDayValue = series[1][dataPointIndex];
                    
                    // Format the date with the current year
                    const currentYear = new Date().getFullYear();
                    const formattedDate = `${displayDate}, ${currentYear}`;
                    
                    // Get the name of the current series
                    const seriesName = w.globals.seriesNames[seriesIndex];
                    
                    return `
                      <div class="chart-tooltip py-2 px-3">
                        <div class="text-center text-gray-400 mb-2">${formattedDate}</div>
                        <div class="flex items-center mb-1">
                          <span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          <span>Today: ₹${todayValue.toFixed(2)}</span>
                        </div>
                        <div class="flex items-center">
                          <span class="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                          <span>Previous Day: ₹${previousDayValue.toFixed(2)}</span>
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
                  // Use dailyEarningsData.values if available, otherwise use single point
                  data: dailyEarningsData.values || [0, dailyEarnings.todayEarnings],
                  color: "#3B82F6",
                },
                {
                  name: "Previous Day",
                  // Create an array that shifts Yesterday's value to align with Today's data points
                  data: dailyEarningsData.values ? 
                    [0].concat(dailyEarningsData.values.slice(0, -1)) : 
                    [dailyEarnings.yesterdayEarnings, 0],
                  color: "#7E3BF2",
                }
              ]}
              type="area"
              height={180}
              width="100%"
            />
          </div>
        </div>
      </div>
      
      

      <div className="bg-[#262626] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Payments</h3>
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          {/* Search input with icon */}
          <div className="relative md:flex-1">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Payment ID, Email, Status, or Method"
              className="w-full bg-[#1a1a1a] text-white pl-10 p-3 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          
          {/* Date selector - more compact */}
          <div className="flex items-center gap-2">
            {!showAllPayments ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 bg-[#1a1a1a] text-white p-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            ) : (
              <span className="text-xs text-gray-400">All dates</span>
            )}
            
            <button
              onClick={fetchDailyEarnings}
              disabled={showAllPayments}
              className={`px-3 py-2 rounded flex items-center gap-1 text-sm ${
                showAllPayments
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <MdRefresh /> Refresh
            </button>
            
            <button
              onClick={() => setShowAllPayments(!showAllPayments)}
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
            >
              {showAllPayments ? "By Date" : "All"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6">
            <svg
              role="status"
              className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5c0-27.61-22.39-50.5-50.5-50.5S-1 22.89-1 50.5 22.39 101 50.5 101 100 78.11 100 50.5z"
                fill="none"
              />
              <path
                d="M93.97 50.5c0-23.66-19.31-42.97-43.97-42.97S6 26.84 6 50.5 25.31 93.47 50.5 93.47 93.97 74.16 93.97 50.5z"
                fill="none"
                strokeWidth="2"
                strokeMiterlimit="10"
                className="stroke-current"
              />
              <path
                d="M73.66 50.5c0-12.68-10.32-23-23-23s-23 10.32-23 23 10.32 23 23 23 23-10.32 23-23z"
                fill="none"
                strokeWidth="2"
                strokeMiterlimit="10"
                className="stroke-current"
              />
            </svg>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-6">
            <p>{error}</p>
            <button
              onClick={fetchPayments}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Retry
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400">No payments found for the selected date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#1f1f1f]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#262626] divide-y divide-gray-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {payment.paymentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {payment.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      ₹{payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.status === "Success"
                            ? "bg-green-500 text-green-900"
                            : payment.status === "Pending"
                            ? "bg-yellow-500 text-yellow-900"
                            : "bg-red-500 text-red-900"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;