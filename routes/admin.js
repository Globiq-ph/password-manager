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

// Create new admin
router.post('/create', adminAuthMiddleware, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const admin = new Admin({
            username,
            password, // Note: In production, hash the password before saving
            email
        });
        await admin.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
