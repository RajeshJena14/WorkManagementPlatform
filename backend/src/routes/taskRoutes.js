const express = require('express');
const router = express.Router();
const { getTasks, updateTaskStatus, createTask, updateTaskDetails, deleteTask } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTasks);
router.post('/', authorize('Admin', 'Manager'), createTask);
router.patch('/:id/status', updateTaskStatus);

router.patch('/:id/details', updateTaskDetails);

router.delete('/:id', authorize('Admin', 'Manager'), deleteTask);

module.exports = router;