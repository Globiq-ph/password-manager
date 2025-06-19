const express = require('express');
const router = express.Router();
const Credential = require('../models/credential');
const { encrypt, decrypt } = require('../utils/encryption');

// User authentication middleware
const authenticate = (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.headers['user-context'];
    const userName = req.headers['x-user-name'];
    const userEmail = req.headers['x-user-email'];

    if (!userId || !userName || !userEmail) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = { userId, userName, userEmail };
    next();
};

// Get all credentials
router.get('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.headers['user-context'];
        const userName = req.headers['x-user-name'];
        const userEmail = req.headers['x-user-email'];

        console.log('Request headers:', req.headers);
        console.log('User context:', { userId, userName, userEmail });

        if (!userId || !userName || !userEmail) {
            console.log('Missing authentication headers');
            return res.status(401).json({ error: 'Authentication required' });
        }

        const credentials = await Credential.find().sort({ createdAt: -1 });
        console.log(`Found ${credentials.length} credentials`);
        res.json(credentials);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's credentials
router.get('/user', authenticate, async (req, res) => {
    try {
        const userId = req.headers['user-context'];
        if (!userId) {
            return res.status(400).json({ error: 'User context required' });
        }
        
        const credentials = await Credential.find({ userId }).sort({ createdAt: -1 });
        res.json(credentials);
    } catch (error) {
        console.error('Error fetching user credentials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new credential
router.post('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.headers['user-context'];
        const userName = req.headers['x-user-name'];
        if (!userId || !userName) {
            return res.status(400).json({ error: 'User context required' });
        }
        
        const credential = new Credential({
            ...req.body,
            userId,
            createdBy: userName,
            status: 'active'
        });
        
        await credential.save();
        res.status(201).json(credential);
    } catch (error) {
        console.error('Error creating credential:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete credential (available to admin and owner)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.headers['user-context'];
        if (!userId) {
            return res.status(400).json({ error: 'User context required' });
        }
        
        const credential = await Credential.findById(req.params.id);
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found' });
        }
        
        // Allow deletion if user is admin or owner
        if (userId === 'dev-user' || credential.userId === userId) {
            await Credential.findByIdAndDelete(req.params.id);
            res.json({ message: 'Credential deleted successfully' });
        } else {
            res.status(403).json({ error: 'Unauthorized' });
        }
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
