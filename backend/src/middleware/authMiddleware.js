const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const protect = async (req, res, next) => {
    let token;

    // Check if token exists in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from Firestore to ensure they still exist
            const userDoc = await db.collection('users').doc(decoded.id).get();

            if (!userDoc.exists) {
                return res.status(401).json({ message: 'Not authorized, user no longer exists' });
            }

            const userData = userDoc.data();

            // FIX: Ensure we don't block users just because their status is "Online" or "Offline"
            if (userData.status === 'Suspended' || userData.status === 'Deactivated') {
                return res.status(403).json({ message: 'Account has been deactivated' });
            }

            // Attach the secure user object to the request
            req.user = {
                id: userDoc.id,
                name: userData.name,
                email: userData.email,
                role: userData.role
            };

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// 2. Role Authorization - Pass in allowed roles (e.g., authorize('Manager', 'Admin'))
const authorize = (...roles) => {
    return (req, res, next) => {
        // 1. Safety check
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'User role not found in token' });
        }

        // 2. Convert everything to lowercase for a foolproof match
        const userRole = req.user.role.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        // 3. Check if the user's role is in the allowed list
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: `Role (${req.user.role}) is not authorized to access this route.`
            });
        }

        next();
    };
};

module.exports = { protect, authorize };