const express = require('express');
const router = express.Router();
const { encrypt, decrypt } = require('../utils/encryption');
const Credential = require('../models/credential');

// Middleware to validate credential input
const validateCredential = (req, res, next) => {
    const { project, category, name, username, password } = req.body;
    
    if (!project || !category || !name || !username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    next();
};

// Get all credentials for the user
router.get('/', async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');
        
        if (!userId || !userEmail) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const query = {
            $or: [
                { userId },
                { sharedWith: userEmail }
            ]
        };

        const credentials = await Credential.find(query);
        
        // Decrypt passwords for authorized credentials
        const decryptedCredentials = credentials.map(cred => {
            const decrypted = { ...cred.toObject() };
            try {
                if (cred.encryptedPassword) {
                    decrypted.password = decrypt(cred.encryptedPassword);
                }
            } catch (error) {
                console.error('Decryption error:', error);
                decrypted.password = '**ENCRYPTION ERROR**';
            }
            delete decrypted.encryptedPassword;
            return decrypted;
        });

        res.json(decryptedCredentials);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new credential
router.post('/', validateCredential, async (req, res) => {
    try {
        const userId = req.header('X-User-Id');
        const userName = req.header('X-User-Name');
        
        if (!userId || !userName) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { project, category, name, username, password, status = 'active', isAdminOnly = false } = req.body;
        
        console.log('Creating new credential:', { project, category, name, username, password: '********', status, isAdminOnly });
        console.log('Creating new credential - Headers:', req.headers);
        console.log('Request body:', req.body);

        console.log('Encrypting password...');
        const encryptedPassword = encrypt(password);
        console.log('Password encrypted successfully');

        console.log('Saving credential to database...');
        const credential = new Credential({
            userId,
            userName,
            project,
            category,
            name,
            username,
            encryptedPassword,
            status,
            isAdminOnly,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedCredential = await credential.save();
        console.log('Credential saved successfully:', savedCredential._id);

        res.status(201).json({
            message: 'Credential created successfully',
            credential: {
                ...savedCredential.toObject(),
                password: '********'
            }
        });
    } catch (error) {
        console.error('Error creating credential:', error);
        res.status(500).json({ error: 'Failed to create credential' });
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
        credential.username = username;
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
        const credential = await Credential.findOne({ _id: req.params.id, userId });
        
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        await credential.deleteOne();
        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ error: 'Failed to delete credential' });
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

module.exports = router;
