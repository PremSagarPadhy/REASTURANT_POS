const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Get all attendance records with pagination
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, employeeId, status, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }
    
    if (employeeId) {
      filter.employeeId = employeeId;
    }
    
    if (status) {
      filter.status = status;
    }

    console.log('Attendance filter:', filter);

    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(filter)
      .populate('employeeId', 'empid name position')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    console.log(`Found ${attendance.length} attendance records`);
    
    res.json({ 
      success: true, 
      data: attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get attendance by employee ID
exports.getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    
    const filter = { employeeId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(filter)
      .populate('employeeId', 'empid name position')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    res.json({ 
      success: true, 
      data: attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (err) {
    console.error('Error fetching employee attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark attendance (check in/out)
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes, markedBy } = req.body;

    console.log('Marking attendance:', req.body);

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const attendanceDate = new Date(date);
    // Set time to start of day for consistent date comparison
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this employee and date
    let attendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (attendance) {
      // Update existing attendance
      if (checkIn) attendance.checkIn = new Date(checkIn);
      if (checkOut) attendance.checkOut = new Date(checkOut);
      if (status) attendance.status = status;
      if (notes) attendance.notes = notes;
      if (markedBy) attendance.markedBy = markedBy;
      
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = new Attendance({
        employeeId,
        date: attendanceDate,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || 'present',
        notes: notes || '',
        markedBy: markedBy || 'system'
      });
      
      await attendance.save();
    }

    // Populate employee data before sending response
    await attendance.populate('employeeId', 'empid name position');

    res.json({ success: true, data: attendance });
  } catch (err) {
    console.error('Error marking attendance:', err);
    if (err.code === 11000) {
      res.status(400).json({ success: false, message: "Attendance already marked for this date" });
    } else {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

// Update attendance
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log('Updating attendance:', id, updateData);

    const attendance = await Attendance.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    ).populate('employeeId', 'empid name position');

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, data: attendance });
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, message: "Attendance record deleted successfully" });
  } catch (err) {
    console.error('Error deleting attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('employeeId', 'empid name position');

    // Get all employees to show who hasn't marked attendance
    const allEmployees = await Employee.find({}, 'empid name position');
    const markedEmployeeIds = attendance.map(att => att.employeeId._id.toString());
    
    const unmarkedEmployees = allEmployees.filter(emp => 
      !markedEmployeeIds.includes(emp._id.toString())
    );

    res.json({ 
      success: true, 
      data: {
        markedAttendance: attendance,
        unmarkedEmployees: unmarkedEmployees,
        totalEmployees: allEmployees.length,
        presentCount: attendance.filter(att => att.status === 'present').length,
        absentCount: attendance.filter(att => att.status === 'absent').length,
        lateCount: attendance.filter(att => att.status === 'late').length
      }
    });
  } catch (err) {
    console.error('Error fetching today attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get attendance summary for date range
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    const matchStage = {};
    
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (employeeId) {
      matchStage.employeeId = new mongoose.Types.ObjectId(employeeId);
    }

    const summary = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$employeeId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
            }
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
            }
          },
          totalHours: { $sum: '$totalHours' }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          employee: {
            _id: '$employee._id',
            empid: '$employee.empid',
            name: '$employee.name',
            position: '$employee.position'
          },
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          totalHours: { $round: ['$totalHours', 2] },
          attendancePercentage: {
            $round: [
              { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { 'employee.name': 1 } }
    ]);

    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Error fetching attendance summary:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
