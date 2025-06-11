const mongoose = require("mongoose");

const supportCustomerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  lastOrder: { 
    type: String,
    default: "None"
  },
  dateJoined: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ["active", "resolved"], 
    default: "active" 
  },
  unreadCount: { 
    type: Number, 
    default: 0 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  chats: [{
    id: mongoose.Schema.Types.ObjectId,
    text: String,
    sender: {
      type: String,
      enum: ["customer", "admin"]
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

// Compute lastActive as relative time (e.g., "2 min ago")
supportCustomerSchema.virtual('lastActiveRelative').get(function() {
  const now = new Date();
  const diffMs = now - this.lastActive;
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
});

supportCustomerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.lastActive = ret.lastActiveRelative;
    delete ret.lastActiveRelative;
    return ret;
  }
});

module.exports = mongoose.model("SupportCustomer", supportCustomerSchema);