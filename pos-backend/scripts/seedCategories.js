const Category = require('../models/categoryModel');
const mongoose = require('mongoose');
require('dotenv').config(); // To load environment variables

// Define your menu items arrays (these would come from your actual data)
// Placeholder arrays for demonstration purposes
const softdrinks = [];
const juice = [];
const startersItem = [];
const mainCourse = [];
const beverages = [];
const soups = [];
const desserts = [];
const pizzas = [];
const alcoholicDrinks = [];
const salads = [];

// Your menus data
const menus = [
  { id: 10, name: "Soft Drinks", bgColor: "#735f32", icon: "🍹", items: softdrinks },
  { id: 9, name: "Juice", bgColor: "#4a6163", icon: "🍹", items: juice },
  { id: 1, name: "Starters", bgColor: "#b73e3e", icon: "🍲", items: startersItem },
  { id: 2, name: "Main Course", bgColor: "#5b45b0", icon: "🍛", items: mainCourse },
  { id: 3, name: "Beverages", bgColor: "#7f167f", icon: "🍹", items: beverages },
  { id: 4, name: "Soups", bgColor: "#735f32", icon: "🍜", items: soups },
  { id: 5, name: "Desserts", bgColor: "#1d2569", icon: "🍰", items: desserts },
  { id: 6, name: "Pizzas", bgColor: "#285430", icon: "🍕", items: pizzas },
  { id: 7, name: "Alcoholic Drinks", bgColor: "#b73e3e", icon: "🍺", items: alcoholicDrinks },
  { id: 8, name: "Salads", bgColor: "#5b45b0", icon: "🥗", items: salads }
];

// Function to seed the categories
async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing categories (optional)
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Insert all categories
    const result = await Category.insertMany(menus);
    console.log(`Successfully inserted ${result.length} categories`);
    
    console.log('Categories seeding completed successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeding function
seedCategories();