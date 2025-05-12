const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  bgColor: {
    type: String,
    required: true,
    default: "#5b45b0"
  },
  icon: {
    type: String,
    required: true,
    default: "🍽️"
  },
  items: {
    type: Array,
    default: []
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;