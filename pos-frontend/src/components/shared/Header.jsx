import React, { useState } from "react";
import { FaSearch, FaUserCircle, FaBell } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { PiHouseSimpleFill } from "react-icons/pi";
import { Menu } from "lucide-react";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      console.log(data);
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a] relative">
        {/* LOGO - Hidden on Dashboard */}
        {location.pathname !== "/dashboard" ? (
          <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
            <img src={logo} className="h-8 w-8" alt="restro logo" />
            <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
              Restro-Maniac
            </h1>
          </div>
        ) : (
          <div className="w-16"></div> // Keeps search bar centered
        )}

        {/* SEARCH (Position Unchanged) */}
        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-5 py-2 w-[500px]">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Search"
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
          />
        </div>

        {/* LOGGED USER DETAILS */}
        <div className="flex items-center gap-4">
          {userData.role === "Admin" && (
            <div
              onClick={() => navigate("/dashboard")}
              className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer"
            >
              <MdDashboard className="text-[#f5f5f5] text-2xl" />
            </div>
          )}

          {/* Show Menu Icon Only on Dashboard */}
          {location.pathname === "/dashboard" && (
            <button
              onClick={() => navigate("/")}
              className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer"
            >
              <PiHouseSimpleFill className="text-[#f5f5f5] text-2xl" />
            </button>
          )}

          <div className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer">
            <FaBell className="text-[#f5f5f5] text-2xl" />
          </div>
          <div className="flex items-center gap-3 cursor-pointer">
            <FaUserCircle className="text-[#f5f5f5] text-4xl" />
            <div className="flex flex-col items-start">
              <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
                {userData.name || "TEST USER"}
              </h1>
              <p className="text-xs text-[#ababab] font-medium">
                {userData.role || "Role"}
              </p>
            </div>
            <IoLogOut
              onClick={handleLogout}
              className="text-[#f5f5f5] ml-2"
              size={40}
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
