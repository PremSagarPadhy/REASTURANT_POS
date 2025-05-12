import React, { useState, useEffect } from "react";
import TableCard from "../../components/tables/TableCard";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, deleteTable } from "../../https";
import { enqueueSnackbar } from "notistack"; 
import { FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ViewTable = () => {
  const [status, setStatus] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    document.title = "POS | ViewTable"
  }, [])

  // Query to fetch tables
  const { data: resData, isError, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  // Mutation to delete a table
  const deleteTableMutation = useMutation({
    mutationFn: (tableId) => deleteTable(tableId),
    onSuccess: () => {
      // Refetch tables data after successful deletion
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar("Table deleted successfully!", { variant: "success" });
    },
    onError: (error) => {
      console.error("Error deleting table:", error);
      enqueueSnackbar("Failed to delete table", { variant: "error" });
    },
  });

  // Handle delete table function
  const handleDeleteTable = (tableId) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      deleteTableMutation.mutate(tableId);
    }
  };

  if(isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" })
  }

  // Status display text mapping
  const statusDisplay = {
    all: "All Tables",
    booked: "Booked Tables",
    available: "Available Tables"
  };

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren", 
        staggerChildren: 0.1,
        duration: 0.5
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        when: "afterChildren", 
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="bg-[#1a1a1a] h-screen flex flex-col overflow-hidden"
    >
      <motion.div 
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between px-10 py-4"
      >
        {/* Add back button or other left content here if needed */}
        <div></div>
        
        {/* Status dropdown (now positioned on the right) */}
        <div className="relative">
          <motion.button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-[#383838] text-[#ababab] px-4 py-2 rounded-lg"
            whileHover={{ backgroundColor: "#444", scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span 
              className="text-[#f5f5f5]"
              key={status}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {statusDisplay[status]}
            </motion.span>
            <motion.div
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaChevronDown />
            </motion.div>
          </motion.button>
          
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-[#262626] rounded-lg shadow-lg z-50 overflow-hidden"
              >
                <div className="flex flex-col">
                  {["all", "booked", "available"].map((statusOption) => (
                    <motion.button
                      key={statusOption}
                      whileHover={{ 
                        backgroundColor: "#383838", 
                        x: 4,
                        transition: { type: "spring", stiffness: 300 }
                      }}
                      onClick={() => {
                        setStatus(statusOption);
                        setDropdownOpen(false);
                      }}
                      className={`text-left px-4 py-2 text-[#ababab] hover:bg-[#383838] ${
                        status === statusOption ? "bg-[#383838] text-[#f5f5f5]" : ""
                      }`}
                    >
                      {statusDisplay[statusOption]}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div 
        className="h-[calc(100vh-5rem)] px-16 py-4 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <motion.div 
              animate={{ 
                rotate: 360,
                transition: { 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                } 
              }}
              className="rounded-full h-12 w-12 border-t-2 border-b-2 border-[#025cca]"
            ></motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: [0, 1, 0], 
                y: [10, 0, 10],
                transition: { 
                  duration: 2,
                  repeat: Infinity, 
                }
              }}
              className="mt-4 text-[#ababab]"
            >
              Loading tables...
            </motion.p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            >
              <AnimatePresence>
                {filteredTables.length > 0 ? (
                  filteredTables.map((table, index) => (
                    <motion.div
                      key={table._id}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 80,
                        damping: 12
                      }}
                      whileHover={{ 
                        y: -5,
                        scale: 1.03,
                        boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
                        transition: { type: "spring", stiffness: 400, damping: 15 }
                      }}
                    >
                      <TableCard
                        id={table._id}
                        name={table.tableNo}
                        status={table.status}
                        initials={table?.currentOrder?.customerDetails?.name || ""}
                        seats={table.seats}
                        onDelete={handleDeleteTable}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="col-span-full text-center text-[#ababab] text-xl py-10"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -8, 0],
                        scale: [1, 1.03, 1]
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="inline-flex flex-col items-center"
                    >
                      <motion.p className="mb-2">
                        No {status !== "all" ? status : ""} tables found
                      </motion.p>
                      <motion.div 
                        className="h-1 w-16 bg-gradient-to-r from-transparent via-[#025cca] to-transparent rounded-full"
                        animate={{
                          width: ["30%", "80%", "30%"],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </motion.section>
  );
};

export default ViewTable;