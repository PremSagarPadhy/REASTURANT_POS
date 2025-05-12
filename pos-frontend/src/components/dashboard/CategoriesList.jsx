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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Menu Categories</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <IoAddCircle size={20} />
          Add Category
        </button>
      </div>
      
      {categories.length === 0 ? (
        <div className="p-4 bg-gray-800 text-gray-300 rounded text-center">
          No categories found. Create your first category!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </div>
      )}
      
      {isModalOpen && (
        <CategoryModal setIsCategoryModalOpen={setIsModalOpen} />
      )}
    </div>
  );
};

export default CategoriesList;