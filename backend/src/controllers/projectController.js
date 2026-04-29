const { db } = require('../config/firebase');

// @desc    Create a new project and dispatch associated tasks
// @route   POST /api/projects
const createProject = async (req, res) => {
    try {
        const { title, description, deadline, tasks } = req.body;

        const newProject = {
            title,
            description: description || '',
            deadline: deadline || null,
            creatorId: req.user.id,
            creatorName: req.user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 1. Save the Project
        const projectRef = await db.collection('projects').add(newProject);

        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');

        // We use a Set to ensure we only send ONE notification per user, 
        // even if they get assigned multiple tasks in this project.
        const usersToNotify = new Set();

        // 2. Save the Tasks (if any were created)
        if (tasks && tasks.length > 0) {
            const batch = db.batch(); // Use batch for faster database writing

            tasks.forEach(task => {
                const taskRef = db.collection('tasks').doc();
                const assigneeId = task.assigneeId || req.user.id;
                const assigneeName = task.assigneeName || req.user.name;

                batch.set(taskRef, {
                    title: task.title,
                    type: task.type || 'Feature',
                    status: 'pending',
                    priority: 'Medium', // Default priority for bulk tasks
                    dueDate: deadline || null, // Inherit project deadline
                    projectId: projectRef.id,
                    creatorId: req.user.id,
                    assigneeId: assigneeId,
                    assigneeName: assigneeName,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // If the task is assigned to someone else, add them to our notification list
                if (assigneeId !== req.user.id) {
                    usersToNotify.add(assigneeId);
                }
            });

            await batch.commit();
        }

        // --- 3. SEND WEBSOCKET NOTIFICATIONS ---
        for (const targetUserId of usersToNotify) {
            const newNotif = {
                userId: targetUserId,
                title: 'New Project Assignment',
                message: `${req.user.name} added you to the project "${title}".`,
                time: new Date().toISOString(),
                read: false
            };

            // Save notification to Firestore permanently
            const notifRef = await db.collection('notifications').add(newNotif);

            // Push it live to the Navbar bell instantly if they are online!
            const targetSocketId = connectedUsers.get(targetUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('new_notification', {
                    id: notifRef.id,
                    ...newNotif
                });
            }
        }

        // --- 4. LOG TO ACTIVITY FEED ---
        await db.collection('activities').add({
            title: 'New Project Dispatched',
            description: `${req.user.name} launched the project "${title}".`,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ message: 'Project created successfully', project: { id: projectRef.id, ...newProject } });
    } catch (error) {
        console.error('Create Project Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Get all projects (Role-based visibility)
// @route   GET /api/projects
const getProjects = async (req, res) => {
    try {
        const projectsRef = db.collection('projects');
        const projects = [];

        // Normalize role to avoid case-sensitivity bugs
        const userRole = req.user.role.toLowerCase();

        if (userRole === 'admin') {
            const snapshot = await projectsRef.get();
            snapshot.forEach(doc => projects.push({ id: doc.id, ...doc.data() }));
        }
        else if (userRole === 'manager') {
            const snapshot = await projectsRef.where('creatorId', '==', req.user.id).get();
            snapshot.forEach(doc => projects.push({ id: doc.id, ...doc.data() }));
        }
        else {
            const tasksSnapshot = await db.collection('tasks').where('assigneeId', '==', req.user.id).get();
            const projectIds = new Set();

            tasksSnapshot.forEach(doc => {
                const data = doc.data();
                // SAFEGUARD: Ensure it's a valid string before querying Firebase
                if (data.projectId && typeof data.projectId === 'string' && data.projectId.trim() !== '') {
                    projectIds.add(data.projectId);
                }
            });

            if (projectIds.size === 0) return res.status(200).json([]);

            const projectPromises = Array.from(projectIds).map(id => projectsRef.doc(id).get());
            const docs = await Promise.all(projectPromises);

            docs.forEach(doc => {
                if (doc.exists) projects.push({ id: doc.id, ...doc.data() });
            });
        }

        // SAFEGUARD: Crash-proof sorting
        projects.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        res.status(200).json(projects);
    } catch (error) {
        console.error('Get Projects Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Delete a project and its associated tasks
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectRef = db.collection('projects').doc(id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) return res.status(404).json({ message: 'Project not found' });

        // Security: Only Admins or the Manager who created it can delete it
        if (req.user.role !== 'Admin' && projectDoc.data().creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this project' });
        }

        const batch = db.batch();

        // 1. Delete the project
        batch.delete(projectRef);

        // 2. Find and delete all tasks associated with this project to prevent orphans
        const tasksSnapshot = await db.collection('tasks').where('projectId', '==', id).get();
        tasksSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        res.status(200).json({ message: 'Project and associated tasks deleted successfully' });
    } catch (error) {
        console.error('Delete Project Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Update project details
// @route   PATCH /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, deadline } = req.body;

        const projectRef = db.collection('projects').doc(id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) return res.status(404).json({ message: 'Project not found' });

        // Security: Only Admins or the Manager who created it can edit it
        if (req.user.role !== 'Admin' && projectDoc.data().creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this project' });
        }

        const updates = {
            title: title || projectDoc.data().title,
            description: description || projectDoc.data().description,
            deadline: deadline || projectDoc.data().deadline || null,
            updatedAt: new Date().toISOString()
        };

        await projectRef.update(updates);

        // Log Activity
        await db.collection('activities').add({
            title: 'Project Updated',
            description: `${req.user.name} updated the project "${updates.title}".`,
            createdAt: new Date().toISOString()
        });

        res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('Update Project Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update your exports at the bottom
module.exports = { getProjects, createProject, updateProject, deleteProject };