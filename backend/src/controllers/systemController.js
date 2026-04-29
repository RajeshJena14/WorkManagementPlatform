const { db } = require('../config/firebase');

// @desc    Get user's notifications
// @route   GET /api/system/notifications
const getNotifications = async (req, res) => {
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', req.user.id)
            .get();

        const notifications = [];
        snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));

        // Sort in memory to avoid needing a complex composite index in Firebase
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/system/notifications/read
const markNotificationsRead = async (req, res) => {
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', req.user.id)
            .where('read', '==', false)
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ message: 'No unread notifications' });
        }

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Get recent system activities (For Dashboard)
// @route   GET /api/system/activities
const getActivities = async (req, res) => {
    try {
        const snapshot = await db.collection('activities')
            .orderBy('createdAt', 'desc')
            .get();

        const activities = [];
        snapshot.forEach(doc => activities.push({ id: doc.id, ...doc.data() }));

        res.status(200).json(activities);
    } catch (error) {
        console.error('Get Activities Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { getNotifications, markNotificationsRead, getActivities };