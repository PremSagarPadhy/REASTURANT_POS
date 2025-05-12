import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    orderId: "",
    customerName: "",
    customerPhone: "",
    guests: 0,
    table: null
};

const customerSlice = createSlice({
    name: "customer",
    initialState,
    reducers: {
        setCustomer: (state, action) => {
            const { name, phone, guests, table, orderId } = action.payload;
            
            // Use provided orderId or generate one
            state.orderId = orderId || `order-${Date.now()}`;
            state.customerName = name || "";
            state.customerPhone = phone || "";
            state.guests = guests || 0;
            
            // Set table if provided
            if (table) {
                state.table = table;
            }
        },

        removeCustomer: (state) => {
            state.customerName = "";
            state.customerPhone = "";
            state.guests = 0;
            state.table = null;
        },

        updateTable: (state, action) => {
            state.table = action.payload.table;
        }
    }
});

export const { setCustomer, removeCustomer, updateTable } = customerSlice.actions;
export default customerSlice.reducer;