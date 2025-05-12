import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeCategory } from '../../redux/slices/categorySlice';
import { toast } from 'react-hot-toast';
import { IoTrash, IoCreate } from 'react-icons/io5';
import CategoryModal from './CategoryModal';

const CategoryItem = ({ category }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useDispatch();
  
  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent triggering other click events
    
    if (window.confirm(`Are you sure you want to delete "${category.name}" category?`)) {
      setIsDeleting(true);
      try {
        const resultAction = await dispatch(removeCategory(category.id));
        
        if (removeCategory.fulfilled.match(resultAction)) {
          toast.success(`${category.name} category deleted successfully!`);
        } else {
          throw new Error(resultAction.error.message || 'Failed to delete category');
        }
      } catch (error) {
        toast.error(error.message || 'Error deleting category');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent triggering other click events
    setIsModalOpen(true);
  };
  
  return (
    <>
      <div 
        className="relative bg-[#2a2a2a] p-4 rounded-lg shadow-md hover:bg-[#333] transition-colors"
        style={{ borderLeft: `4px solid ${category.bgColor}` }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{category.icon}</span>
            <h3 className="font-medium text-white">{category.name}</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleEdit}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <IoCreate />
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {isDeleting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <IoTrash />
              )}
            </button>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm text-gray-400">Items: {category.items?.length || 0}</span>
        </div>
      </div>
      
      {isModalOpen && (
        <CategoryModal 
          setIsCategoryModalOpen={setIsModalOpen} 
          editMode={true}
          categoryData={category}
        />
      )}
    </>
  );
};

export default CategoryItem;