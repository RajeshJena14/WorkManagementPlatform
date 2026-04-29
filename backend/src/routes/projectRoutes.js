const express = require('express');
const router = express.Router();
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// GET routes should NOT have authorize(), because the controller handles role visibility!
router.get('/', getProjects);

// POST/PATCH/DELETE should be restricted
router.post('/', authorize('Admin', 'Manager'), createProject);
router.patch('/:id', authorize('Admin', 'Manager'), updateProject);
router.delete('/:id', authorize('Admin', 'Manager'), deleteProject);

module.exports = router;