import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { createCategory, editCategory } from "../../redux/slices/categorySlice";
import { toast } from "react-hot-toast";

const CategoryModal = ({ setIsCategoryModalOpen, editMode = false, categoryData = null }) => {
  const [categoryName, setCategoryName] = useState(editMode ? categoryData.name : "");
  const [iconEmoji, setIconEmoji] = useState(editMode ? categoryData.icon : "🍽️");
  const [bgColor, setBgColor] = useState(editMode ? categoryData.bgColor : "#5b45b0");
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  
  const predefinedColors = [
    "#b73e3e", "#5b45b0", "#7f167f", "#735f32", 
    "#1d2569", "#285430", "#4a6163", "#1e5128"
  ];
  
  const predefinedEmojis = [
    "🍲", "🍛", "🍹", "🍜", "🍰", "🍕", "🍺", "🥗", 
    "🍴", "🌮", "🍣", "🍝", "🥩", "🍦", "🥪", "🍱"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const categoryDetails = {
        name: categoryName,
        bgColor: bgColor,
        icon: iconEmoji,
      };
      
      let resultAction;
      
      if (editMode) {
        resultAction = await dispatch(editCategory({ 
          id: categoryData.id,
          ...categoryDetails 
        }));
        
        if (editCategory.fulfilled.match(resultAction)) {
          toast.success(`${categoryName} category updated successfully!`);
        } else {
          throw new Error(resultAction.payload || 'Failed to update category');
        }
      } else {
        resultAction = await dispatch(createCategory(categoryDetails));
        
        if (createCategory.fulfilled.match(resultAction)) {
          toast.success(`${categoryName} category added successfully!`);
        } else {
          throw new Error(resultAction.payload || 'Failed to create category');
        }
      }
      
      // Close modal after a short delay
      setTimeout(() => setIsCategoryModalOpen(false), 1000);
    } catch (error) {
      toast.error(error.message || `Error ${editMode ? 'updating' : 'adding'} category`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-[#1a1a1a] w-[500px] p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-white font-semibold">
            {editMode ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={() => setIsCategoryModalOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-gray-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white p-3 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter category name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Background Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full ${
                    bgColor === color ? "ring-2 ring-white" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBgColor(color)}
                  disabled={isLoading}
                />
              ))}
            </div>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full h-10 bg-transparent cursor-pointer rounded-md border border-gray-700"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Category Icon</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {predefinedEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    iconEmoji === emoji ? "bg-gray-700" : "bg-[#2a2a2a]"
                  } hover:bg-gray-700`}
                  onClick={() => setIconEmoji(emoji)}
                  disabled={isLoading}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white p-3 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter emoji or icon"
              maxLength={2}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : null}
              {editMode ? 'Update' : 'Add'} Category
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CategoryModal;