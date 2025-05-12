import React from "react";
import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName } from "../../utils/index";
import { motion } from "framer-motion";

const OrderList = ({ order }) => {
  return (
    <motion.div 
      whileHover={{ 
        scale: 1.02, 
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        transition: { duration: 0.2 }
      }}
      className="flex items-center gap-5 mb-3 p-2 rounded-lg"
    >
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9, rotate: -5 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg"
      >
        {getAvatarName(order.customerDetails.name)}
      </motion.button>
      <div className="flex items-center justify-between w-[100%]">
        <motion.div 
          initial={{ x: -5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-start gap-1"
        >
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            {order.customerDetails.name}
          </h1>
          <p className="text-[#ababab] text-sm">{order.items.length} Items</p>
        </motion.div>

        <motion.h1 
          whileHover={{ scale: 1.05 }}
          className="text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg p-1"
        >
          Table <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" />{" "}
          {order.table.tableNo}
        </motion.h1>

        <motion.div 
          initial={{ x: 5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-end gap-2"
        >
          {order.orderStatus === "Ready" ? (
            <motion.p 
              whileHover={{ scale: 1.1 }}
              className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg flex items-center"
            >
              <motion.span
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                <FaCheckDouble className="inline mr-2" />
              </motion.span>
              {order.orderStatus}
            </motion.p>
          ) : order.orderStatus === "Completed" ? (
            <motion.p 
              whileHover={{ scale: 1.1 }}
              className="text-blue-500 bg-[#2e3f6e] px-2 py-1 rounded-lg flex items-center"
            >
              <motion.span
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                <FaCheckDouble className="inline mr-2" />
              </motion.span>
              {order.orderStatus}
            </motion.p>
          ) : (
            <motion.p 
              whileHover={{ scale: 1.1 }}
              className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg flex items-center"
            >
              <motion.span
                animate={{ 
                  opacity: [1, 0.5, 1],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                <FaCircle className="inline mr-2" />
              </motion.span>
              {order.orderStatus}
            </motion.p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OrderList;