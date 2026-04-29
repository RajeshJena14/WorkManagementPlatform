const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationsRead, getActivities } = require('../controllers/systemController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Everyone needs to see their own notifications and the global activity feed!
router.get('/notifications', getNotifications);
router.patch('/notifications/read', markNotificationsRead);
router.get('/activities', getActivities);

module.exports = router;