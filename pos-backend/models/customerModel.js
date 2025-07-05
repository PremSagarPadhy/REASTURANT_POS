const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    phone: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    email: { 
        type: String, 
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: "Please enter a valid email address"
        }
    },
    address: { 
        type: String, 
        trim: true 
    },
    customerType: {
        type: String,
        enum: ['New', 'Regular', 'VIP'],
        default: 'New'
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    lastVisit: {
        type: Date,
        default: Date.now
    },
    averageOrderValue: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    },
    preferences: {
        favoriteItems: [String],
        dietaryRestrictions: [String],
        preferredTable: String
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Track order history
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }]
}, { 
    timestamps: true 
});

// Index for efficient searches
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ customerType: 1 });

// Virtual for calculating customer type based on orders
customerSchema.virtual('calculatedCustomerType').get(function() {
    if (this.totalOrders >= 10) return 'VIP';
    if (this.totalOrders >= 3) return 'Regular';
    return 'New';
});

// Method to update customer stats
customerSchema.methods.updateStats = function(orderData) {
    this.totalOrders = orderData.totalOrders || this.totalOrders;
    this.totalSpent = orderData.totalSpent || this.totalSpent;
    this.averageOrderValue = this.totalOrders > 0 ? this.totalSpent / this.totalOrders : 0;
    this.lastVisit = new Date();
    
    // Update customer type based on orders
    if (this.totalOrders >= 10) {
        this.customerType = 'VIP';
    } else if (this.totalOrders >= 3) {
        this.customerType = 'Regular';
    } else {
        this.customerType = 'New';
    }
    
    return this.save();
};

module.exports = mongoose.model("Customer", customerSchema);
