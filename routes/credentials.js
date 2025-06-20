const express = require('express');
const router = express.Router();
const { encrypt, decrypt } = require('../utils/encryption');
const Credential = require('../models/credential');
const mongoose = require('mongoose');

// Simple in-memory admin session (for demo only)
let adminSession = { loggedIn: false };

// Admin login endpoint
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin123' && password === 'adminpassword') {
        adminSession.loggedIn = true;
        return res.json({ success: true, message: 'Admin logged in' });
    }
    adminSession.loggedIn = false;
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
});

// Admin logout endpoint
router.post('/admin/logout', (req, res) => {
    adminSession.loggedIn = false;
    res.json({ success: true, message: 'Admin logged out' });
});

// Middleware to check admin session
const requireAdminSession = (req, res, next) => {
    if (!adminSession.loggedIn) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Debug: Log current database and collection name
router.get('/debug/dbinfo', async (req, res) => {
    try {
        const dbName = mongoose.connection.name;
        const collectionName = Credential.collection.name;
        res.json({ dbName, collectionName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all credentials for the user (TEMP: return all for debugging)
router.get('/', requireAdminSession, async (req, res) => {
    try {
        const credentials = await Credential.find({}); // Return all credentials for admin only
        // Decrypt passwords for authorized credentials
        const decryptedCredentials = credentials.map(cred => {
            const decrypted = { ...cred.toObject() };
            try {
                if (cred.encryptedPassword) {
                    decrypted.password = decrypt(JSON.parse(cred.encryptedPassword));
                }
            } catch (error) {
                decrypted.password = '**ENCRYPTION ERROR**';
            }
            delete decrypted.encryptedPassword;
            // Add createdAt field
            decrypted.createdAt = cred.createdAt || cred._id.getTimestamp();
            return decrypted;
        });
        res.json(decryptedCredentials);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
    }
});

// Save new credential
router.post('/', ensureAuthenticated, validateCredential, async (req, res) => {
    try {
        // Accept both 'username' and 'userName' for compatibility
        const { project, category, name, password, notes, image } = req.body;
        const username = req.body.username || req.body.userName;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }
        const encryptedPassword = JSON.stringify(await encrypt(password)); // Store as string
        const credential = new Credential({
            userId: req.user.userId,
            project,
            category,
            name,
            userName: username, // Always store as userName
            encryptedPassword,
            notes,
            image: image || ''
        });
        await credential.save();
        res.status(201).json({ message: 'Credential saved successfully.' });
    } catch (err) {
        console.error('Error saving credential:', err);
        res.status(500).json({ error: 'Error saving credential.' });
    }
});

// Update credential
router.put('/:id', validateCredential, async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const { project, category, name, username, password, status, isAdminOnly, image } = req.body;

        const credential = await Credential.findOne({ _id: req.params.id, userId });
        
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        credential.project = project;
        credential.category = category;
        credential.name = name;
        credential.userName = username;
        credential.encryptedPassword = encrypt(password);
        credential.status = status;
        credential.isAdminOnly = isAdminOnly;
        credential.updatedAt = new Date();
        if (image !== undefined) credential.image = image;

        await credential.save();

        res.json({
            message: 'Credential updated successfully',
            credential: {
                ...credential.toObject(),
                password: '********'
            }
        });
    } catch (error) {
        console.error('Error updating credential:', error);
        res.status(500).json({ error: 'Failed to update credential' });
    }
});

// Delete credential
router.delete('/:id', requireAdminSession, async (req, res) => {
    try {
        const id = req.params.id;
        const credential = await Credential.findOne({ _id: id });
        if (credential) {
            await credential.deleteOne();
            return res.json({ message: 'Credential deleted successfully' });
        }
        res.status(404).json({ error: 'Credential not found' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete credential', details: error.message, stack: error.stack });
    }
});

// Share credential
router.post('/:id/share', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const { shareWith } = req.body;

        if (!shareWith) {
            return res.status(400).json({ error: 'Email address required' });
        }

        const credential = await Credential.findOne({ _id: req.params.id, userId });
        
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        if (!credential.sharedWith) {
            credential.sharedWith = [];
        }

        if (!credential.sharedWith.includes(shareWith)) {
            credential.sharedWith.push(shareWith);
            await credential.save();
        }

        res.json({ message: 'Credential shared successfully' });
    } catch (error) {
        console.error('Error sharing credential:', error);
        res.status(500).json({ error: 'Failed to share credential' });
    }
});

// View (decrypt) a credential's password
router.get('/:id/password', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const credential = await Credential.findOne({ _id: req.params.id, userId });
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found' });
        }
        if (!credential.encryptedPassword) {
            return res.status(400).json({ error: 'No password stored for this credential' });
        }
        const decrypted = decrypt(JSON.parse(credential.encryptedPassword));
        res.json({ password: decrypted });
    } catch (error) {
        console.error('Error retrieving credential password:', error);
        res.status(500).json({ error: 'Failed to retrieve password' });
    }
});

module.exports = router;
