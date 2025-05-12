import React, { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";
import logo from "../../assets/images/logo.png";

// Add this custom style for screen display
const screenStyles = {
  invoiceDetails: "flex justify-between w-full mt-2 text-sm border-b border-gray-300 pb-2",
  summaryItem: "flex justify-between w-full",
  paymentRow: "flex justify-between w-full"
};

const Invoice = ({ orderInfo, setShowInvoice }) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;
    const WinPrint = window.open("", "", "width=900,height=650");

    WinPrint.document.write(`
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            @page {
              size: 80mm 200mm; /* Thermal receipt printer standard width */
              margin: 0mm;
            }
            body {
              font-family: Arial, sans-serif;
              width: 80mm;
              margin: 0 auto;
              padding: 5mm;
              font-size: 12px;
            }
            .receipt-container { width: 100%; }
            h1 { text-align: center; margin: 0; font-size: 16px; }
            p { margin: 2px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .border-b { border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 3px 0; }
            th:nth-child(1), td:nth-child(1) { text-align: left; width: 8%; }
            th:nth-child(2), td:nth-child(2) { text-align: left; width: 42%; }
            th:nth-child(3), td:nth-child(3) { text-align: center; width: 10%; }
            th:nth-child(4), td:nth-child(4) { text-align: right; width: 20%; }
            th:nth-child(5), td:nth-child(5) { text-align: right; width: 20%; }
            .summary-row { display: flex; justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .total-line { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 0; }
            .italic { font-style: italic; }
            .mt-2 { margin-top: 8px; }
            .underline { text-decoration: underline; }
            
            /* Target specific elements by class */
            .invoice-header { text-align: center; }
            
            .invoice-details { 
              display: flex; 
              justify-content: space-between; 
              width: 100%; 
              margin-top: 8px;
              text-align: left;
            }
            .invoice-left { width: 50%; text-align: left; }
            .invoice-right { width: 50%; text-align: right; }
            
            .customer-info { 
              margin-top: 8px; 
              text-align: left;
              padding-bottom: 5px;
            }
            
            .summary-item {
              display: flex;
              justify-content: space-between;
              width: 100%;
            }
            
            .summary-item-left { text-align: left; }
            .summary-item-right { text-align: right; }
            
            .payment-info { margin-top: 8px; }
            .payment-row {
              display: flex;
              justify-content: space-between;
              width: 100%;
            }
            
            .payment-label { text-align: left; }
            .payment-value { 
              text-align: right;
              max-width: 60%;
              word-break: break-word;
            }
            
            .footer { 
              margin-top: 16px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    WinPrint.document.close();
    WinPrint.focus();

    setTimeout(() => {
      try {
        WinPrint.print();
        WinPrint.close();
      } catch (error) {
        console.error("Print error:", error);
        alert("There was an error when printing. Please try again.");
        WinPrint.close();
      }
    }, 500);
  };

  // Get current date and time
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB"); // DD-MM-YYYY
  const formattedTime = currentDate.toLocaleTimeString("en-GB"); // HH:MM:SS

  // Calculate totals
  const subtotal = orderInfo.bills.total;
  const tax = orderInfo.bills.tax;
  const grandTotal = orderInfo.bills.totalWithTax;

  // Convert number to words
  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";

    const convertLessThanThousand = (n) => {
      if (n < 20) return ones[n];
      const digit = n % 10;
      return (
        tens[Math.floor(n / 10)] + (digit ? "-" + ones[digit] : "")
      );
    };

    const inWords = (n) => {
      if (n === 0) return "";
      if (n < 100) return convertLessThanThousand(n);
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred " +
          inWords(n % 100)
        );
      if (n < 100000)
        return (
          inWords(Math.floor(n / 1000)) +
          " Thousand " +
          inWords(n % 1000)
        );
      if (n < 10000000)
        return (
          inWords(Math.floor(n / 100000)) +
          " Lakh " +
          inWords(n % 100000)
        );
      return (
        inWords(Math.floor(n / 10000000)) +
        " Crore " +
        inWords(n % 10000000)
      );
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = inWords(rupees) + " Rupees";
    if (paise > 0) {
      result += " and " + inWords(paise) + " Paise";
    }

    return result;
  };

  // Generate bill number
  const billNumber = `${Math.floor(Math.random() * 100) + 1}`;
  // Get order ID (from timestamp or use existing)
  const orderId = Math.floor(new Date(orderInfo.orderDate).getTime())
    .toString()
    .slice(-8);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Receipt Content for Printing */}
        <div ref={invoiceRef} className="p-4">
          {/* Invoice Header with Logo */}
          <div className="invoice-header text-center border-b border-gray-300 pb-2">
            <h1 className="text-xl font-bold">Restro-Maniac</h1>
            <p className="text-sm">
              A/12, Shrenik Park, Opp. Jain Temple, Akota,
            </p>
            <p className="text-sm">Vadodara, Gujarat</p>
            <p className="text-sm">Ph: +91-9727955514</p>
            <p className="text-sm">Email: support@restro-maniac.com</p>
            <p className="text-sm">GSTIN: 24AAPPP1343N1ZR</p>
          </div>

          {/* Invoice Details */}
          <div className={`invoice-details ${screenStyles.invoiceDetails}`}>
            <div className="invoice-left">
              <p>
                <strong>Bill No:</strong> {billNumber}
              </p>
              <p>
                <strong>Order ID:</strong> {orderId}
              </p>
            </div>
            <div className="invoice-right text-right">
              <p>
                <strong>Date:</strong> {formattedDate}
              </p>
              <p>
                <strong>Time:</strong> {formattedTime}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="customer-info mt-2 border-b border-gray-300 pb-2 text-sm">
            <p>
              <strong>To:</strong> {orderInfo.customerDetails.name}
            </p>
            <p>
              <strong>Phone:</strong> {orderInfo.customerDetails.phone}
            </p>
            <p>
              <strong>Guests:</strong> {orderInfo.customerDetails.guests}
            </p>
            <p>
              <strong>GSTIN:</strong> {orderInfo.customerDetails.gstin || "NA"}
            </p>
          </div>

          {/* Items Table - No changes needed here */}
          <table className="w-full mt-3 text-sm">
            {/* Table structure remains the same */}
            <thead className="border-t border-b border-gray-300">
              <tr>
                <th className="py-1 text-left">Sr.</th>
                <th className="py-1 text-left">Description</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Rate</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orderInfo.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-1">{index + 1}</td>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">
                    ₹{(item.price / item.quantity).toFixed(2)}
                  </td>
                  <td className="py-1 text-right">₹{item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Quantity */}
          <div className="text-sm mt-1">
            <p>
              <strong>Total Qty:</strong>{" "}
              {orderInfo.items.reduce((total, item) => total + item.quantity, 0)}
            </p>
          </div>

          {/* Bill Summary */}
          <div className="mt-2 text-sm">
            <div className={`summary-item ${screenStyles.summaryItem}`}>
              <p className="summary-item-left">
                <strong>Gross Amount</strong>
              </p>
              <p className="summary-item-right">₹{subtotal.toFixed(2)}</p>
            </div>
            <div className={`summary-item ${screenStyles.summaryItem}`}>
              <p className="summary-item-left">
                <strong>Discount</strong>
              </p>
              <p className="summary-item-right">₹{(subtotal * 0.1).toFixed(2)}</p>
            </div>
            <div className={`summary-item ${screenStyles.summaryItem}`}>
              <p className="summary-item-left">
                <strong>GST (5%)</strong>
              </p>
              <p className="summary-item-right">₹{tax.toFixed(2)}</p>
            </div>
            <div className={`summary-item ${screenStyles.summaryItem} font-bold border-t border-b border-gray-300 py-1 mt-1`}>
              <p className="summary-item-left">Net Amount</p>
              <p className="summary-item-right">₹{grandTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mt-2 text-sm italic text-center border-b border-gray-300 pb-2">
            <p>Rupees {numberToWords(grandTotal)} Only</p>
          </div>

          {/* Payment Details */}
          <div className="payment-info mt-2 text-sm">
            <p className="font-bold underline">Payment Details</p>
            <div className={`payment-row ${screenStyles.paymentRow}`}>
              <p className="payment-label">
                <strong>Payment Method:</strong>
              </p>
              <p className="payment-value">{orderInfo.paymentMethod}</p>
            </div>
            {orderInfo.paymentMethod !== "Cash" && (
              <>
                <div className={`payment-row ${screenStyles.paymentRow}`}>
                  <p className="payment-label">
                    <strong>Razorpay Order ID:</strong>
                  </p>
                  <p className="payment-value">{orderInfo.paymentData?.razorpay_order_id}</p>
                </div>
                <div className={`payment-row ${screenStyles.paymentRow}`}>
                  <p className="payment-label">
                    <strong>Razorpay Payment ID:</strong>
                  </p>
                  <p className="payment-value">{orderInfo.paymentData?.razorpay_payment_id}</p>
                </div>
              </>
            )}
            {orderInfo.paymentMethod === "Cash" && (
              <div className={`payment-row ${screenStyles.paymentRow}`}>
                <p className="payment-label">
                  <strong>Cash Received:</strong>
                </p>
                <p className="payment-value">₹{grandTotal.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer mt-4 text-center text-sm">
            <p>Have a Nice Day</p>
            <p>Thanks for your kind visit!</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg"
          >
            Print Receipt
          </button>
          <button
            onClick={() => setShowInvoice(false)}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
