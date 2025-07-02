const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Order = require('../models/orderModel');
const config = require('../config/config');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.databaseURL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Employee.deleteMany({});
    await Order.deleteMany({});
    console.log('🧹 Cleared existing employees and orders');

    // Create test employees
    const employees = [
      {
        empid: 'W001',
        name: 'John Smith',
        phone: '1234567890',
        address: '123 Main St',
        position: 'Waiter'
      },
      {
        empid: 'W002',
        name: 'Sarah Johnson',
        phone: '1234567891',
        address: '124 Main St',
        position: 'Waiter'
      },
      {
        empid: 'C001',
        name: 'Mike Chen',
        phone: '1234567892',
        address: '125 Main St',
        position: 'Cook'
      },
      {
        empid: 'C002',
        name: 'Anna Davis',
        phone: '1234567893',
        address: '126 Main St',
        position: 'Cook'
      },
      {
        empid: 'M001',
        name: 'Robert Wilson',
        phone: '1234567894',
        address: '127 Main St',
        position: 'Manager'
      }
    ];

    const createdEmployees = await Employee.insertMany(employees);
    console.log('👥 Created test employees:', createdEmployees.length);

    // Get waiter and cook IDs
    const waiter1 = createdEmployees.find(emp => emp.empid === 'W001');
    const waiter2 = createdEmployees.find(emp => emp.empid === 'W002');
    const cook1 = createdEmployees.find(emp => emp.empid === 'C001');
    const cook2 = createdEmployees.find(emp => emp.empid === 'C002');

    // Create test orders
    const orders = [
      {
        customerDetails: {
          name: 'Customer 1',
          phone: '9876543210',
          guests: 2
        },
        orderStatus: 'pending',
        bills: {
          total: 25.99,
          tax: 2.60,
          totalWithTax: 28.59
        },
        items: [
          { name: 'Burger', price: 12.99, quantity: 1 },
          { name: 'Fries', price: 5.99, quantity: 1 },
          { name: 'Coke', price: 2.99, quantity: 2 }
        ],
        paymentMethod: 'cash'
      },
      {
        customerDetails: {
          name: 'Customer 2',
          phone: '9876543211',
          guests: 4
        },
        orderStatus: 'preparing',
        bills: {
          total: 45.99,
          tax: 4.60,
          totalWithTax: 50.59
        },
        items: [
          { name: 'Pizza', price: 18.99, quantity: 1 },
          { name: 'Salad', price: 8.99, quantity: 2 },
          { name: 'Water', price: 1.99, quantity: 4 }
        ],
        paymentMethod: 'card',
        assignedWaiter: waiter1._id,
        assignedCook: cook1._id,
        assignedAt: {
          waiter: new Date(),
          cook: new Date()
        }
      },
      {
        customerDetails: {
          name: 'Customer 3',
          phone: '9876543212',
          guests: 3
        },
        orderStatus: 'ready',
        bills: {
          total: 35.99,
          tax: 3.60,
          totalWithTax: 39.59
        },
        items: [
          { name: 'Pasta', price: 15.99, quantity: 2 },
          { name: 'Wine', price: 12.99, quantity: 1 }
        ],
        paymentMethod: 'card',
        assignedWaiter: waiter2._id,
        assignedCook: cook2._id,
        assignedAt: {
          waiter: new Date(),
          cook: new Date()
        }
      },
      {
        customerDetails: {
          name: 'Customer 4',
          phone: '9876543213',
          guests: 1
        },
        orderStatus: 'pending',
        bills: {
          total: 15.99,
          tax: 1.60,
          totalWithTax: 17.59
        },
        items: [
          { name: 'Sandwich', price: 8.99, quantity: 1 },
          { name: 'Coffee', price: 3.99, quantity: 2 }
        ],
        paymentMethod: 'cash'
        // No assigned employees - this will be unassigned
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log('📋 Created test orders:', createdOrders.length);

    console.log('\n✅ Seed data created successfully!');
    console.log('👥 Employees:', employees.length);
    console.log('📋 Orders:', orders.length);
    console.log('   - Assigned orders:', orders.filter(o => o.assignedWaiter || o.assignedCook).length);
    console.log('   - Unassigned orders:', orders.filter(o => !o.assignedWaiter && !o.assignedCook).length);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed script
const run = async () => {
  await connectDB();
  await seedData();
};

run();
