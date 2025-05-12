import React, { useState, useEffect } from "react";
import { MdOutlineTableBar, MdOutlineFeedback, MdOutlineInventory, MdOutlineInventory2 } from "react-icons/md";
import { IoAnalyticsSharp, IoCardOutline } from "react-icons/io5";
import { TbFileInvoice, TbNotification } from "react-icons/tb";
import { GrUserWorker } from "react-icons/gr";
import { AiOutlineProduct } from "react-icons/ai";
import { BiUser } from "react-icons/bi";
import { RiCustomerServiceLine } from "react-icons/ri";
import { useSidebar } from "../../context/SidebarContext";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import Modal from "../dashboard/Modal"; // Import Modal component

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, currentView, setCurrentView } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredSubmenuItem, setHoveredSubmenuItem] = useState(null);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [gradientOffset, setGradientOffset] = useState(0);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false); 

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientOffset((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Handle navigation for dashboard items
  const handleMenuItemClick = (item) => {
    if (item.label === "Analytics" || item.label === "Edit Orders" || item.label === "View Orders"|| item.label === "Create Orders" || item.label === "Payments" 
      || item.label === "View Table" || item.label === "Create Table" || item.label === "Add Category" || item.label === "Edit Category" || item.label === "Manage Items" 
      || item.label === "Invoices" || item.label === "Inventory" || item.label === "Customer" || item.label === "Employee" || item.label === "Feedback" 
      || item.label === "Support" || item.label === "Notification") {
      // If the item is a dashboard item, set the current view
      // If on dashboard page, just update the view
      if (location.pathname === "/dashboard") {
        setCurrentView(item.label);
      } else {
        // If not on dashboard, navigate to dashboard and set the view
        setCurrentView(item.label);
        navigate("/dashboard");
      }
    } else if (item.action) {
      // If the item has a direct action, execute it
      item.action();
    } else if (item.link) {
      // Otherwise navigate to the link
      navigate(item.link);
    }
  };

  // Function to handle "Create Table" action
  const handleCreateTable = () => {
    setIsTableModalOpen(true);
  };

  // Menu items data
  const menuItems = [
    { 
      icon: <IoAnalyticsSharp size={20} />, 
      label: "Analytics", 
      action: () => handleMenuItemClick({ label: "Analytics" })
    },
    {
      icon: <MdOutlineInventory size={20} />,
      label: "Orders",
      action: () => handleMenuItemClick({ label: "View Orders" }),
      submenu: [
        { label: "View Order", action: () => handleMenuItemClick({ label: "View Orders" }) },
        { label: "Edit Order", action: () => handleMenuItemClick({ label: "Edit Orders" })  }
      ]
    },
    {
      icon: <MdOutlineTableBar size={20} />,
      label: "Tables",
      submenu: [
        { label: "View Table", action: () => handleMenuItemClick({ label: "View Table" }) },
        { label: "Create Table", action: handleCreateTable } 
      ]
    },
    {
      icon: <AiOutlineProduct size={20} />,
      label: "Products",
      submenu: [
        { label: "Manage Category ", action: () => handleMenuItemClick({ label: "Add Category" }) },
        { label: "Manage Items", action: () => handleMenuItemClick({ label: "Manage Items" }) }
      ]
    },
    { 
      icon: <IoCardOutline size={20} />, 
      label: "Payments", 
      action: () => handleMenuItemClick({ label: "Payments" })
    },
    { 
      icon: <TbFileInvoice size={20} />, 
      label: "Invoices", 
      action: () => handleMenuItemClick({ label: "Invoices" })
    },
    { 
      icon: <MdOutlineInventory2 size={20} />,
      label: "Inventory", 
      submenu: [
        // Change this to use the handleMenuItemClick approach instead of direct navigation
        { label: "Manage Inventory", action: () => handleMenuItemClick({ label: "Inventory" }) },
        { label: "Inventory Report", action: () => handleMenuItemClick({ label: "Inventory Report" }) }
      ],
    },
    { icon: <BiUser size={20} />, label: "Customer", link: "/customer" },
    { icon: <GrUserWorker size={20} />, label: "Employee", link: "/employee" },
    { icon: <MdOutlineFeedback size={20} />, label: "Feedback", link: "/feedback" },
    { icon: <RiCustomerServiceLine size={20} />, label: "Support", link: "/support" },
    { icon: <TbNotification size={20} />, label: "Notification", link: "/notifications" }
  ];

  // Function to handle submenu interactions
  const handleMenuClick = (index) => {
    if (expandedMenu === index) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(index);
    }
  };

  // Function to render nested submenus
  const renderSubmenu = (submenuItems, level = 0, parentIndex) => {
    return (
      <div 
        className={`py-2 space-y-1 submenu-container`} 
        style={{ 
          animation: `fadeIn 0.3s ease-out forwards`,
          paddingLeft: level > 0 ? '1rem' : '2.5rem',
          marginLeft: level > 0 ? '0.5rem' : '0'
        }}
      >
        {submenuItems.map((subItem, subIndex) => {
          const itemKey = `${parentIndex}-${subIndex}`;
          return (
            <div key={subIndex} className="relative">
              <a
                href={subItem.link || "#"}
                className="flex items-center text-sm transition-all duration-300 py-2 px-1 hover:scale-105 submenu-item relative overflow-hidden"
                onClick={(e) => {
                  e.preventDefault();
                  if (subItem.action) {
                    subItem.action();
                  } else if (subItem.link) {
                    navigate(subItem.link);
                  }
                }}
                onMouseEnter={() => {
                  setHoveredSubmenuItem(itemKey);
                  if (subItem.submenu) setHoveredItem(itemKey);
                }}
                onMouseLeave={() => {
                  setHoveredSubmenuItem(null);
                  if (!subItem.submenu) setHoveredItem(parentIndex);
                }}
              >
                <span className={`relative ${hoveredSubmenuItem === itemKey ? 'submenu-glow' : 'text-gray-300'}`}>
                  {subItem.label}
                  <div className="menu-underline"></div>
                </span>
                {subItem.submenu && (
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform duration-300 ${
                      hoveredItem === itemKey ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                )}
              </a>
              {/* Nested submenu */}
              {subItem.submenu && hoveredItem === itemKey && (
                renderSubmenu(subItem.submenu, level + 1, itemKey)
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-[#1a1a1a] text-white flex flex-col transition-width duration-500 ease-in-out ${
        isSidebarOpen ? "w-60" : "w-20"
      } shadow-lg z-50`}
    >
      {/* Header/Logo Section */}
      <div className="h-16 border-b border-[#1d1d1d] flex items-center px-3">
        <div className="flex items-center mt-5">
          <div
            className="h-10 w-10 rounded-md flex items-center justify-center font-medium cursor-pointer transform transition-transform duration-300 hover:scale-110"
            onClick={toggleSidebar}
          >
            <img
              src={logo}
              className={`h-11 w-11 transition-all duration-500 ${
                isSidebarOpen ? "rotate-once" : "logo-pulse"
              }`}
              alt="restro logo"
            />
          </div>
          {isSidebarOpen && (
            <button
              className="ml-3 font-bold text-lg focus:outline-none animated-restro"
              onClick={() => navigate("/")}
            >
              <span className="gradient-text slideIn">Restro-Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col py-4 overflow-hidden hover-overflow-visible">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={index} className="relative">
              {/* Parent Menu Item */}
              <a
                href="#"
                className={`flex items-center h-12 pl-3 pr-4 relative group overflow-hidden transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-lg ${
                  !isSidebarOpen ? "justify-center" : ""
                } ${currentView === item.label ? "bg-[#262626]" : ""}`}
                style={{ animation: `slideIn 0.3s ease-out ${index * 0.1}s both` }}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => item.submenu ? null : setHoveredItem(null)}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.action) {
                    item.action();
                  } else if (item.submenu && isSidebarOpen) {
                    handleMenuClick(index);
                  } else if (item.link) {
                    navigate(item.link);
                  }
                }}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 transition-all duration-300 ${
                    hoveredItem === index || expandedMenu === index || currentView === item.label ? "scale-125 icon-glow" : ""
                  } ${!isSidebarOpen && "mx-auto"}`}
                >
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <span
                    className={`ml-3 transform transition-all duration-300 ${
                      hoveredItem === index || expandedMenu === index || currentView === item.label ? "menu-item-active" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                )}
                {isSidebarOpen && item.submenu && (
                  <svg
                    className={`w-4 h-4 ml-auto transition-transform duration-300 ${
                      hoveredItem === index || expandedMenu === index ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                )}
                <div className="menu-underline"></div>
              </a>

              {/* Render Submenu */}
              {item.submenu && isSidebarOpen && (hoveredItem === index || expandedMenu === index) && (
                renderSubmenu(item.submenu, 0, index)
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table Modal - Add this to render the modal when isTableModalOpen is true */}
      {isTableModalOpen && <Modal setIsTableModalOpen={setIsTableModalOpen} />}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes textGlow {
          0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.2); opacity: 0; transform: translateX(-10px); }
          50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.6); opacity: 0.7; transform: translateX(0); }
          100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.2); opacity: 1; }
        }

        @keyframes logoSpin {
          0% { transform: rotate(0deg); filter: hue-rotate(0deg); }
          100% { transform: rotate(360deg); filter: hue-rotate(360deg); }
        }

        @keyframes logoPulse {
          0% { transform: scale(1); filter: hue-rotate(0deg); }
          50% { transform: scale(1.1); filter: hue-rotate(180deg); }
          100% { transform: scale(1); filter: hue-rotate(360deg); }
        }

        .logo-spin:hover {
          animation: logoSpin 3s linear infinite;
        }

        .logo-pulse {
          animation: logoPulse 2s ease-in-out infinite;
        }
        
        .gradient-text {
          background-image: linear-gradient(
            90deg, 
            rgb(252, 252, 252) ${gradientOffset}%, 
            rgb(245, 219, 211) ${gradientOffset + 20}%, 
            rgb(245, 238, 236) ${gradientOffset + 40}%, 
            rgb(255, 255, 255) ${gradientOffset + 60}%
          );
          background-size: 300% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          display: inline-block;
        }    
        
        @keyframes rotateOnce {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .rotate-once {
          animation: rotateOnce 5s ease-in-out forwards;
        }
        
        .animated-restro {
          display: inline-block;
          animation: textGlow 1.5s ease-in-out forwards;
        }

        .icon-glow {
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.7));
        }
          
        .menu-item-active {
          transform: translateX(5px);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        }
        
        .menu-underline {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, rgb(255, 255, 255), #fad0c4);
          opacity: 0;
          transition: all 0.5s ease;
        }
        
        a:hover .menu-underline {
          width: 100%;
          opacity: 1;
        }
        
        .submenu-container {
          border-left: 0px solid rgba(255, 255, 255, 0.1);
          margin-left: 1.5rem;
        }
        
        .submenu-item {
          border-radius: 5px;
          position: auto;
        }
        .submenu-glow {
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          transition: text-shadow 0.3s ease-in-out;
        }
        .submenu-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .hover-overflow-visible:hover {
          overflow: hidden;
        }

        .transition-width {
          transition-property: width;
        }
        
      `}</style>
    </div>
  );
};

export default Sidebar;