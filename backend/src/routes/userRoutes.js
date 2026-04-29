const express = require('express');
const router = express.Router();
const { getUsers, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// 1. Ensure the user is logged in first
router.use(protect);

// 2. Fetch users: Block Employees, allow Admin and Manager
router.get('/', authorize('Admin', 'Manager'), getUsers);

// 3. Delete users: STRICTLY Admin only
router.delete('/:id', authorize('Admin'), deleteUser);

module.exports = router;