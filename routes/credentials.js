const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../src/utils/encryption');

// Define the Credential Schema if not already defined elsewhere
const credentialSchema = new mongoose.Schema({
    project: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        iv: String,
        encryptedData: String,
        tag: String
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'restricted'],
        default: 'active'
    },
    createdBy: {
        userId: String,
        userName: String,
        userEmail: String
    },
    isAdminOnly: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Credential = mongoose.model('Credential', credentialSchema);

// Get all credentials for the user
router.get('/', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');

        if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const credentials = await Credential.find({
            $or: [
                { 'createdBy.userId': userId },
                { isAdminOnly: false }
            ]
        });

        return res.json(credentials);
    } catch (error) {
        console.error('Error getting credentials:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new credential
router.post('/', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const userName = req.header('X-User-Name');
        const userEmail = req.header('X-User-Email');

        // Check if any of the required headers are missing or set to 'null'
        if (!userId || !userName || !userEmail || 
            userId === 'null' || userName === 'null' || userEmail === 'null') {
            return res.status(401).json({ 
                message: 'Authentication required',
                details: 'Valid user ID, name, and email are required'
            });
        }

        const { project, category, name, username, password, status, isAdminOnly } = req.body;

        if (!project || !category || !name || !username || !password) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: 'Project, category, name, username, and password are required'
            });
        }

        // Encrypt password
        const encryptedPassword = encrypt(password);

        const credential = new Credential({
            project,
            category,
            name,
            username,
            password: encryptedPassword,
            status,
            isAdminOnly,
            createdBy: {
                userId,
                userName,
                userEmail
            }
        });

        const savedCredential = await credential.save();
        return res.status(201).json(savedCredential);
    } catch (error) {
        console.error('Error creating credential:', error);
        return res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// Update credential
router.put('/:id', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');

        if (!userId || !userEmail) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const credential = await Credential.findById(req.params.id);

        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Check if user has permission to update
        if (credential.createdBy.userId !== userId && !credential.isAdminOnly) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const updates = req.body;
        
        // If password is being updated, encrypt it
        if (updates.password) {
            updates.password = encrypt(updates.password);
        }

        updates.updatedAt = Date.now();

        const updatedCredential = await Credential.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );

        res.json(updatedCredential);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete credential
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');

        if (!userId || !userEmail) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const credential = await Credential.findById(req.params.id);

        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Check if user has permission to delete
        if (credential.createdBy.userId !== userId && !credential.isAdminOnly) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        await Credential.findByIdAndDelete(req.params.id);
        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
