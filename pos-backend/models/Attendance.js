const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  checkIn: { 
    type: Date 
  },
  checkOut: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'halfDay'], 
    default: 'present' 
  },
  totalHours: { 
    type: Number, 
    default: 0 
  },
  notes: { 
    type: String 
  },
  markedBy: { 
    type: String, 
    default: 'system' 
  }
}, { timestamps: true });

// Create compound index to ensure one attendance record per employee per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Calculate total hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    this.totalHours = diffMs / (1000 * 60 * 60); // Convert to hours
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
