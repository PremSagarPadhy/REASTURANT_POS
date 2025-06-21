# 🍽️ Restaurant POS System

A modern, full-featured Point of Sale (POS) system for restaurants, built with React, Node.js, and Tailwind CSS. This system helps streamline restaurant operations, manage orders, inventory, staff, and view real-time analytics — with optional voice assistant support for hands-free data access.

---

## 🚀 Features

- 📋 **Order Management**: Handle dine-in, takeout, and delivery orders with ease.
- 🍽️ **Table Management**: Visual table layout and real-time status tracking.
- 💳 **Billing & Payments**: Flexible billing with split payments, discounts, and multiple payment methods.
- 📦 **Inventory Control**: Auto-update stock levels and low-stock alerts.
- 👥 **Employee Roles**: Role-based access, login/logout tracking, and staff performance data.
- 📊 **Sales & Analytics**: Dashboard for daily sales, top items, revenue trends, and reports.
- 🎙️ **Voice Assistant Integration**: AI-powered speech interface to query sales and order data.
- 🛠️ **Modular & Scalable**: Easily customizable for cafés, food trucks, or multi-branch restaurants.

---

## 🧑‍💻 Tech Stack

| Layer        | Technology            |
|--------------|------------------------|
| Frontend     | React (Vite), Tailwind CSS |
| Backend      | Node.js, Express        |
| Database     | MongoDB / PostgreSQL (Configurable) |
| Voice AI     | Web Speech API / AI SDK (Optional) |

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/restaurant-pos-system.git
cd restaurant-pos-system

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

## ▶️ Usage
## Start Backend
```bash
cd server
npm run dev
```
## Start Frontend
```bash
cd client
npm run dev
```
### Visit: http://localhost:5173

## 📁 Project Structure
restaurant-pos-system/
├── client/             # React frontend (Vite + Tailwind CSS)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   └── App.jsx
│   └── vite.config.js
│
├── server/             # Node.js backend (Express)
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   └── server.js
│
├── .env.example        # Environment variable example file
├── README.md           # Project documentation
└── package.json        # Root config (optional monorepo style)


## 📌 TODO / Improvements
1. Work on 
2. Add AI Voice Assistance
3. Add real-time socket updates for kitchen
4. Mobile responsive optimizations

## 📄 License
MIT License © 2025 Prem Sagar Padhy
