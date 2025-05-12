const InventoryItem = require('../models/inventoryModel');

// Get all inventory items
const getAllItems = async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
};

// Get item by ID
const getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory item', error: error.message });
  }
};

// Create new inventory item
const createItem = async (req, res) => {
  try {
    const { name, sku, category, quantity, unit, price, minQuantity, supplier, description } = req.body;
    
    // Check if SKU already exists
    if (sku) {
      const existingSku = await InventoryItem.findOne({ sku });
      if (existingSku) {
        return res.status(400).json({ message: 'Item with this SKU already exists' });
      }
    }
    
    const newItem = new InventoryItem({
      name,
      sku,
      category,
      quantity,
      unit,
      price,
      minQuantity,
      supplier,
      description
    });
    
    // Add initial transaction if quantity > 0
    if (quantity > 0) {
      newItem.transactions.push({
        type: 'restock',
        quantity,
        note: 'Initial inventory'
      });
    }
    
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
};

// Update inventory item
const updateItem = async (req, res) => {
  try {
    const { name, sku, category, unit, price, minQuantity, supplier, description } = req.body;
    
    // Don't allow direct quantity updates through this endpoint
    const updateData = { 
      name, 
      sku, 
      category, 
      unit, 
      price, 
      minQuantity, 
      supplier, 
      description 
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
};

// Delete inventory item
const deleteItem = async (req, res) => {
  try {
    const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json({ message: 'Inventory item deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
};

// Restock an item
const restockItem = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Add transaction and update quantity
    item.transactions.push({
      type: 'restock',
      quantity,
      note
    });
    
    item.quantity += parseFloat(quantity);
    item.updatedAt = Date.now();
    
    await item.save();
    
    res.status(200).json(item);
  } catch (error) {
    console.error('Error restocking item:', error);
    res.status(500).json({ message: 'Error restocking item', error: error.message });
  }
};

// Use/consume an item
const useItem = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    if (item.quantity < quantity) {
      return res.status(400).json({ message: 'Not enough quantity available' });
    }
    
    // Add transaction and update quantity
    item.transactions.push({
      type: 'usage',
      quantity,
      note
    });
    
    item.quantity -= parseFloat(quantity);
    item.updatedAt = Date.now();
    
    await item.save();
    
    res.status(200).json(item);
  } catch (error) {
    console.error('Error using item:', error);
    res.status(500).json({ message: 'Error using item', error: error.message });
  }
};

// Get item transactions
const getItemTransactions = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(item.transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    const totalItems = await InventoryItem.countDocuments();
    
    const lowStockItems = await InventoryItem.find({
      $expr: { $lte: ["$quantity", "$minQuantity"] }
    }).countDocuments();
    
    const totalValue = await InventoryItem.aggregate([
      {
        $group: {
          _id: null,
          value: { $sum: { $multiply: ["$price", "$quantity"] } }
        }
      }
    ]);
    
    const categoryItemCounts = await InventoryItem.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      totalItems,
      lowStockItems,
      totalValue: totalValue.length > 0 ? totalValue[0].value : 0,
      categoryBreakdown: categoryItemCounts
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ message: 'Error fetching inventory statistics', error: error.message });
  }
};

// Get chart data for inventory
const getChartData = async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    let daysToLookBack;
    switch (period) {
      case '30days':
        daysToLookBack = 30;
        break;
      case '90days':
        daysToLookBack = 90;
        break;
      case '7days':
      default:
        daysToLookBack = 7;
        break;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToLookBack);
    
    // Prepare date array for consistent chart data
    const dates = [];
    const currentDate = new Date();
    for (let i = daysToLookBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      dates.push({
        date: date.toISOString().split('T')[0],
        formatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    // Get all inventory items with transactions in the period
    const items = await InventoryItem.find({
      "transactions.date": { $gte: startDate }
    });
    
    // Process transaction data for the chart
    const chartData = {
      labels: dates.map(d => d.formatted),
      usage: Array(dates.length).fill(0),
      restock: Array(dates.length).fill(0)
    };
    
    // Aggregate transactions by date and type
    items.forEach(item => {
      item.transactions.forEach(transaction => {
        if (transaction.date >= startDate) {
          const transactionDate = transaction.date.toISOString().split('T')[0];
          const dateIndex = dates.findIndex(d => d.date === transactionDate);
          
          if (dateIndex !== -1) {
            if (transaction.type === 'usage') {
              chartData.usage[dateIndex] += transaction.quantity;
            } else if (transaction.type === 'restock') {
              chartData.restock[dateIndex] += transaction.quantity;
            }
          }
        }
      });
    });
    
    // Calculate total usage and restock for the period
    const totalUsage = chartData.usage.reduce((sum, val) => sum + val, 0);
    const totalRestock = chartData.restock.reduce((sum, val) => sum + val, 0);
    
    res.status(200).json({
      chartData,
      totals: {
        usage: totalUsage,
        restock: totalRestock,
        net: totalRestock - totalUsage
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Error fetching inventory chart data', error: error.message });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  restockItem,
  useItem,
  getItemTransactions,
  getInventoryStats,
  getChartData
};