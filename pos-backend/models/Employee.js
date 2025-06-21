const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  empid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  position: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);