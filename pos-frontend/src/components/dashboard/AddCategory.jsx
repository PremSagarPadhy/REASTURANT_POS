import React, { useState, useEffect } from "react";
import { FaPlus, FaSync } from "react-icons/fa";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "../../redux/slices/categorySlice";
import CategoryModal from "./CategoryModal";
import CategoryItem from "./CategoryItem";
import { toast } from "react-hot-toast";
import SyncDataButton from './SyncDataButton';

const AddCategory = () => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.category);

  useEffect(() => {
    // Fetch categories when component mounts
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCreateCategory = () => {
    setIsCategoryModalOpen(true);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const loadingVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };

  if (loading && categories.length === 0) {
    return (
      <motion.div 
        className="p-6 bg-[#1a1a1a] min-h-screen text-white flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="flex flex-col items-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div 
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <motion.p 
            className="text-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Loading categories...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <motion.div 
        className="p-6 bg-[#1a1a1a] min-h-screen text-white flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="bg-red-900 p-4 rounded-lg max-w-md text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.p 
            className="text-xl mb-2"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Error Loading Categories
          </motion.p>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {error}
          </motion.p>
          <motion.button
            onClick={() => dispatch(fetchCategories())}
            className="mt-4 px-4 py-2 bg-red-700 rounded-md hover:bg-red-600 transition-colors"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, backgroundColor: "#b91c1c" }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="p-6 bg-[#1a1a1a] min-h-screen text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex justify-between items-center mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.h1 
          className="text-2xl font-bold"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
        </motion.h1>
        <motion.div 
          className="flex gap-3"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SyncDataButton />
          <motion.button
            onClick={handleCreateCategory}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
            whileHover={{ 
              scale: 1.05, 
              backgroundColor: "rgb(126, 34, 206)", 
              boxShadow: "0px 5px 15px rgba(126, 34, 206, 0.4)" 
            }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus className="animate-pulse" /> Add Category
          </motion.button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2"
            variants={loadingVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <FaSync size={16} />
            </motion.div>
            Loading...
          </motion.div>
        )}
      </AnimatePresence>

      <LayoutGroup>
        {categories.length === 0 ? (
          <motion.div 
            className="text-center py-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.p 
              className="text-xl text-gray-400"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              No categories found. Add your first category!
            </motion.p>
            <motion.div
              className="mt-6 inline-block"
              whileHover={{ scale: 1.1 }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <FaPlus 
                size={40} 
                className="mx-auto text-purple-500 opacity-50" 
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                layout
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 25 }
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <CategoryItem category={category} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </LayoutGroup>

      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoryModal setIsCategoryModalOpen={setIsCategoryModalOpen} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddCategory;