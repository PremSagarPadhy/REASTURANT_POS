const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const PORT = config.port;
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
    cors: {
        origin: ['https://916a-171-48-107-135.ngrok-free.app','http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    }
});

connectDB();

// Middlewares
app.use(cors({
    credentials: true,
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost
        if (origin.indexOf('http://localhost') === 0) return callback(null, true);
        
        // Allow your main Vercel domain
        if (origin === 'https://reasturant-pos.vercel.app') return callback(null, true);
        
        // Allow any Vercel preview domains
        if (origin.match(/https:\/\/.*vercel\.app$/)) return callback(null, true);
        
        // Otherwise, deny the request
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json()); // parse incoming request in json format
app.use(cookieParser())

// Make io available to our routes
app.set('io', io);

// Socket.IO connection handling
require('./sockets/supportSocket')(io);

// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute")); 
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use('/api/category', require('./routes/categoryRoute'));
app.use('/api/inventory', require('./routes/inventoryRoute'));
app.use('/api/support', require('./routes/supportRoute'));
const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes);
  
// Global Error Handler
app.use(globalErrorHandler);

// Server
server.listen(PORT, () => {
    console.log(`☑️  POS Server is running on port ${PORT}`);
})