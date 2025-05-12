const mongoose = require('mongoose');

// Transaction schema for keeping track of inventory changes
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['restock', 'usage', 'adjustment'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  note: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Main inventory schema
const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  minQuantity: {
    type: Number,
    default: 5
  },
  supplier: {
    type: String
  },
  description: {
    type: String
  },
  transactions: [transactionSchema]
}, {
  timestamps: true
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem;