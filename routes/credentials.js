const express = require('express');
const router = express.Router();
const { encrypt, decrypt } = require('../utils/encryption');
const Credential = require('../models/credential');
const mongoose = require('mongoose');

// Middleware to validate credential input
const validateCredential = (req, res, next) => {
    // Accept both 'username' and 'userName' for compatibility
    const { project, category, name, password, notes } = req.body;
    const username = req.body.username || req.body.userName;
    if (!project || !category || !name || !username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    next();
};

// Middleware to ensure authentication
const ensureAuthenticated = (req, res, next) => {
    const userId = req.header('X-User-Id');
    const userEmail = req.header('X-User-Email');
    const userName = req.header('X-User-Name');
    
    if (!userId || !userEmail) {
        return res.status(401).json({ 
            error: 'Authentication required',
            details: 'User ID and email are required in headers'
        });
    }

    req.user = { userId, userEmail, userName: userName || 'Unknown User' };
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
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // const { userId, userEmail } = req.user;
        // const query = {
        //     $or: [
        //         { userId },
        //         { sharedWith: userEmail }
        //     ]
        // };
        // const credentials = await Credential.find(query);
        const credentials = await Credential.find({}); // Return all credentials for debugging
        console.log('Fetched credentials from DB:', credentials);
        // Decrypt passwords for authorized credentials
        const decryptedCredentials = credentials.map(cred => {
            const decrypted = { ...cred.toObject() };
            try {
                if (cred.encryptedPassword) {
                    decrypted.password = decrypt(JSON.parse(cred.encryptedPassword));
                }
            } catch (error) {
                console.error('Decryption error for credential:', cred._id, error);
                decrypted.password = '**ENCRYPTION ERROR**';
            }
            delete decrypted.encryptedPassword;
            return decrypted;
        });
        console.log('Decrypted credentials to send:', decryptedCredentials);
        res.json(decryptedCredentials);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
    }
});

// Save new credential
router.post('/', ensureAuthenticated, validateCredential, async (req, res) => {
    try {
        // Accept both 'username' and 'userName' for compatibility
        const { project, category, name, password, notes } = req.body;
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
            notes
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
        const { project, category, name, username, password, status, isAdminOnly } = req.body;

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
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const id = req.params.id;
        console.log('[DELETE] X-User-Id header:', userId);
        console.log('[DELETE] _id param:', id);
        // Try to find by _id and userId
        const credential = await Credential.findOne({ _id: id, userId });
        console.log('[DELETE] findOne({_id, userId}) result:', credential);
        if (credential) {
            await credential.deleteOne();
            console.log('[DELETE] Deleted by _id and userId');
            return res.json({ message: 'Credential deleted successfully' });
        }
        // Try to find by _id only (legacy)
        const legacy = await Credential.findOne({ _id: id });
        console.log('[DELETE] findOne({_id}) result:', legacy);
        if (legacy) {
            await legacy.deleteOne();
            console.log('[DELETE] Deleted legacy credential by _id only');
            return res.json({ message: 'Legacy credential deleted (no userId)' });
        }
        console.warn('[DELETE] Credential not found for _id:', id);
        res.status(404).json({ error: 'Credential not found' });
    } catch (error) {
        console.error('[DELETE] Error deleting credential:', error);
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
