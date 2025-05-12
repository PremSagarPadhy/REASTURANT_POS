// This file will handle determining which constants source to use

import { menus as localMenus } from './index';
import { toast } from 'react-hot-toast';

let activeMenus = localMenus;

// Try to import the database-generated constants
try {
  // Dynamic import isn't available in regular JavaScript modules this way
  // We'll use a safer approach that doesn't rely on require
  const dbConstants = window.dbConstants;
  if (dbConstants && dbConstants.menus && dbConstants.menus.length > 0) {
    activeMenus = dbConstants.menus;
    console.log('Using database-generated menu constants');
  } else {
    console.log('Using local menu constants (db constants not found or empty)');
  }
} catch (error) {
  console.log('Using local menu constants (db constants file not found)');
}

export const getMenus = () => {
  return activeMenus;
};

export const refreshMenus = async () => {
  try {
    // Fetch the latest menu data from the API
    const response = await fetch('http://localhost:5000/api/category');
    if (response.ok) {
      const freshMenus = await response.json();
      if (freshMenus && freshMenus.length > 0) {
        activeMenus = freshMenus;
        toast.success('Menu data refreshed from database');
        return freshMenus;
      }
    }
    throw new Error('Failed to fetch menu data');
  } catch (error) {
    toast.error('Could not refresh menu data');
    console.error('Error refreshing menus:', error);
    return activeMenus; // Return existing menus as fallback
  }
};