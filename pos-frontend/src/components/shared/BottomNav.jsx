import React, { useState, useEffect } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar, MdOutlineInventory, MdOutlineFeedback } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish, BiUser } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";
import { RiCustomerServiceLine } from "react-icons/ri";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [name, setName] = useState();
  const [phone, setPhone] = useState();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [gradientOffset, setGradientOffset] = useState(0);

  // Animation effect for gradient
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientOffset((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const toggleMoreMenu = () => setIsMoreMenuOpen(!isMoreMenuOpen);

  const increment = () => {
    if(guestCount >= 6) return;
    setGuestCount((prev) => prev + 1);
  }
  const decrement = () => {
    if(guestCount <= 0) return;
    setGuestCount((prev) => prev - 1);
  }

  const isActive = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    // send the data to store
    dispatch(setCustomer({name, phone, guests: guestCount}));
    navigate("/tables");
  }
  
  // More menu items
  const moreMenuItems = [
    { icon: <RiCustomerServiceLine size={18} color="white"/>, label: "Support", link: "/support" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex justify-around">
      <button
        onClick={() => navigate("/")}
        onMouseEnter={() => setHoveredButton("home")}
        onMouseLeave={() => setHoveredButton(null)}
        className={`flex items-center justify-center font-bold text-[#ababab] w-[300px] rounded-[20px] relative overflow-hidden transition-all duration-300 hover:scale-105`}
      >
        <div className={`flex items-center justify-center transition-all duration-300 ${
          hoveredButton === "home" ? "scale-125 icon-glow" : ""
        }`}>
          <FaHome className="inline mr-2" size={20} /> 
        </div>
        <p className={`transition-all duration-300 ${
          hoveredButton === "home" ? "nav-item-active" : ""
        }`}>Home</p>
        <div className="menu-underline"></div>
      </button>

      <button
        onClick={() => navigate("/orders")}
        onMouseEnter={() => setHoveredButton("orders")}
        onMouseLeave={() => setHoveredButton(null)}
        className={`flex items-center justify-center font-bold text-[#ababab] w-[300px] rounded-[20px] relative overflow-hidden transition-all duration-300 hover:scale-105`}
      >
        <div className={`flex items-center justify-center transition-all duration-300 ${
          hoveredButton === "orders" ? "scale-125 icon-glow" : ""
        }`}>
          <MdOutlineReorder className="inline mr-2" size={20} /> 
        </div>
        <p className={`transition-all duration-300 ${
          hoveredButton === "orders" ? "nav-item-active" : ""
        }`}>Orders</p>
        <div className="menu-underline"></div>
      </button>

      <button
        onClick={() => navigate("/tables")}
        onMouseEnter={() => setHoveredButton("tables")}
        onMouseLeave={() => setHoveredButton(null)}
        className={`flex items-center justify-center font-bold text-[#ababab] w-[300px] rounded-[20px] relative overflow-hidden transition-all duration-300 hover:scale-105`}
      >
        <div className={`flex items-center justify-center transition-all duration-300 ${
          hoveredButton === "tables" ? "scale-125 icon-glow" : ""
        }`}>
          <MdTableBar className="inline mr-2" size={20} /> 
        </div>
        <p className={`transition-all duration-300 ${
          hoveredButton === "tables" ? "nav-item-active" : ""
        }`}>Tables</p>
        <div className="menu-underline"></div>
      </button>
        <button 
          onClick={toggleMoreMenu}
          onMouseEnter={() => setHoveredButton("more")}
          onMouseLeave={() => isMoreMenuOpen ? setHoveredButton("more") : setHoveredButton(null)}
          className={`flex items-center justify-center font-bold text-[#ababab] w-[300px] rounded-[20px] relative overflow-hidden transition-all duration-300 hover:scale-105`}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            hoveredButton === "more" ? "scale-125 icon-glow" : ""
          }`}>
            <CiCircleMore className="inline" size={20} />
          </div>
          <p className={`transition-all duration-300 ml-2 ${
            hoveredButton === "more" ? "nav-item-active" : ""
          }`}>More</p>
          <div className="menu-underline"></div>
        </button>
        
        {/* More Menu Dropdown */}
        {isMoreMenuOpen && (
          <div
            className="bg-[#1a1a1a] rounded-lg shadow-xl p-3 w-72 z-50 border border-[#343434] more-menu-dropdown fixed"
            style={{
              animation: `fadeIn 0.3s ease-out forwards`,
              bottom: '64px', // Positions above the bottom nav
              right: '70px',    // Center horizontally
              transform: 'translateX(-55%)', // Center adjustment
            }}
          >
            <div className="space-y-1">
              {moreMenuItems.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex items-center p-2 relative group transition-all duration-300 hover:bg-[#262626] rounded-md overflow-hidden"
                  style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s both` }}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.link);
                    setIsMoreMenuOpen(false);
                  }}
                >
                  <div className={`flex items-center justify-center w-8 h-8 transition-all duration-300 ${
                    hoveredItem === index ? "scale-125 icon-glow" : ""
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`ml-3 text-sm transition-all duration-300 ${
                    hoveredItem === index ? "menu-item-active text-white" : "text-[#ababab]"
                  }`}>
                    {item.label}
                  </span>
                  <div className="menu-underline"></div>
                </a>
              ))}
            </div>

            {/* Add a decorative pointer at the bottom */}
            <div 
              className="absolute w-4 h-4 bg-[#1a1a1a] transform rotate-45"
              style={{
                bottom: '-8px',
                left: '50%',
                marginLeft: '-8px',
                borderRight: '1px solid #343434',
                borderBottom: '1px solid #343434',
              }}
            ></div>
          </div>
        )}

      <button
        disabled={isActive("/tables") || isActive("/menu")}
        onClick={openModal}
        className="absolute bottom-6 bg-[#F6B100] text-[#f5f5f5] rounded-full p-4 items-center hover:scale-110 transition-transform duration-300"
      >
        <BiSolidDish size={40} />
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create Order">
        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">Customer Name</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="" placeholder="Enter customer name" id="" className="bg-transparent flex-1 text-white focus:outline-none"  />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">Customer Phone</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="number" name="" placeholder="+91-9999999999" id="" className="bg-transparent flex-1 text-white focus:outline-none"  />
          </div>
        </div>
        <div>
          <label className="block mb-2 mt-3 text-sm font-medium text-[#ababab]">Guest</label>
          <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg">
            <button onClick={decrement} className="text-yellow-500 text-2xl">&minus;</button>
            <span className="text-white">{guestCount} Person</span>
            <button onClick={increment} className="text-yellow-500 text-2xl">&#43;</button>
          </div>
        </div>
        <button onClick={handleCreateOrder} className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700">
          Create Order
        </button>
      </Modal>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .more-menu-dropdown {
          box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.5);
        }

        .icon-glow {
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.7));
        }
          
        .menu-item-active, .nav-item-active {
          transform: translateX(5px);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        }
        
        .menu-underline {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, rgb(255, 255, 255), #F6B100);
          opacity: 0;
          transition: all 0.5s ease;
        }
        
        button:hover .menu-underline, a:hover .menu-underline {
          width: 100%;
          opacity: 1;
        }

        @keyframes textGlow {
          0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.2); }
          50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.6); }
          100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.2); }
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
      `}</style>
    </div>
  );
};

export default BottomNav;
