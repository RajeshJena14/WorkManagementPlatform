require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // <-- Import the native http module
const { Server } = require('socket.io'); // <-- Import Socket.io
const { db } = require('./config/firebase');

const app = express();

// Create an HTTP server and attach Express and Socket.io to it
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173', // Keep local for testing
    'https://worksyncplatform.netlify.app' // Add your live Netlify URL!
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins, // Allow your React frontend
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true
    }
});

// A global Map to store who is online: { userId => socketId }
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('register', async (userId) => {
        connectedUsers.set(userId, socket.id);
        // Attach the userId directly to the socket object for easy access during disconnect
        socket.userId = userId;

        try {
            // 1. Update Firestore
            await db.collection('users').doc(userId).update({
                status: 'Online',
                lastActivity: new Date().toISOString()
            });

            // 2. Broadcast the live status change to anyone looking at the User Management page
            io.emit('user_status_change', {
                userId,
                status: 'Online',
                lastActivity: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    });

    socket.on('disconnect', async () => {
        if (socket.userId) {
            // Remove from active memory map
            connectedUsers.delete(socket.userId);

            try {
                const timestamp = new Date().toISOString();

                // 1. Update Firestore
                await db.collection('users').doc(socket.userId).update({
                    status: 'Offline',
                    lastActivity: timestamp
                });

                // 2. Broadcast the live status change
                io.emit('user_status_change', {
                    userId: socket.userId,
                    status: 'Offline',
                    lastActivity: timestamp
                });
            } catch (error) {
                console.error('Error updating offline status:', error);
            }
        }
    });

    socket.on('self_notification', (data) => {
        const uid = String(data.userId);
        console.log(`[Socket] Received self_notification for user: ${uid}`);

        // Look up their primary socket from Navbar
        const targetSocketId = connectedUsers.get(uid);
        console.log(`[Socket] Target socket ID found: ${targetSocketId || 'None'}`);

        if (targetSocketId) {
            io.to(targetSocketId).emit('new_notification', {
                id: Date.now(),
                title: data.title,
                message: data.message,
                time: new Date().toISOString(),
                read: false
            });
            console.log(`[Socket] Notification successfully sent to socket: ${targetSocketId}`);
        } else {
            console.log(`[Socket] User ${uid} is not currently in the connectedUsers map!`);
            console.log(`[Socket] Current connected users:`, Array.from(connectedUsers.keys()));
        }
    });
});

// Make `io` and `connectedUsers` available inside our controllers
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json()); // Parse incoming JSON payloads

// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'WorkSync API is running perfectly.' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
// CRITICAL: Call server.listen, NOT app.listen
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Firebase Admin connected successfully.');
    console.log('WebSocket Server is ready.');
});