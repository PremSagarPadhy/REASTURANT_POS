const Category = require('../models/categoryModel');

// Controller functions for categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ id: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({ id: parseInt(req.params.id) });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, bgColor, icon } = req.body;
    
    // Find the highest ID and add 1
    const maxIdCategory = await Category.findOne().sort('-id');
    const nextId = maxIdCategory ? maxIdCategory.id + 1 : 1;
    
    // Create new category
    const newCategory = new Category({
      id: nextId,
      name,
      bgColor,
      icon,
      items: []
    });
    
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, bgColor, icon } = req.body;
    const categoryId = parseInt(req.params.id);
    
    const updateData = { 
      ...(name && { name }),
      ...(bgColor && { bgColor }),
      ...(icon && { icon })
    };

    const updatedCategory = await Category.findOneAndUpdate(
      { id: categoryId },
      updateData,
      { new: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const deletedCategory = await Category.findOneAndDelete({ id: categoryId });
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json({ message: 'Category deleted successfully', id: categoryId });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

// Item Management Functions
const addItemToCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, price, category } = req.body;
    
    // Validate required fields
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Item name and price are required' });
    }
    
    // Find the category
    const existingCategory = await Category.findOne({ id: categoryId });
    
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Create a new item
    const items = [...existingCategory.items];
    const newId = items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
    
    const newItem = {
      id: newId,
      name,
      price: parseFloat(price),
      ...(category && { category })
    };
    
    items.push(newItem);
    
    // Update the category
    const updatedCategory = await Category.findOneAndUpdate(
      { id: categoryId },
      { $set: { items } },
      { new: true }
    );
    
    res.status(201).json({ 
      message: 'Item added successfully',
      category: updatedCategory,
      item: newItem
    });
  } catch (error) {
    console.error('Error adding item to category:', error);
    res.status(500).json({ message: 'Error adding item', error: error.message });
  }
};

const updateItemInCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const itemId = parseInt(req.params.itemId);
    const updateData = req.body;
    
    // Find the category
    const category = await Category.findOne({ id: categoryId });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Find the item
    const itemIndex = category.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in this category' });
    }
    
    // Update the item
    const updatedItems = [...category.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      ...updateData
    };
    
    // Save the updated category
    const updatedCategory = await Category.findOneAndUpdate(
      { id: categoryId },
      { $set: { items: updatedItems } },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Item updated successfully',
      category: updatedCategory,
      item: updatedItems[itemIndex]
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
};

const deleteItemFromCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const itemId = parseInt(req.params.itemId);
    
    // Find the category
    const category = await Category.findOne({ id: categoryId });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if item exists
    if (!category.items.some(item => item.id === itemId)) {
      return res.status(404).json({ message: 'Item not found in this category' });
    }
    
    // Filter out the item
    const updatedItems = category.items.filter(item => item.id !== itemId);
    
    // Save the updated category
    const updatedCategory = await Category.findOneAndUpdate(
      { id: categoryId },
      { $set: { items: updatedItems } },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Item deleted successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
};

const getCategoryItems = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    // Find the category
    const category = await Category.findOne({ id: categoryId });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json(category.items || []);
  } catch (error) {
    console.error('Error fetching category items:', error);
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
};

const getCategoryItem = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const itemId = parseInt(req.params.itemId);
    
    // Find the category
    const category = await Category.findOne({ id: categoryId });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Find the item
    const item = category.items.find(item => item.id === itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found in this category' });
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addItemToCategory,
  updateItemInCategory,
  deleteItemFromCategory,
  getCategoryItems,
  getCategoryItem
};