import React from "react";
import Chart from "react-apexcharts";

const RadialChart = ({ orderStats }) => {
  const chartOptions = {
    series: [
      Math.round((orderStats.completed / (orderStats.total || 1)) * 100),
      Math.round((orderStats.ready / (orderStats.total || 1)) * 100),
      Math.round((orderStats.inProgress / (orderStats.total || 1)) * 100)
    ],
    options: {
      colors: ["#025cca", "#02ca3a", "#f6b100"],
      chart: {
        height: 200,
        width: "200%",
        type: "radialBar",
        background: "transparent",
        sparkline: {
          enabled: true,
        },
        offsetY: -30,
        offsetX: 0,
      },
      plotOptions: {
        radialBar: {
          track: {
            background: "#333",
          },
          dataLabels: {
            show: false,
            name: {
              show: false,
              fontSize: '14px',
              fontFamily: undefined,
              fontWeight: 600,
              color: '#f5f5f5',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '16px',
              fontFamily: undefined,
              fontWeight: 400,
              color: '#ababab',
              offsetY: 0,
              formatter: function (val) {
                return val + '%'
              }
            },
          },
          hollow: {
            margin: 0,
            size: "32%",
          },
          offsetX: 0,
          offsetY: 0,
        },
      },
      grid: {
        show: false,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: -16,
          bottom: -20,
        },
      },
      labels: ["Completed", "Ready", "In Progress"],
      legend: {
        show: true,
        position: "bottom",
        fontFamily: "Inter, sans-serif",
        fontSize: '14px',
        fontWeight: 500,
        labels: {
          colors: "#f5f5f5"
        },
        markers: {
          width: 12,
          height: 12,
          strokeWidth: 0,
          radius: 12,
        },
        itemMargin: {
          horizontal: 10,
        },
        offsetX: 0, // Horizontal position offset for legend
        offsetY: -12, // Vertical position offset for legend
        floating: true,
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        x: {
          show: false,
        },
      },
      yaxis: {
        show: false,
        labels: {
          formatter: function (value) {
            return value + "%";
          },
        },
      },
    },
  };

  return (
    <div id="radial-chart" style={{ width: "100%", position: "relative",padding: "0px 0px 0px 0px" }}>
      <Chart 
        options={chartOptions.options} 
        series={chartOptions.series} 
        type="radialBar" 
        height="240" 
        width="100%" 
      />
    </div>
  );
};

export default RadialChart;