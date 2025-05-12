const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Basic CRUD routes
router.get('/', inventoryController.getAllItems);
router.get('/stats', inventoryController.getInventoryStats);
router.get('/chart-data', inventoryController.getChartData);
router.get('/:id', inventoryController.getItemById);
router.post('/', inventoryController.createItem);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

// Transaction routes
router.post('/:id/restock', inventoryController.restockItem);
router.post('/:id/use', inventoryController.useItem);
router.get('/:id/transactions', inventoryController.getItemTransactions);

module.exports = router;