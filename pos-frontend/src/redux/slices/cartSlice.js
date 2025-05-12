import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addItems: (state, action) => {
            // Ensure payload has a string id instead of Date object
            const item = action.payload;
            // If the item doesn't have an id, or it's a Date object, convert it to string
            if (!item.id || item.id instanceof Date) {
                item.id = typeof item.id === 'object' ? String(Date.now()) : item.id;
            }
            state.push(item);
        },

        removeItem: (state, action) => {
            return state.filter(item => item.id !== action.payload); // Fixed equality check
        },

        removeAllItems: (state) => {
            return [];
        }
    }
});

export const getTotalPrice = (state) => state.cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
export const { addItems, removeItem, removeAllItems } = cartSlice.actions;
export default cartSlice.reducer;