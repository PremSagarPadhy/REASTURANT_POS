import React from "react";
import { getRandomBG } from "../../utils/getRandomBG";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { motion } from "framer-motion";

const TablesCard = ({ name, status, initals, seats }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const handleClick = (name) => {
        if (status === "Booked") return;
        dispatch(updateTable({tableNo: name}));
        navigate(`/menu`);
    };

    // Memoize the background color to prevent re-rendering
    const bgColorClass = React.useMemo(() => getRandomBG(), []);

    // Optimized animations with faster transitions
    const itemVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.95 }, // Reduced distance
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300, // Higher stiffness
                damping: 15,   // Adjusted damping
                mass: 0.6,     // Lower mass
                duration: 0.2  // Explicit shorter duration
            }
        },
        exit: { 
            opacity: 0, 
            y: -5, // Less movement 
            scale: 0.97, // Less scale change
            transition: {
                duration: 0.15 // Faster exit
            }
        },
        hover: {
            y: -2, // Smaller movement for faster response
            scale: status === "Booked" ? 1.01 : 1.02, // Smaller scale for faster response
            boxShadow: "0px 5px 10px rgba(0,0,0,0.15)", // Smaller shadow
            transition: { 
                type: "tween", // Changed to tween for immediate response
                duration: 0.1  // Very fast hover
            }
        }
    };

    // Optimized text animations
    const textVariants = {
        hidden: { opacity: 0, x: -3 }, // Less distance
        visible: { 
            opacity: 1, 
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
                duration: 0.15 // Faster animation
            }
        }
    };

    // Optimized icon animations
    const iconVariants = {
        hidden: { opacity: 0, scale: 0.9 }, // Less scale difference
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 350, // Higher stiffness
                damping: 15,
                duration: 0.2 // Faster animation
            }
        },
        hover: {
            scale: 1.08, // Less scale for faster response
            rotate: [0, 5, -5, 0], // Same rotation pattern
            transition: {
                duration: 0.2, // Faster overall
                scale: { 
                    duration: 0.08, // Very fast scale
                    type: "tween"   // Changed to tween for immediate response
                }
            }
        }
    };

    // Optimized badge animations
    const badgeVariants = {
        hidden: { opacity: 0, scale: 0.9, x: 3 }, // Less distance & scale
        visible: { 
            opacity: 1, 
            scale: 1,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
                duration: 0.15 // Faster animation
            }
        },
        hover: {
            scale: 1.03, // Less scale for faster response
            transition: {
                duration: 0.1, // Faster animation
                type: "tween"  // Changed to tween for immediate response
            }
        }
    };

    return (
        <motion.div 
            onClick={() => handleClick(name)}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className="w-full min-w-[250px] h-[60px] sm:h-[70px] md:h-[80px] bg-[#1a1a1a] hover:bg-[#262626] rounded-xl cursor-pointer flex items-center justify-between px-2 sm:px-3 md:px-4 relative shadow-lg hover:shadow-xl transition-all"
        >
            {/* Left side: Table name and seats */}
            <motion.div 
                className="flex flex-col gap-0 sm:gap-1 z-10"
                variants={textVariants}
            >
                <motion.h1 
                    className="text-[#f5f5f5] text-base sm:text-lg md:text-xl font-bold"
                    whileHover={{ 
                        x: 2, 
                        transition: { 
                            duration: 0.1, 
                            type: "tween" 
                        } 
                    }}
                >
                    {name}
                </motion.h1>
                <motion.p 
                    className="text-[#ababab] text-[10px] sm:text-xs"
                >
                    Seats: <span className="text-[#f5f5f5] font-semibold">{seats}</span>
                </motion.p>
            </motion.div>
            
            {/* Middle: Customer Icon */}
            <motion.div 
                className="absolute left-1/2 transform -translate-x-1/2"
                variants={iconVariants}
            >
                <motion.h1 
                    className={`${bgColorClass} text-black rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-xs sm:text-sm md:text-md font-bold shadow-md`}
                    whileHover="hover"
                >
                    {initals}
                </motion.h1>
            </motion.div>

            {/* Right side: Status */}
            <motion.div
                variants={badgeVariants}
            >
                <motion.p 
                    className={`${status === "Booked" ? "bg-[#b0565c] text-red-900" : "bg-[#2e4a40] text-green-600"} 
                        px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold`}
                    whileHover="hover"
                >
                    {status}
                </motion.p>
            </motion.div>
        </motion.div>
    );
};

export default TablesCard;
