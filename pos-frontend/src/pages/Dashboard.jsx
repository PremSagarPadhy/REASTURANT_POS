import React, { useState, useEffect } from "react";
import {Analytics, RecentOrders, Payments, OrderList, ViewTable, AddCategory, Inventory, ManageItems, Invoices, AdminSupport, EmployeeDetails, EmployeeEdit, EmployeeAttendance, EmployeeWorking
} from "../components/dashboard";

import { useSidebar } from "../context/SidebarContext";

const Dashboard = () => {
  useEffect(() => {
    document.title = "POS | Admin Dashboard";
  }, []);
  const { currentView, setCurrentView, isSidebarOpen } = useSidebar();

  // Set Analytics as default view
  useEffect(() => {
    if (!currentView) {
      setCurrentView("Analytics");
    }
  }, [currentView, setCurrentView]);

  // Render content based on currentView from sidebar context
  const renderContent = () => {
    switch (currentView) {
      case "Analytics":
        return <Analytics />;
      case "View Orders":
        return <OrderList />;
      case "Edit Orders":
        return <RecentOrders />;
      case "Create Orders":
        return <CreateOrder />;
      case "View Table":
        return <ViewTable />;
      case "Create Tables":
        return <CreateTable />;
      case "Payments":
        return <Payments />;
      case "Add Category":
        return <AddCategory />;
      case "Manage Items":
        return <ManageItems />;
      case "Invoices":
        return <Invoices />;
      case "Inventory":
        return <Inventory />;
      case "Admin Support":
        return <AdminSupport />;
      case "Employee Details":
        return <EmployeeDetails />;
      case "Employee Edit":
        return <EmployeeEdit />;
      case "Employee Attendance":
        return <EmployeeAttendance />;
      case "Employee Working":
        return <EmployeeWorking />;
      default:
        return <Analytics />;
    }
  };

  return (
    <div className="flex">
      <div
        className={`bg-[#1a1a1a] flex-1 h-[calc(100vh-5rem)] overflow-hidden transition-[margin] duration-500 ease-in-out ${
          isSidebarOpen ? 'ml-56' : 'ml-16'
        }`}
      >
        {/* Page Content */}
        <div className="overflow-y-auto h-[calc(100vh-1rem)] custom-scrollbar-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;