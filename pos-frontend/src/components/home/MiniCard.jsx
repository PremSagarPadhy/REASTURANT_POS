import React from 'react';
import { motion } from 'framer-motion';

const MiniCard = ({ title, icon, number, footerNum, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      }}
      className='bg-[#1a1a1a] py-5 px-5 rounded-lg w-[50%] shadow-lg'
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.1 }}
        className='flex items-start justify-between'
      >
        <motion.h1 
          className='text-[#f5f5f5] text-lg font-semibold tracking-wide'
        >
          {title}
        </motion.h1>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"} p-3 rounded-lg text-[#f5f5f5] text-2xl`}
        >
          {icon}
        </motion.button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
      >
        <motion.h1 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          className='text-[#f5f5f5] text-4xl font-bold mt-5'
        >
          {title === "Total Earnings" ? `₹${number}` : number}
        </motion.h1>
        <motion.h1 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.4 }}
          className='text-[#f5f5f5] text-lg mt-2'
        >
          <motion.span 
            animate={{
              color: footerNum >= 0 ? "#02ca3a" : "#ff0000"
            }}
            className={footerNum >= 0 ? "text-[#02ca3a]" : "text-[#ff0000]"}
          >
            {footerNum}%
          </motion.span> than yesterday
        </motion.h1>
      </motion.div>
    </motion.div>
  );
};

export default MiniCard;