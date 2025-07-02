const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Get all attendance records
router.get('/', attendanceController.getAllAttendance);

// Get today's attendance
router.get('/today', attendanceController.getTodayAttendance);

// Get attendance summary
router.get('/summary', attendanceController.getAttendanceSummary);

// Get attendance by employee ID
router.get('/employee/:employeeId', attendanceController.getAttendanceByEmployee);

// Mark attendance
router.post('/', attendanceController.markAttendance);

// Update attendance
router.put('/:id', attendanceController.updateAttendance);

// Delete attendance
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
