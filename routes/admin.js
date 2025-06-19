const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

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
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Admin = mongoose.model('Admin', adminSchema);

// Import the Credential model
const Credential = mongoose.model('Credential');

// Middleware to check admin authentication
const adminAuthMiddleware = async (req, res, next) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');

        if (!userId || !userEmail) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // For dev user
        if (userId === 'dev-user' && userEmail === 'dev@globiq.com') {
            req.admin = { userId, userEmail };
            return next();
        }

        const admin = await Admin.findOne({ 
            userEmail: userEmail,
            isActive: true 
        });

        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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

module.exports = router;
