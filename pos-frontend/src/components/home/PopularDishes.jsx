import React, { useState, useEffect } from "react";
import axios from "axios";
import { popularDishes } from "../../constants";
import { motion, AnimatePresence } from "framer-motion";

const PopularDishes = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleDishes, setVisibleDishes] = useState([]);

  useEffect(() => {
    const fetchPopularDishes = async () => {
      try {
        setLoading(true);
        
        // Use the confirmed working URL
        const apiUrl = 'http://localhost:8000/api/order/popular-dishes';
        
        console.log("Fetching popular dishes from:", apiUrl);
        
        const response = await axios.get(apiUrl, {
          withCredentials: true
        });
        
        if (response.data && response.data.success) {
          console.log("API dishes:", response.data.data.map(d => d.name));
          console.log("Constant dishes:", popularDishes.map(d => d.name));
          
          // Map the API data to include images from the constants
          const dishesWithImages = response.data.data.map((dish, index) => {
            // Normalize the dish name for better matching
            const normalizedDishName = dish.name.toLowerCase().trim();
            
            // Try exact match first
            let matchedDish = popularDishes.find(
              (constDish) => constDish.name.toLowerCase().trim() === normalizedDishName
            );
            
            // If no exact match, try partial matching
            if (!matchedDish) {
              matchedDish = popularDishes.find(
                (constDish) => normalizedDishName.includes(constDish.name.toLowerCase().trim()) || 
                              constDish.name.toLowerCase().trim().includes(normalizedDishName)
              );
            }
            
            // Assign a different default image based on index if still no match
            const defaultImage = popularDishes[index % popularDishes.length].image;
            
            console.log(`Dish: ${dish.name}, Found match: ${matchedDish ? 'Yes' : 'No'}`);
            
            return {
              id: index + 1,
              name: dish.name,
              numberOfOrders: dish.numberOfOrders,
              image: matchedDish ? matchedDish.image : defaultImage
            };
          });
          
          setDishes(dishesWithImages);
        } else {
          // Fallback to constants if no data or unsuccessful response
          console.warn("No data returned from API, using constants instead");
          setDishes(popularDishes);
        }
      } catch (err) {
        console.error("Error fetching popular dishes:", err);
        setError("Failed to fetch popular dishes");
        
        // Fallback to constant data if API fails
        setDishes(popularDishes);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularDishes();
  }, []);

  // Using a separate useEffect to handle the animation when dishes change
  useEffect(() => {
    setVisibleDishes(dishes);
  }, [dishes]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-6 pr-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
        className="bg-[#1a1a1a] w-full rounded-lg shadow-lg"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="flex justify-between items-center px-6 py-4"
        >
          <motion.h1 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="text-[#f5f5f5] text-lg font-semibold tracking-wide"
          >
            Popular Dishes
          </motion.h1>
          <motion.a 
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            href="" 
            className="text-[#025cca] text-sm font-semibold"
          >
            View all
          </motion.a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="overflow-y-scroll h-[680px] scrollbar-hide"
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div 
                animate={{ 
                  rotate: 360,
                  transition: { 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  } 
                }}
                className="rounded-full h-10 w-10 border-t-2 border-b-2 border-[#025cca]"
              ></motion.div>
            </div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-[#f5f5f5] text-center py-4"
            >
              {error}
            </motion.div>
          ) : (
            <div className="relative">
              <AnimatePresence mode="wait">
                {visibleDishes.map((dish, index) => (
                  <motion.div
                    key={`dish-${dish.id}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        opacity: { duration: 0.4 },
                        y: { duration: 0.3, ease: "easeOut" },
                        delay: index * 0.1
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      y: -20,
                      transition: { 
                        opacity: { duration: 0.3 },
                        y: { duration: 0.2 }
                      }
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      transition: { duration: 0.2 }
                    }}
                    className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mt-4 mx-6"
                  >
                    <motion.h1 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                      className="text-[#f5f5f5] font-bold text-xl mr-4"
                    >
                      {dish.id < 10 ? `0${dish.id}` : dish.id}
                    </motion.h1>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9, rotate: -5 }}
                    >
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.05 + 0.3 }}
                        src={dish.image}
                        alt={dish.name}
                        className="w-[50px] h-[50px] rounded-full"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.05 + 0.4 }}
                      className="flex-1"
                    >
                      <motion.h1 
                        className="text-[#f5f5f5] font-semibold tracking-wide"
                      >
                        {dish.name}
                      </motion.h1>
                      <motion.p 
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 + 0.5 }}
                        className="text-[#f5f5f5] text-sm font-semibold mt-1"
                      >
                        <span className="text-[#ababab]">Orders: </span>
                        {dish.numberOfOrders}
                      </motion.p>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PopularDishes;