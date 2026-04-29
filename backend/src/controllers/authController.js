const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, countryCode, role } = req.body;

        const usersRef = db.collection('users');

        // 1. Check if user already exists
        const snapshot = await usersRef.where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        // 2. Securely hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Construct the user object
        const newUser = {
            name,
            email,
            password: hashedPassword,
            phone: phone ? `${countryCode} ${phone}` : null,
            role: role || 'Employee', // Fallback role
            status: 'Active',
            createdAt: new Date().toISOString(),
        };

        // 4. Save to Firestore
        const docRef = await usersRef.add(newUser);

        // 5. Generate JWT for immediate login
        const token = generateToken(docRef.id, newUser.role);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: docRef.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        // 1. Check if user exists
        if (snapshot.empty) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Firestore queries return an array of documents, so we grab the first one
        let userData = {};
        let userId = '';
        snapshot.forEach(doc => {
            userData = doc.data();
            userId = doc.id;
        });

        // 2. Verify password matches
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 3. Generate Token
        const token = generateToken(userId, userData.role);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: userId,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                status: userData.status
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { registerUser, loginUser };