import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../https';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'category/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'category/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await api.addCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create category');
    }
  }
);

export const editCategory = createAsyncThunk(
  'category/editCategory',
  async ({ id, ...categoryData }, { rejectWithValue }) => {
    try {
      const response = await api.updateCategory(id, categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update category');
    }
  }
);

export const removeCategory = createAsyncThunk(
  'category/removeCategory',
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteCategory(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete category');
    }
  }
);

export const addItem = createAsyncThunk(
  'category/addItem',
  async ({ categoryId, itemData }, { rejectWithValue }) => {
    try {
      const response = await api.addItemToCategory(categoryId, itemData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add item');
    }
  }
);

export const updateItem = createAsyncThunk(
  'category/updateItem',
  async ({ categoryId, itemId, itemData }, { rejectWithValue }) => {
    try {
      const response = await api.updateItemInCategory(categoryId, itemId, itemData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update item');
    }
  }
);

export const removeItem = createAsyncThunk(
  'category/removeItem',
  async ({ categoryId, itemId }, { rejectWithValue }) => {
    try {
      const response = await api.deleteItemFromCategory(categoryId, itemId);
      return { ...response.data, itemId, categoryId };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete item');
    }
  }
);

const initialState = {
  categories: [],
  loading: false,
  error: null
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.loading = false;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update category
      .addCase(editCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(editCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete category
      .addCase(removeCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
        state.loading = false;
      })
      .addCase(removeCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add item
      .addCase(addItem.fulfilled, (state, action) => {
        const { category } = action.payload;
        const index = state.categories.findIndex(cat => cat.id === category.id);
        if (index !== -1) {
          state.categories[index] = category;
        }
      })
      
      // Update item
      .addCase(updateItem.fulfilled, (state, action) => {
        const { category } = action.payload;
        const index = state.categories.findIndex(cat => cat.id === category.id);
        if (index !== -1) {
          state.categories[index] = category;
        }
      })
      
      // Remove item
      .addCase(removeItem.fulfilled, (state, action) => {
        const { category, categoryId } = action.payload;
        const index = state.categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
          state.categories[index] = category;
        }
      });
  }
});

export default categorySlice.reducer;