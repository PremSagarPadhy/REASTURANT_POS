import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";

const Tables = () => {
  const [status, setStatus] = useState("all");
  
  useEffect(() => {
    document.title = "POS | Tables"
  }, [])

  const { data: resData, isError, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  if(isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" })
  }

  // Get filtered tables based on current status
  const filteredTables = React.useMemo(() => {
    if (!resData?.data?.data) return [];
    
    let tables = [...resData.data.data];
    
    // Sort tables by tableNo
    tables.sort((a, b) => a.tableNo - b.tableNo);
    
    if (status === "all") {
      return tables;
    } else {
      return tables.filter(table => table.status?.toLowerCase() === status.toLowerCase());
    }
  }, [resData, status]);

  // Optimized animation variants - faster transitions
  const containerVariants = {
    hidden: { opacity: 0.95 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.15,
        when: "beforeChildren", 
        staggerChildren: 0.01
      }
    },
    exit: { 
      opacity: 0.95,
      transition: { 
        duration: 0.1
      }
    }
  };

  const headerVariants = {
    hidden: { y: -10, opacity: 0 }, // Reduced travel distance
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300, // Increased stiffness
        damping: 15, // Adjusted damping
        mass: 0.6, // Lower mass for faster motion
        duration: 0.2 // Explicit duration cap
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.95 }, // Less scale difference
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350, // Increased stiffness
        damping: 15,
        mass: 0.5, // Lower mass
        duration: 0.15 // Explicit shorter duration
      }
    },
    hover: { 
      scale: 1.03, // Smaller scale change for faster response
      backgroundColor: "#383838",
      transition: {
        type: "tween", // Changed to tween for immediate response
        duration: 0.1 // Very short duration
      }
    },
    tap: { scale: 0.97 } // Less scale change for tap
  };

  // Loading animation optimizations
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: { 
        duration: 0.8, // Faster rotation
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 0 // No delay between rotations
      }
    }
  };

  const pulseVariants = {
    animate: {
      opacity: [0.3, 0.9, 0.3], // Less extreme opacity changes
      y: [3, 0, 3], // Smaller movement
      transition: {
        duration: 1.2, // Faster pulse
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.5, 1] // Explicit times for better sync
      }
    }
  };

  // Empty state animation optimizations
  const emptyStateVariants = {
    animate: {
      y: [0, -4, 0], // Smaller movement
      scale: [1, 1.01, 1], // Subtle scale
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="bg-[#1f1f1f]">
      <motion.section 
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.95 }}
        transition={{ duration: 0.1 }} 
        className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-hidden"
      >
        <motion.div 
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 md:px-10 py-4"
        >
          <motion.div 
            className="flex items-center gap-4 mb-3 sm:mb-0"
            initial={{ x: -10, opacity: 0 }} // Reduced travel distance
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }} // Faster appear
          >
            <BackButton />
            <motion.h1 
              className="text-[#f5f5f5] text-xl sm:text-2xl font-bold tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }} // Faster appear
            >
              Tables
            </motion.h1>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-around gap-2 sm:gap-4 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }} // Faster appear
          >
            <AnimatePresence mode="wait">
              <motion.button
                key={`all-${status === 'all'}`}
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                onClick={() => setStatus("all")}
                className={`text-[#ababab] text-sm sm:text-base md:text-lg ${
                  status === "all" ? "bg-[#383838]" : ""
                } rounded-lg px-3 sm:px-4 md:px-5 py-1 sm:py-2 font-semibold`}
              >
                All
              </motion.button>
              
              <motion.button
                key={`booked-${status === 'booked'}`}
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                onClick={() => setStatus("booked")}
                className={`text-[#ababab] text-sm sm:text-base md:text-lg ${
                  status === "booked" ? "bg-[#383838]" : ""
                } rounded-lg px-3 sm:px-4 md:px-5 py-1 sm:py-2 font-semibold`}
              >
                Booked
              </motion.button>
              
              <motion.button
                key={`available-${status === 'available'}`}
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                onClick={() => setStatus("available")}
                className={`text-[#ababab] text-sm sm:text-base md:text-lg ${
                  status === "available" ? "bg-[#383838]" : ""
                } rounded-lg px-3 sm:px-4 md:px-5 py-1 sm:py-2 font-semibold`}
              >
                Available
              </motion.button>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4 sm:px-8 md:px-12 lg:px-16 py-4 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hide"
        >
          {isLoading ? (
            <motion.div 
              className="col-span-full flex flex-col justify-center items-center h-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }} // Faster appear
            >
              <motion.div 
                variants={spinnerVariants}
                animate="animate"
                className="rounded-full h-12 w-12 border-t-2 border-r-2 border-[#025cca]" // Changed border style for better visual
              />
              <motion.p
                variants={pulseVariants}
                animate="animate"
                className="mt-4 text-[#ababab]"
              >
                Loading tables...
              </motion.p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait" presenceAffectsLayout={false}>
              {filteredTables.length > 0 ? (
                <>
                  {filteredTables.map((table, index) => (
                    <TableCard
                      key={table._id}
                      id={table._id}
                      name={table.tableNo}
                      status={table.status}
                      initials={table?.currentOrder?.customerDetails?.name || ""}
                      seats={table.seats}
                    />
                  ))}
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }} // Faster appear
                  className="col-span-full text-center text-[#ababab] text-xl py-10"
                >
                  <motion.div
                    variants={emptyStateVariants}
                    animate="animate"
                    className="inline-flex flex-col items-center"
                  >
                    <motion.p className="mb-2">
                      No {status !== "all" ? status : ""} tables found
                    </motion.p>
                    <motion.div 
                      className="h-1 w-16 bg-gradient-to-r from-transparent via-[#025cca] to-transparent rounded-full"
                      animate={{
                        width: ["30%", "70%", "30%"], // Less extreme width change
                        opacity: [0.6, 0.95, 0.6], // Less extreme opacity change
                        transition: { 
                          duration: 1.5, // Faster animation
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        <BottomNav />
      </motion.section>
    </div>
  );
};

export default Tables;