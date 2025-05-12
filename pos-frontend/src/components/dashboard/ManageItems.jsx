import React, { useState, useEffect } from 'react';
import { GrRadialSelected } from "react-icons/gr";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories, addItem, updateItem, removeItem } from "../../redux/slices/categorySlice";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import VegBadge from "../../constants/VegBadge";
import NonVegBadge from "../../constants/NonVegBadge";
import { motion, AnimatePresence } from "framer-motion";

const ManageItems = () => {
    const { categories, loading } = useSelector(state => state.category);
    const [selected, setSelected] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: ""
    });
    const dispatch = useDispatch();

    useEffect(() => {
        // Fetch categories when component mounts
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        if (categories?.length > 0 && !selected) {
            setSelected(categories[0]);
        }
    }, [categories, selected]);

    const handleOpenModal = (item = null) => {
        if (item) {
            // Editing existing item
            setEditingItem(item);
            setFormData({
                name: item.name,
                price: item.price,
                category: item.category || ""
            });
        } else {
            // Adding new item
            setEditingItem(null);
            setFormData({
                name: "",
                price: "",
                category: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            name: "",
            price: "",
            category: ""
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "price" ? parseFloat(value) || "" : value
        }));
    };
    
    const handleVegClick = () => {
        setFormData(prev => ({
            ...prev,
            category: "Veg"
        }));
    };

    const handleNonVegClick = () => {
        setFormData(prev => ({
            ...prev,
            category: "Non-Veg"
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (!selected) {
                toast.error("No category selected");
                return;
            }

            const categoryId = selected.id;
            
            if (editingItem) {
                // Editing existing item
                const result = await dispatch(updateItem({
                    categoryId,
                    itemId: editingItem.id,
                    itemData: formData
                }));
                
                if (updateItem.fulfilled.match(result)) {
                    toast.success("Item updated successfully");
                    handleCloseModal();
                } else {
                    throw new Error(result.payload || 'Failed to update item');
                }
            } else {
                // Adding new item
                const result = await dispatch(addItem({
                    categoryId,
                    itemData: formData
                }));
                
                if (addItem.fulfilled.match(result)) {
                    toast.success("Item added successfully");
                    handleCloseModal();
                } else {
                    throw new Error(result.payload || 'Failed to add item');
                }
            }
        } catch (error) {
            console.error("Error saving item:", error);
            toast.error(`Failed to save item: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDeleteItem = async (itemToDelete) => {
        if (!window.confirm("Are you sure you want to delete this item?")) {
            return;
        }
        
        try {
            if (!selected) {
                toast.error("No category selected");
                return;
            }

            const categoryId = selected.id;
            
            // Delete the item
            const result = await dispatch(removeItem({
                categoryId, 
                itemId: itemToDelete.id
            }));
            
            if (removeItem.fulfilled.match(result)) {
                toast.success("Item deleted successfully");
            } else {
                throw new Error(result.payload || 'Failed to delete item');
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            toast.error(`Failed to delete item: ${error.message || 'Unknown error'}`);
        }
    };

    if (loading || (!selected && categories?.length > 0)) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="grid grid-cols-4 gap-4 px-10 py-4 w-[100%]">
                {categories?.map((menu) => (
                    <motion.div
                        key={menu.id}
                        className="flex flex-col items-start justify-between p-4 rounded-lg h-[100px] cursor-pointer"
                        style={{ backgroundColor: menu.bgColor }}
                        onClick={() => setSelected(menu)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <div className="flex items-center justify-between w-full">
                            <h1 className="text-[#f5f5f5] text-lg font-semibold">
                                {menu.icon} {menu.name}
                            </h1>
                            <AnimatePresence>
                                {selected?.id === menu.id && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <GrRadialSelected className="text-white" size={20} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <p className="text-[#ababab] text-sm font-semibold">
                            {menu.items?.length || 0} Items
                        </p>
                    </motion.div>
                ))}
            </div>

            <hr className="border-[#2a2a2a] border-t-2 mt-4" />

            <div className="flex justify-between items-center px-10 py-4">
                <h2 className="text-xl font-semibold text-white">{selected?.name} Items</h2>
                <motion.button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FaPlus /> Add New Item
                </motion.button>
            </div>

            <div className="grid grid-cols-4 gap-4 px-10 py-4 w-[100%]">
                <AnimatePresence mode="wait">
                    {selected?.items?.length > 0 ? (
                        selected.items.map((item) => (
                            <motion.div
                                key={item.id}
                                className="flex flex-col items-start justify-between p-4 rounded-lg h-[150px] cursor-pointer bg-[#1f1f1f] hover:bg-[#2a2a2a]"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                whileHover={{ y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <h1 className="text-[#f5f5f5] text-lg font-semibold">
                                        {item.name}
                                    </h1>
                                    <div className="flex gap-2">
                                        <motion.button 
                                            onClick={() => handleOpenModal(item)} 
                                            className="text-[#02cacf] p-1 rounded-lg"
                                            whileHover={{ backgroundColor: "#02cacf20" }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <FaEdit size={18} />
                                        </motion.button>
                                        <motion.button 
                                            onClick={() => handleDeleteItem(item)} 
                                            className="text-[#ca0202] p-1 rounded-lg"
                                            whileHover={{ backgroundColor: "#ca020220" }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <FaTrash size={18} />
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                    <p className="text-[#f5f5f5] text-xl font-bold">
                                        ₹{item.price}
                                    </p>
                                    {item.category === "Veg" ? (
                                        <VegBadge />
                                    ) : item.category === "Non-Veg" ? (
                                        <NonVegBadge />
                                    ) : item.category ? (
                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                            {item.category}
                                        </span>
                                    ) : null}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div 
                            className="col-span-4 text-center text-gray-400 py-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            No items available in this category.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal with animation */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="bg-[#1f1f1f] p-6 rounded-lg w-full max-w-md"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <h2 className="text-xl font-bold text-white mb-4">
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-[#2a2a2a] text-white p-2 rounded border border-gray-700"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full bg-[#2a2a2a] text-white p-2 rounded border border-gray-700"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 mb-1">Food Type</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex flex-col items-center">
                                            <VegBadge 
                                                onClick={handleVegClick} 
                                            />
                                            <span className="text-xs text-gray-300 mt-1">Veg</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <NonVegBadge 
                                                onClick={handleNonVegClick} 
                                            />
                                            <span className="text-xs text-gray-300 mt-1">Non-Veg</span>
                                        </div>
                                        {formData.category && (
                                            <div className="ml-4 text-sm text-white">
                                                Selected: {formData.category}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 mt-6">
                                    <motion.button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 bg-gray-700 text-white rounded"
                                        whileHover={{ backgroundColor: "#4a4a4a" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        className="px-4 py-2 bg-[#2e4a40] text-white rounded"
                                        whileHover={{ backgroundColor: "#3a5a50" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {editingItem ? 'Update' : 'Add'} Item
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageItems;