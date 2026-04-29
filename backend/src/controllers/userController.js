const { db } = require('../config/firebase');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin ONLY)
const getUsers = async (req, res) => {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        const users = [];
        snapshot.forEach(doc => {
            const userData = doc.data();

            // Exclude the hashed password from the response for security
            delete userData.password;

            users.push({
                id: doc.id,
                ...userData
            });
        });

        res.status(200).json(users);

    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin ONLY)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent the admin from deleting their own account via this endpoint
        if (req.user.id === id) {
            return res.status(400).json({ message: 'You cannot delete your own admin account.' });
        }

        const userRef = db.collection('users').doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete the user document from Firestore
        await userRef.delete();

        res.status(200).json({ message: 'User removed successfully', id });

    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { getUsers, deleteUser };