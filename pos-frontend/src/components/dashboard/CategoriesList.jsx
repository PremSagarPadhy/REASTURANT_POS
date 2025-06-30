import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../redux/slices/categorySlice';
import CategoryItem from './CategoryItem';
import CategoryModal from './CategoryModal';
import { IoAddCircle } from 'react-icons/io5';

const CategoriesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(state => state.category);
  
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error loading categories: {error}
      </div>
    );
  }
  
  return (
    <div className="p-3 sm:p-4 lg:p-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">Menu Categories</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your restaurant categories</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 sm:px-4 rounded-md transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          <IoAddCircle size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add Category</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
      
      {categories.length === 0 ? (
        <div className="p-4 sm:p-6 bg-gray-800 text-gray-300 rounded text-center">
          <div className="text-4xl sm:text-6xl mb-4">📋</div>
          <h3 className="text-lg sm:text-xl font-medium mb-2">No categories found</h3>
          <p className="text-sm sm:text-base">Create your first category to get started!</p>
        </div>
        
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(category => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </div>
      )}
      
      <div className="pb-36"></div>
      
      {isModalOpen && (
        <CategoryModal setIsCategoryModalOpen={setIsModalOpen} />
      )}
    </div>
  );
};

export default CategoriesList;