import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import {
  addOrder,
  updateOrder,
  createOrderRazorpay,
  updateTable,
  verifyPaymentRazorpay,
} from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

const Bill = ({ editMode, originalOrderId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalPriceWithTax = total + tax;

  const [paymentMethod, setPaymentMethod] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();
  const [newItemsTotal, setNewItemsTotal] = useState(0);
  const [newItemsTax, setNewItemsTax] = useState(0);
  const [newItemsTotalWithTax, setNewItemsTotalWithTax] = useState(0);
  const [originalItems, setOriginalItems] = useState([]);

  // Track original items from the order and calculate new items' cost
  useEffect(() => {
    if (editMode && originalOrderId) {
      // Get the original items from the order data passed via location state
      const { state } = window.history.state || {};
      const orderData = state?.orderData;
      
      if (orderData && orderData.items) {
        // Store original items for comparison
        const originalItemsList = orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));
        
        setOriginalItems(originalItemsList);
        
        // Calculate the cost of new items only
        calculateNewItemsCost(cartData, originalItemsList);
      }
    }
  }, [editMode, originalOrderId, cartData]);

  // Function to calculate the cost of only new items
  const calculateNewItemsCost = (currentCart, originalItems) => {
    // Create a map of original items for easy comparison
    const originalItemsMap = new Map();
    originalItems.forEach(item => {
      originalItemsMap.set(item.name, {
        quantity: item.quantity,
        price: item.price
      });
    });

    // Calculate the total cost of new items or increased quantities
    let newItemsSum = 0;

    currentCart.forEach(item => {
      const originalItem = originalItemsMap.get(item.name);
      
      if (!originalItem) {
        // This is a completely new item
        newItemsSum += item.price;
      } else if (item.quantity > originalItem.quantity) {
        // This item has increased quantity
        const additionalQuantity = item.quantity - originalItem.quantity;
        newItemsSum += (additionalQuantity * (item.price / item.quantity));
      }
    });

    // Calculate tax and total with tax for new items only
    const newTax = (newItemsSum * taxRate) / 100;
    const newTotalWithTax = newItemsSum + newTax;

    setNewItemsTotal(newItemsSum);
    setNewItemsTax(newTax);
    setNewItemsTotalWithTax(newTotalWithTax);
  };

  const handlePlaceOrUpdateOrder = async () => {
    if (!paymentMethod) {
      enqueueSnackbar("Please select a payment method!", {
        variant: "warning",
      });
      return;
    }

    // Make sure cart has items
    if (cartData.length === 0) {
      enqueueSnackbar("Your cart is empty!", {
        variant: "warning",
      });
      return;
    }

    if (editMode) {
      // Handle order update with properly serialized data
      const safeCartItems = cartData.map(item => {
        // Make a clean copy of the item, ensuring id is a string
        return {
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          id: typeof item.id === 'object' ? String(Date.now()) : String(item.id)
        };
      });

      // If there are new items and payment method is Online, process payment for new items only
      if (newItemsTotalWithTax > 0 && paymentMethod === "Online") {
        try {
          const res = await loadScript(
            "https://checkout.razorpay.com/v1/checkout.js"
          );

          if (!res) {
            enqueueSnackbar("Razorpay SDK failed to load. Are you online?", {
              variant: "warning",
            });
            return;
          }

          // Create order for only the new items' amount
          const reqData = {
            amount: newItemsTotalWithTax.toFixed(2),
          };

          const { data } = await createOrderRazorpay(reqData);

          const options = {
            key: `${import.meta.env.VITE_RAZORPAY_KEY_ID}`,
            amount: data.order.amount,
            currency: data.order.currency,
            name: "RESTRO",
            description: "Payment for additional items",
            order_id: data.order.id,
            handler: async function (response) {
              const verification = await verifyPaymentRazorpay(response);
              console.log(verification);
              enqueueSnackbar("Payment successful for additional items", { variant: "success" });

              // Update the order with all items (original + new)
              const orderData = {
                orderId: originalOrderId,
                customerDetails: {
                  name: customerData.customerName,
                  phone: customerData.customerPhone,
                  guests: customerData.guests || 0,
                },
                bills: {
                  total: total,
                  tax: tax,
                  totalWithTax: totalPriceWithTax,
                },
                items: safeCartItems,
                paymentMethod: paymentMethod,
                table: customerData.table?.tableId,
                // Add payment data for the additional items
                additionalPaymentData: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  additionalAmount: newItemsTotalWithTax,
                },
              };
              
              setTimeout(() => {
                updateOrderMutation.mutate(orderData);
              }, 1500);
            },
            prefill: {
              name: customerData.customerName,
              email: "",
              contact: customerData.customerPhone,
            },
            theme: { color: "#025cca" },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (error) {
          console.log(error);
          enqueueSnackbar("Payment Failed!", {
            variant: "error",
          });
        }
      } else {
        // If no new items or payment is not online, just update the order
        const orderData = {
          orderId: originalOrderId,
          customerDetails: {
            name: customerData.customerName,
            phone: customerData.customerPhone,
            guests: customerData.guests || 0,
          },
          bills: {
            total: total,
            tax: tax,
            totalWithTax: totalPriceWithTax,
          },
          items: safeCartItems,
          paymentMethod: paymentMethod,
          table: customerData.table?.tableId
        };
        
        console.log("Updating order with data:", orderData);
        updateOrderMutation.mutate(orderData);
      }
    } else {
      // Original logic for new orders
      if (paymentMethod === "Online") {
        // load the script
        try {
          const res = await loadScript(
            "https://checkout.razorpay.com/v1/checkout.js"
          );

          if (!res) {
            enqueueSnackbar("Razorpay SDK failed to load. Are you online?", {
              variant: "warning",
            });
            return;
          }

          // create order
          const reqData = {
            amount: totalPriceWithTax.toFixed(2),
          };

          const { data } = await createOrderRazorpay(reqData);

          const options = {
            key: `${import.meta.env.VITE_RAZORPAY_KEY_ID}`,
            amount: data.order.amount,
            currency: data.order.currency,
            name: "RESTRO",
            description: "Secure Payment for Your Meal",
            order_id: data.order.id,
            handler: async function (response) {
              const verification = await verifyPaymentRazorpay(response);
              console.log(verification);
              enqueueSnackbar(verification.data.message, { variant: "success" });

              // Place the order with properly serialized data
              const safeCartItems = cartData.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                id: typeof item.id === 'object' ? String(Date.now()) : String(item.id)
              }));

              const orderData = {
                customerDetails: {
                  name: customerData.customerName,
                  phone: customerData.customerPhone,
                  guests: customerData.guests || 0,
                },
                orderStatus: "In Progress",
                bills: {
                  total: total,
                  tax: tax,
                  totalWithTax: totalPriceWithTax,
                },
                items: safeCartItems,
                table: customerData.table?.tableId,
                paymentMethod: paymentMethod,
                paymentData: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                },
              };

              setTimeout(() => {
                orderMutation.mutate(orderData);
              }, 1500);
            },
            prefill: {
              name: customerData.customerName,
              email: "",
              contact: customerData.customerPhone,
            },
            theme: { color: "#025cca" },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (error) {
          console.log(error);
          enqueueSnackbar("Payment Failed!", {
            variant: "error",
          });
        }
      } else {
        // Place the order with properly serialized data
        const safeCartItems = cartData.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          id: typeof item.id === 'object' ? String(Date.now()) : String(item.id)
        }));

        const orderData = {
          customerDetails: {
            name: customerData.customerName,
            phone: customerData.customerPhone,
            guests: customerData.guests || 0,
          },
          orderStatus: "In Progress",
          bills: {
            total: total,
            tax: tax,
            totalWithTax: totalPriceWithTax,
          },
          items: safeCartItems,
          table: customerData.table?.tableId,
          paymentMethod: paymentMethod,
        };
        
        orderMutation.mutate(orderData);
      }
    }
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      console.log("Order created successfully:", data);

      setOrderInfo(data);
      const tableData = {
        status: "Booked",
        orderId: data._id,
        tableId: data.table,
      };

      setTimeout(() => {
        tableUpdateMutation.mutate(tableData);
      }, 1500);

      enqueueSnackbar("Order Placed!", {
        variant: "success",
      });
      setShowInvoice(true);
    },
    onError: (error) => {
      console.log("Order creation error:", error);
      enqueueSnackbar("Failed to place order: " + (error.response?.data?.message || error.message), {
        variant: "error",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (reqData) => updateOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      console.log("Order updated successfully:", data);

      setOrderInfo(data);
      
      enqueueSnackbar("Order Updated Successfully!", {
        variant: "success",
      });
      
      setTimeout(() => {
        dispatch(removeCustomer());
        dispatch(removeAllItems());
        navigate("/orders");
      }, 2000);
    },
    onError: (error) => {
      console.log("Order update error:", error);
      enqueueSnackbar("Failed to update order: " + (error.response?.data?.message || error.message), {
        variant: "error",
      });
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: (resData) => {
      console.log("Table updated successfully:", resData);
      dispatch(removeCustomer());
      dispatch(removeAllItems());
    },
    onError: (error) => {
      console.log("Table update error:", error);
      enqueueSnackbar("Failed to update table: " + (error.response?.data?.message || error.message), {
        variant: "error",
      });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Items({cartData.length || 0})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ₹{total.toFixed(2)}
        </h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Tax(5.25%)</p>
        <h1 className="text-[#f5f5f5] text-md font-bold">₹{tax.toFixed(2)}</h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Total With Tax
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ₹{totalPriceWithTax.toFixed(2)}
        </h1>
      </div>
      
      {/* Display additional section for edit mode showing only new items cost */}
      {editMode && newItemsTotalWithTax > 0 && (
        <div className="px-5 mt-4 bg-[#2a2a2a] py-2 rounded">
          <h3 className="text-[#f6b100] text-sm font-medium">New Items Only:</h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-[#ababab] font-medium">Subtotal</p>
            <h1 className="text-[#f5f5f5] text-md font-bold">₹{newItemsTotal.toFixed(2)}</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#ababab] font-medium">Tax(5.25%)</p>
            <h1 className="text-[#f5f5f5] text-md font-bold">₹{newItemsTax.toFixed(2)}</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#ababab] font-medium">Payment Due</p>
            <h1 className="text-[#f5f5f5] text-md font-bold">₹{newItemsTotalWithTax.toFixed(2)}</h1>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-3 px-5 mt-4">
        <button
          onClick={() => setPaymentMethod("Cash")}
          className={`bg-[#1f1f1f] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold ${
            paymentMethod === "Cash" ? "bg-[#383737]" : ""
          }`}
        >
          Cash
        </button>
        <button
          onClick={() => setPaymentMethod("Online")}
          className={`bg-[#1f1f1f] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold ${
            paymentMethod === "Online" ? "bg-[#383737]" : ""
          }`}
        >
          Online
        </button>
      </div>

      <div className="flex items-center gap-3 px-5 mt-4">
        <button className="bg-[#025cca] px-4 py-3 w-full rounded-lg text-[#f5f5f5] font-semibold text-lg">
          Print Receipt
        </button>
        <button
          onClick={handlePlaceOrUpdateOrder}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg"
        >
          {editMode ? (newItemsTotalWithTax > 0 ? "Pay & Update" : "Update Order") : "Place Order"}
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;