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
        className="relative bg-[#2a2a2a] p-3 sm:p-4 rounded-lg shadow-md hover:bg-[#333] transition-colors w-full"
        style={{ borderLeft: `4px solid ${category.bgColor}` }}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <span className="text-xl sm:text-2xl flex-shrink-0">{category.icon}</span>
            <h3 className="font-medium text-white text-sm sm:text-base truncate">{category.name}</h3>
          </div>
          <div className="flex space-x-2 flex-shrink-0 self-end sm:self-auto">
            <button 
              onClick={handleEdit}
              className="p-1.5 sm:p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
              title="Edit Category"
            >
              <IoCreate className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 sm:p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
              title="Delete Category"
            >
              {isDeleting ? (
                <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <IoTrash className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <span className="text-xs sm:text-sm text-gray-400">Items: {category.items?.length || 0}</span>
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