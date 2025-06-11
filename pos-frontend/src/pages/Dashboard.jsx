import React, { useState, useEffect } from "react";
import Analytics from "../components/dashboard/Analytics";
import RecentOrders from "../components/dashboard/RecentOrders";
import Payments from "../components/dashboard/Payments";
import OrderList from "../components/dashboard/OrderList";
import ViewTable from "../components/dashboard/ViewTable";
import AddCategory from "../components/dashboard/AddCategory";
import Inventory from "../components/dashboard/Inventory";
import ManageItems from "../components/dashboard/ManageItems";
import Invoices from "../components/dashboard/invoices";
import AdminSupport from "../components/dashboard/AdminSupport"; // Import the AdminSupport component

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
        <div className="container overflow-x-auto  flex items-center justify-between py-1 px-6 md:px-4">
          {/* Current view indicator */}
          <div className="px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md">
            {currentView || "Analytics"}
          </div>
        </div>
        {/* Page Content */}
        <div className="overflow-y-auto h-[calc(100vh-1rem)] custom-scrollbar-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;