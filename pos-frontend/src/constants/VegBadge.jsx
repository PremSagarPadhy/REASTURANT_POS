import React from "react";
import { motion } from "framer-motion";
import "./Badge.css";

const VegBadge = ({ onClick }) => {
  return (
    <motion.button 
      className="badge-container veg" 
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span 
        className="circle"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
      />
    </motion.button>
  );
};

export default VegBadge;
