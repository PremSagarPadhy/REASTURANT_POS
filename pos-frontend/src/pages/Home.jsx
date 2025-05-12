import React, { useEffect, useState } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const [earnings, setEarnings] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);
  const [todayInProgress, setTodayInProgress] = useState(0);
  const [yesterdayInProgress, setYesterdayInProgress] = useState(0);
  const [progressChange, setProgressChange] = useState(0);

  // Add this to set background color on the document body
  useEffect(() => {
    // Set background color on mount
    document.body.style.backgroundColor = "#1f1f1f";

    // Reset to original on unmount
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    document.title = "POS | Home";

    const fetchEarnings = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `http://localhost:8000/api/payment/daily-earnings?date=${today}`
        );

        if (response.data.success) {
          const { todayEarnings, yesterdayEarnings } = response.data;
          const percentageChange =
            yesterdayEarnings > 0
              ? ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100
              : todayEarnings > 0
              ? 100
              : 0;

          setEarnings(todayEarnings);
          setProfitLoss(percentageChange);
        }
      } catch (error) {
        console.error("Error fetching earnings:", error);
      }
    };

    const fetchOrderComparison = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/order/comparison", {
          withCredentials: true 
        });

        if (response.data.success) {
          const { todayInProgress, yesterdayInProgress } = response.data;
          const percentageChange =
            yesterdayInProgress > 0
              ? ((todayInProgress - yesterdayInProgress) / yesterdayInProgress) * 100
              : todayInProgress > 0
              ? 100
              : 0;

          setTodayInProgress(todayInProgress);
          setYesterdayInProgress(yesterdayInProgress);
          setProgressChange(percentageChange);
        }
      } catch (error) {
        console.error("Error fetching order comparison:", error);
      }
    };

    fetchEarnings();
    fetchOrderComparison();
  }, []);

  const roundedProfitLoss = profitLoss.toFixed(2);
  const roundedProgressChange = progressChange.toFixed(2);

  return (
    <AnimatePresence mode="sync">
      <motion.section 
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex gap-3"
        style={{ backgroundColor: "#1f1f1f" }}
      >
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-[3]"
        >
          <Greetings />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center w-full gap-3 px-8 mt-8"
          >
            <MiniCard
              title="Total Earnings"
              icon={<BsCashCoin />}
              number={earnings}
              footerNum={roundedProfitLoss}
              delay={0.4}
            />
            <MiniCard
              title="In Progress"
              icon={<GrInProgress />}
              number={todayInProgress}
              footerNum={roundedProgressChange}
              delay={0.5}
            />
          </motion.div>
          <RecentOrders />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-[2]"
        >
          <PopularDishes />
        </motion.div>
        <BottomNav />
      </motion.section>
    </AnimatePresence>
  );
};

export default Home;