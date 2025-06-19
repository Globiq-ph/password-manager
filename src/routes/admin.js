const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');
const Credential = require('../models/credential');
const adminAuthMiddleware = require('../middleware/admin');

// Get all users' credentials (admin only)
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
        const admin = new Admin({ userId, userName, userEmail });
        await admin.save();
        res.status(201).json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete admin
router.delete('/:userId', adminAuthMiddleware, async (req, res) => {
    try {
        await Admin.findOneAndDelete({ userId: req.params.userId });
        res.status(200).json({ message: 'Admin removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
