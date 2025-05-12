import React from "react";
import { formatDateAndTime } from "../../utils";

const OrderDetailsModal = ({ isOpen, onClose, orderData }) => {
  if (!isOpen || !orderData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#262626] p-6 rounded-lg w-3/4 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">Order Details</h2>
          <button 
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-[#333] p-4 rounded-lg">
            <h3 className="text-[#f5f5f5] font-semibold mb-2">Order Information</h3>
            <div className="text-[#ababab]">
              <p><span className="text-[#f5f5f5]">Order ID:</span> #{Math.floor(new Date(orderData.orderDate).getTime())}</p>
              <p><span className="text-[#f5f5f5]">Date & Time:</span> {formatDateAndTime(orderData.orderDate)}</p>
              <p><span className="text-[#f5f5f5]">Status:</span> {orderData.orderStatus}</p>
              <p><span className="text-[#f5f5f5]">Payment Method:</span> {orderData.paymentMethod}</p>
            </div>
          </div>

          <div className="bg-[#333] p-4 rounded-lg">
            <h3 className="text-[#f5f5f5] font-semibold mb-2">Customer Information</h3>
            <div className="text-[#ababab]">
              <p><span className="text-[#f5f5f5]">Name:</span> {orderData.customerDetails.name}</p>
              <p><span className="text-[#f5f5f5]">Phone:</span> {orderData.customerDetails.phone || "N/A"}</p>
              <p><span className="text-[#f5f5f5]">Guests:</span> {orderData.customerDetails.guests || "N/A"}</p>
              <p><span className="text-[#f5f5f5]">Table:</span> {orderData.table?.tableNo || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#333] p-4 rounded-lg mb-6">
          <h3 className="text-[#f5f5f5] font-semibold mb-4">Order Items</h3>
          <table className="w-full text-[#f5f5f5]">
            <thead className="bg-[#1a1a1a] text-[#ababab]">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-center">Quantity</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items.map((item, index) => (
                <tr key={index} className="border-b border-[#444]">
                  <td className="p-2 text-left">{item.name}</td>
                  <td className="p-2 text-center">x{item.quantity}</td>
                  <td className="p-2 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="p-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#333] p-4 rounded-lg">
          <h3 className="text-[#f5f5f5] font-semibold mb-2">Bill Summary</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[#ababab]">
              <span>Subtotal:</span>
              <span>₹{orderData.bills.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#ababab]">
              <span>Tax (5.25%):</span>
              <span>₹{orderData.bills.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#f5f5f5] text-lg mt-2 pt-2 border-t border-[#444]">
              <span>Total:</span>
              <span>₹{orderData.bills.totalWithTax.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#025cca] px-4 py-2 rounded-lg text-[#f5f5f5] font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;