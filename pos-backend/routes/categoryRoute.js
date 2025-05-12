const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Category routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Item routes
router.get('/:id/items', categoryController.getCategoryItems);
router.get('/:categoryId/items/:itemId', categoryController.getCategoryItem);
router.post('/:id/items', categoryController.addItemToCategory);
router.put('/:categoryId/items/:itemId', categoryController.updateItemInCategory);
router.delete('/:categoryId/items/:itemId', categoryController.deleteItemFromCategory);

module.exports = router;