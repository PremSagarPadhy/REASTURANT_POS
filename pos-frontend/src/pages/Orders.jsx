import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack";

const Orders = () => {
  const [status, setStatus] = useState("all");

  useEffect(() => {
    document.title = "POS | Orders";
  }, []);

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  // Filter orders based on the orderStatus property
  const filteredOrders = resData?.data?.data?.filter((order) => {
    // Return all orders if 'all' is selected
    if (status === "all") return true;
    
    // Map frontend status values to backend status values
    const statusMapping = {
      "progress": "In Progress",
      "ready": "Ready",
      "completed": "Completed"
    };
    
    // Compare with the expected backend status format
    return order.orderStatus === statusMapping[status];
  });

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Orders
          </h1>
        </div>
        <div className="flex items-center justify-around gap-4">
          {[
            { label: "All", value: "all" },
            { label: "In Progress", value: "progress" },
            { label: "Ready", value: "ready" },
            { label: "Completed", value: "completed" },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`text-[#ababab] text-lg px-5 py-2 font-semibold rounded-lg ${
                status === value ? "bg-[#383838]" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-16 py-4 overflow-y-scroll scrollbar-hide h-[calc(100%-9rem)]">
        {filteredOrders?.length > 0 ? (
          filteredOrders.map((order) => <OrderCard key={order._id} order={order} />)
        ) : (
          <p className="col-span-3 text-gray-500">No orders available</p>
        )}
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;