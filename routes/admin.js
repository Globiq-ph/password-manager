const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Credential = require('../models/credential');

// Define Admin Schema if not already defined elsewhere
const adminSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['admin', 'super_admin'],
        default: 'admin'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Define Activity Log Schema
const activityLogSchema = new mongoose.Schema({
    userId: String,
    action: String,
    details: Object,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Admin = mongoose.model('Admin', adminSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        const userId = req.header('X-User-Id');
        const admin = await Admin.findOne({ userId });
        
        if (!admin || !admin.isActive) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Error checking admin status' });
    }
};

// Middleware to check admin status
const adminAuthMiddleware = async (req, res, next) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');

        if (!userId || !userEmail) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const admin = await Admin.findOne({ 
            userEmail: userEmail,
            isActive: true 
        });

        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.admin = { userId, userEmail };
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Log activity
const logActivity = async (userId, action, details) => {
    try {
        await ActivityLog.create({ userId, action, details });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Route to check admin status
router.get('/check', (req, res) => {
    const userEmail = req.header('X-User-Email');
    const adminEmails = ['dev@globiq.com', 'admin@globiq.com'];
    res.json({ isAdmin: adminEmails.includes(userEmail) });
});

// Get admin status
router.get('/status', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const admin = await Admin.findOne({ userId });
        res.json({ 
            isAdmin: !!admin && admin.isActive,
            role: admin ? admin.role : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin logout
router.post('/logout', adminAuthMiddleware, async (req, res) => {
    try {
        await logActivity(req.admin.userId, 'LOGOUT', { timestamp: new Date() });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get activity logs
router.get('/activity-logs', adminAuthMiddleware, async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all credentials (admin only)
router.get('/credentials', adminAuthMiddleware, async (req, res) => {
    try {
        const credentials = await Credential.find({});
        res.json(credentials);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get usage statistics
router.get('/stats', adminAuthMiddleware, async (req, res) => {
    try {
        const totalCredentials = await Credential.countDocuments();
        const projectStats = await Credential.aggregate([
            { $group: { _id: '$project', count: { $sum: 1 } } }
        ]);

        res.json({
            totalCredentials,
            projectStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new admin
router.post('/', adminAuthMiddleware, async (req, res) => {
    try {
        const { userId, userName, userEmail } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [{ userId }, { userEmail }]
        });

        if (existingAdmin) {
            return res.status(400).json({ 
                message: 'Admin with this userId or email already exists' 
            });
        }

        const admin = new Admin({ userId, userName, userEmail });
        await admin.save();
        
        res.status(201).json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update admin status
router.put('/:userId', adminAuthMiddleware, async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const admin = await Admin.findOneAndUpdate(
            { userId: req.params.userId },
            { isActive },
            { new: true }
        );

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get admin users
router.get('/users', adminAuthMiddleware, async (req, res) => {
    try {
        const admins = await Admin.find({}, { userId: 1, userName: 1, userEmail: 1, role: 1, lastLogin: 1, isActive: 1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update admin user
router.put('/users/:userId', adminAuthMiddleware, async (req, res) => {
    try {
        const { role, isActive } = req.body;
        const admin = await Admin.findOneAndUpdate(
            { userId: req.params.userId },
            { role, isActive },
            { new: true }
        );
        
        await logActivity(req.admin.userId, 'UPDATE_ADMIN', {
            targetUser: req.params.userId,
            changes: { role, isActive }
        });
        
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete admin
router.delete('/:userId', adminAuthMiddleware, async (req, res) => {
    try {
        // Prevent deleting the last admin
        const adminCount = await Admin.countDocuments();
        if (adminCount <= 1) {
            return res.status(400).json({ 
                message: 'Cannot delete the last admin' 
            });
        }

        const result = await Admin.findOneAndDelete({ 
            userId: req.params.userId 
        });

        if (!result) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ message: 'Admin removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get system stats
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const totalCredentials = await Credential.countDocuments();
        const credentialsByProject = await Credential.aggregate([
            { $group: { _id: "$project", count: { $sum: 1 } } }
        ]);
        const credentialsByCategory = await Credential.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.json({
            totalCredentials,
            credentialsByProject,
            credentialsByCategory
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Error retrieving system stats' });
    }
});

// Get users with credential counts
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await Credential.aggregate([
            { $group: { 
                _id: "$userId",
                credentialCount: { $sum: 1 },
                projects: { $addToSet: "$project" },
                categories: { $addToSet: "$category" }
            }}
        ]);
        
        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Error retrieving user information' });
    }
});

module.exports = router;
