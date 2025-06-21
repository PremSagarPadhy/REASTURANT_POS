const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const PORT = config.port || 3000;

// Initialize database connection
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
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // parse incoming request in json format
app.use(cookieParser());

// Socket.IO setup - Only initialize in non-Vercel environment
if (process.env.VERCEL !== '1') {
    const http = require('http');
    const server = http.createServer(app);
    const { Server } = require("socket.io");
    
    const io = new Server(server, {
        cors: {
            origin: function(origin, callback) {
                if (!origin) return callback(null, true);
                if (origin.indexOf('http://localhost') === 0) return callback(null, true);
                if (origin === 'https://reasturant-pos.vercel.app') return callback(null, true);
                if (origin.match(/https:\/\/.*vercel\.app$/)) return callback(null, true);
                callback(new Error('Not allowed by CORS'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization']
        }
    });
    
    // This Make io available to our routes
    app.set('io', io);
    
    // Socket.IO connection handling
    require('./sockets/supportSocket')(io);
    
    // Start server for non-Vercel environments
    server.listen(PORT, () => {
        console.log(`☑️  POS Server is running on port ${PORT}`);
    });
} else {
    // For Vercel environment, set a mock io object
    app.set('io', {
        emit: () => console.log('Socket.IO disabled in Vercel environment'),
        // Add other necessary mock methods
    });
}

// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
});

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

// Export for serverless environments
module.exports = app;