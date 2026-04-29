const { db } = require('../config/firebase');

// @desc    Create a new task 
// @route   POST /api/tasks
const createTask = async (req, res) => {
    try {
        const { title, description, type, projectId, priority, dueDate, assigneeId, assigneeName } = req.body;

        if (!title || !type) return res.status(400).json({ message: 'Title and type are required' });

        let finalAssigneeId = req.user.id;
        let finalAssigneeName = req.user.name;

        if ((req.user.role === 'Manager' || req.user.role === 'Admin') && assigneeId) {
            finalAssigneeId = assigneeId;
            finalAssigneeName = assigneeName || 'Team Member';
        }

        const newTask = {
            title,
            description: description || '',
            type,
            priority: priority || 'Medium',
            dueDate: dueDate || null,
            status: 'pending',
            projectId: projectId || null,
            creatorId: req.user.id,
            assigneeId: finalAssigneeId,
            assigneeName: finalAssigneeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await db.collection('tasks').add(newTask);

        // --- NOTIFICATION LOGIC ---
        // Only notify if assigning the task to someone else
        if (finalAssigneeId !== req.user.id) {
            const io = req.app.get('io');
            const connectedUsers = req.app.get('connectedUsers');

            const newNotif = {
                userId: finalAssigneeId,
                title: 'New Task Assigned',
                message: `${req.user.name} assigned a new task to you: "${title}".`,
                time: new Date().toISOString(),
                read: false
            };

            const notifRef = await db.collection('notifications').add(newNotif);

            const targetSocketId = connectedUsers.get(finalAssigneeId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('new_notification', { id: notifRef.id, ...newNotif });
            }
        }

        // Log Activity
        await db.collection('activities').add({
            title: 'New Task Created',
            description: `${req.user.name} created task "${title}".`,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ message: 'Task created successfully', task: { id: docRef.id, ...newTask } });
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Get tasks for the Kanban Board
// @route   GET /api/tasks
const getTasks = async (req, res) => {
    try {
        const tasksRef = db.collection('tasks');
        let tasksArray = [];

        const userRole = req.user.role.toLowerCase();

        if (userRole === 'admin') {
            const snapshot = await tasksRef.get();
            snapshot.forEach(doc => tasksArray.push({ id: doc.id, ...doc.data() }));
        }
        else if (userRole === 'manager') {
            const assignedToMe = await tasksRef.where('assigneeId', '==', req.user.id).get();
            const createdByMe = await tasksRef.where('creatorId', '==', req.user.id).get();

            const taskMap = new Map();
            assignedToMe.forEach(doc => taskMap.set(doc.id, { id: doc.id, ...doc.data() }));
            createdByMe.forEach(doc => taskMap.set(doc.id, { id: doc.id, ...doc.data() }));
            tasksArray = Array.from(taskMap.values());
        }
        else {
            const snapshot = await tasksRef.where('assigneeId', '==', req.user.id).get();
            snapshot.forEach(doc => tasksArray.push({ id: doc.id, ...doc.data() }));
        }

        const tasks = { pending: [], inProgress: [], completed: [] };

        tasksArray.forEach(task => {
            // SAFEGUARD: Fallback for missing/malformed status
            const status = task.status || 'pending';
            if (status === 'inProgress') tasks.inProgress.push(task);
            else if (status === 'completed') tasks.completed.push(task);
            else tasks.pending.push(task);
        });

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Update task status (Drag and Drop)
// @route   PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const taskRef = db.collection('tasks').doc(id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });

        const taskData = taskDoc.data();

        // Security
        if (req.user.role !== 'Admin' && req.user.role !== 'Manager' && req.user.id !== taskData.assigneeId) {
            return res.status(403).json({ message: 'Not authorized to move this task' });
        }

        await taskRef.update({
            status,
            updatedAt: new Date().toISOString()
        });

        // --- NOTIFICATION LOGIC ---
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');

        // Figure out who needs to be notified
        let userToNotify = null;

        // If an Employee moves the task, notify the Manager who created it
        if (req.user.id === taskData.assigneeId && req.user.id !== taskData.creatorId) {
            userToNotify = taskData.creatorId;
        }
        // If a Manager moves the task, notify the Employee assigned to it
        else if (req.user.id === taskData.creatorId && req.user.id !== taskData.assigneeId) {
            userToNotify = taskData.assigneeId;
        }

        if (userToNotify) {
            const friendlyStatus = status.replace(/([A-Z])/g, ' $1').trim().toLowerCase(); // "inProgress" -> "in progress"
            const newNotif = {
                userId: userToNotify,
                title: 'Task Status Updated',
                message: `${req.user.name} moved "${taskData.title}" to ${friendlyStatus}.`,
                time: new Date().toISOString(),
                read: false
            };

            const notifRef = await db.collection('notifications').add(newNotif);

            const targetSocketId = connectedUsers.get(userToNotify);
            if (targetSocketId) {
                io.to(targetSocketId).emit('new_notification', { id: notifRef.id, ...newNotif });
            }
        }

        res.status(200).json({ message: 'Task status updated' });
    } catch (error) {
        console.error('Update Task Status Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Fully update task details (Edit Task)
// @route   PATCH /api/tasks/:id/details
const updateTaskDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // { title, description, type, priority, dueDate }

        const taskRef = db.collection('tasks').doc(id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });

        // Security check
        if (req.user.role !== 'Admin' && taskDoc.data().creatorId !== req.user.id && taskDoc.data().assigneeId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this task' });
        }

        updates.updatedAt = new Date().toISOString();
        await taskRef.update(updates);

        res.status(200).json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const taskRef = db.collection('tasks').doc(id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });

        // Security check
        if (req.user.role !== 'Admin' && taskDoc.data().creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Only Admins or the Task Creator can delete tasks' });
        }

        await taskRef.delete();

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Export the new functions
module.exports = { getTasks, updateTaskStatus, createTask, updateTaskDetails, deleteTask };