import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";
import { motion, AnimatePresence } from "framer-motion";

const RecentOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: resData, isError, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  const filteredOrders = resData?.data?.data ? 
    resData.data.data.filter(order => 
      order.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toString().includes(searchTerm)
    ) : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="px-8 mt-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
        className="bg-[#1a1a1a] w-full h-[450px] rounded-lg shadow-lg"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="flex justify-between items-center px-6 py-4"
        >
          <motion.h1 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="text-[#f5f5f5] text-lg font-semibold tracking-wide"
          >
            Recent Orders
          </motion.h1>
          <motion.a 
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            href="" 
            className="text-[#025cca] text-sm font-semibold"
          >
            View all
          </motion.a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
          className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <FaSearch className="text-[#f5f5f5]" />
          </motion.div>
          <motion.input
            initial={{ width: "90%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, delay: 1.1 }}
            type="text"
            placeholder="Search recent orders"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full"
          />
        </motion.div>

        {/* Order list */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div 
                animate={{ 
                  rotate: 360,
                  transition: { 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  } 
                }}
                className="rounded-full h-10 w-10 border-t-2 border-b-2 border-[#025cca]"
              ></motion.div>
            </div>
          ) : filteredOrders.length > 0 ? (
            <AnimatePresence>
              {filteredOrders.map((order, index) => {
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <OrderList order={order} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                y: [0, -5, 0]
              }}
              transition={{ 
                opacity: { duration: 0.5 },
                y: { 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }}
              className="col-span-3 text-gray-500 text-center mt-10"
            >
              No orders available
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RecentOrders;