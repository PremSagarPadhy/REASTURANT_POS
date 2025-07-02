const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { isVerifiedUser } = require('../middlewares/tokenVerification');

router.post('/', isVerifiedUser, employeeController.createEmployee);
router.get('/', isVerifiedUser, employeeController.getAllEmployees);
router.get('/:id', isVerifiedUser, employeeController.getEmployeeById);
router.put('/:id', isVerifiedUser, employeeController.updateEmployee);
router.delete('/:id', isVerifiedUser, employeeController.deleteEmployee);
router.post('/seed-test-data', isVerifiedUser, employeeController.seedTestData);

module.exports = router;