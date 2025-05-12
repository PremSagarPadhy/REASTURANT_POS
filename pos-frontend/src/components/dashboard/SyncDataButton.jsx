import React from 'react';
import { useDispatch } from 'react-redux';
import { fetchCategories } from '../../redux/slices/categorySlice';
import { FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const SyncDataButton = () => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const dispatch = useDispatch();

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await dispatch(fetchCategories()).unwrap();
      toast.success('Menu data refreshed from database');
    } catch (error) {
      toast.error('Failed to refresh menu data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={isRefreshing ? { rotate: 360 } : {}}
        transition={isRefreshing ? { 
          duration: 1, 
          repeat: Infinity, 
          ease: "linear" 
        } : {}}
      >
        <FaSync size={18} />
      </motion.div>
      {isRefreshing ? 'Refreshing...' : 'Refresh Menu Data'}
    </motion.button>
  );
};

export default SyncDataButton;