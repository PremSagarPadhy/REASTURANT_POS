import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { updateCategory } from "../../redux/slices/categorySlice";

const EditCategoryModal = ({ setIsEditModalOpen, category }) => {
  const [categoryName, setCategoryName] = useState(category.name);
  const [iconEmoji, setIconEmoji] = useState(category.icon);
  const [bgColor, setBgColor] = useState(category.bgColor);
  const dispatch = useDispatch();
  
  const predefinedColors = [
    "#b73e3e", "#5b45b0", "#7f167f", "#735f32", 
    "#1d2569", "#285430", "#4a6163", "#1e5128"
  ];
  
  const predefinedEmojis = [
    "🍲", "🍛", "🍹", "🍜", "🍰", "🍕", "🍺", "🥗", 
    "🍴", "🌮", "🍣", "🍝", "🥩", "🍦", "🥪", "🍱"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create updated category object
    const updatedCategory = {
      ...category,
      name: categoryName,
      bgColor: bgColor,
      icon: iconEmoji,
    };
    
    // Dispatch action to update the category
    dispatch(updateCategory(updatedCategory));
    
    // Close the modal
    setIsEditModalOpen(false);
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
        className="bg-[#1a1a1a] w-[500px] p-6 rounded-lg shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-white font-semibold">Edit Category</h2>
          <button
            onClick={() => setIsEditModalOpen(false)}
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
                />
              ))}
            </div>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full h-10 bg-transparent cursor-pointer rounded-md border border-gray-700"
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
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              Update Category
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditCategoryModal;