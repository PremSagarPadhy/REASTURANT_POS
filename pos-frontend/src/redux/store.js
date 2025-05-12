import { configureStore } from "@reduxjs/toolkit";
import customerSlice from "./slices/customerSlice"
import cartSlice from "./slices/cartSlice";
import categoryReducer from './slices/categorySlice';
import cartReducer from './slices/cartSlice';
import userSlice from "./slices/userSlice";

const store = configureStore({
    reducer: {
        customer: customerSlice,
        category: categoryReducer,
        cart : cartSlice,
        cart: cartReducer,
        user : userSlice
    },

    devTools: import.meta.env.NODE_ENV !== "production",
});

export default store;
