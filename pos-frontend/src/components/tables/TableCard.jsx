import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils";
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { motion } from "framer-motion";

const TableCard = ({id, name, status, initials, seats, onDelete}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in the dashboard view
  const isDashboard = location.pathname.includes('/dashboard');
  
  const handleClick = (name) => {
    if(status === "Booked") return;

    const table = { tableId: id, tableNo: name }
    dispatch(updateTable({table}))
    navigate(`/menu`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if(onDelete) {
      onDelete(id);
    }
  };

  // Get background color for avatar
  const avatarBgColor = React.useMemo(() => {
    return initials ? getBgColor() : "#1f1f1f";
  }, [initials]);

  // Optimized card animation variants - faster transitions
  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 }, // Reduced distance for faster appearance
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 250, // Increased for snappier animation
        damping: 15,  // Adjusted for less bounce
        mass: 0.6,    // Lower mass for faster movement
        duration: 0.25 // Explicit shorter duration
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: {
        duration: 0.15 // Faster exit
      }
    },
    hover: {
      y: -3, // Smaller shift for faster reaction
      scale: status === "Booked" ? 1.01 : 1.03,
      boxShadow: "0px 8px 15px rgba(0,0,0,0.15)", // Lighter shadow renders faster
      transition: { 
        type: "tween", // Changed to tween for immediate response
        duration: 0.1  // Very short duration for immediate feel
      }
    }
  };

  // Header animation - optimized
  const headerVariants = {
    hidden: { y: -5, opacity: 0 }, // Smaller distance
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 250,
        damping: 12,
        duration: 0.15 // Faster animation
      }
    }
  };

  // Avatar animation - optimized
  const avatarVariants = {
    hidden: { scale: 0.9, opacity: 0 }, // Less scale difference
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 15,
        duration: 0.2 // Faster animation
      }
    },
    hover: {
      scale: 1.08, // Smaller scale for faster animation
      rotate: [0, 5, -5, 0], // Same rotation
      transition: { 
        duration: 0.2, // Faster rotation
        scale: {
          duration: 0.08, // Immediate scale
          type: "tween"   // Changed to tween for immediate response
        }
      }
    }
  };

  // Footer animation - optimized
  const footerVariants = {
    hidden: { y: 5, opacity: 0 }, // Smaller distance
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 250,
        damping: 12,
        duration: 0.15 // Faster animation
      }
    }
  };

  return (
    <motion.div 
      onClick={() => handleClick(name)} 
      key={id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      className="w-full h-full min-h-[160px] bg-[#262626] hover:bg-[#2c2c2c] p-4 rounded-lg cursor-pointer relative shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
    >
      <motion.div 
        className="flex items-center justify-between mb-3"
        variants={headerVariants}
      >
        <motion.h1 
          className="text-[#f5f5f5] text-sm sm:text-base font-semibold truncate"
          whileHover={{ x: 2, transition: { duration: 0.1, type: "tween" } }}
        >
          Table <motion.span
            initial={{ x: -3, opacity: 0 }} // Smaller distance
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.15 }} // Faster animation
          >
            <FaLongArrowAltRight className="text-[#ababab] ml-1 inline" />
          </motion.span> {name}
        </motion.h1>
        <motion.p 
          className={`${status === "Booked" ? "text-green-600 bg-[#2e4a40]" : "bg-[#664a04] text-white"} 
            px-1.5 py-0.5 text-xs rounded-lg ml-1 whitespace-nowrap`}
          whileHover={{ 
            scale: 1.05, 
            transition: { 
              duration: 0.1, 
              type: "tween" 
            } 
          }}
        >
          {status}
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="flex justify-center items-center my-4"
        variants={avatarVariants}
      >
        <motion.div 
          className={`text-white rounded-full w-14 h-14 flex items-center justify-center text-base`} 
          style={{backgroundColor: avatarBgColor}}
          whileHover="hover"
        >
          {getAvatarName(initials) || "N/A"}
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="flex items-center justify-between mt-3"
        variants={footerVariants}
      >
        <motion.p 
          className="text-[#ababab] text-xs"
          whileHover={{ 
            x: 2, 
            transition: { 
              duration: 0.1, 
              type: "tween" 
            } 
          }}
        >
          Seats: <span className="text-[#f5f5f5]">{seats}</span>
        </motion.p>
        
        {/* Delete button - only visible in dashboard */}
        {isDashboard && (
          <motion.button 
            className="text-red-500 hover:text-red-600 text-lg"
            onClick={handleDeleteClick}
            title="Delete table"
            whileHover={{ 
              scale: 1.15, // Smaller scale for faster response
              rotate: [0, 10, -10, 0], // Less rotation
              color: "#ff4d4d",
              transition: { 
                rotate: { duration: 0.2 }, // Faster rotation
                scale: { duration: 0.1, type: "tween" }, // Immediate scale
                color: { duration: 0.1 } // Faster color change
              }
            }}
            whileTap={{ scale: 0.9 }}
          >
            <MdDeleteForever />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TableCard;