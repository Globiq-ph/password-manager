const express = require('express');
const router = express.Router();
const Credential = require('../models/credential');
const { encrypt, decrypt } = require('../utils/encryption');

// Middleware to check if user is admin and ensure user context
const isAdmin = async (req, res, next) => {
    try {
        // Get user context from headers with fallbacks
        req.userContext = {
            userId: req.headers['x-user-id'] || 'dev-user',
            userName: req.headers['x-user-name'] || 'Developer',
            userEmail: req.headers['x-user-email'] || 'dev@globiq.com'
        };
        
        // Log the user context
        console.log('User context:', req.userContext);
        
        // For development, allow all requests as admin
        req.isAdmin = true;
        next();
    } catch (error) {
        console.error('isAdmin middleware error:', error);
        res.status(403).json({ message: 'Authorization failed', error: error.message });
    }
};

// Get credentials based on user role
router.get('/', isAdmin, async (req, res) => {
    try {
        console.log('GET /credentials - Fetching credentials');
        const userId = req.headers['x-user-id'];
        
        // Build query based on user role
        let query = req.isAdmin 
            ? {} // Admins can see all credentials
            : {
                $or: [
                    { ownerId: userId },
                    { 'sharedWith.userId': userId }
                ]
            };

        const credentials = await Credential.find(query).sort({ createdAt: -1 });
        console.log(`Found ${credentials.length} credentials`);
        
        // Decrypt passwords before sending
        const decryptedCredentials = credentials.map(cred => {
            const plainCred = cred.toObject();
            try {
                if (plainCred.password && 
                    plainCred.password.encryptedData && 
                    plainCred.password.iv && 
                    plainCred.password.tag) {
                    plainCred.password = decrypt({
                        encryptedData: plainCred.password.encryptedData,
                        iv: plainCred.password.iv,
                        tag: plainCred.password.tag
                    });
                }
            } catch (error) {
                console.error('Error decrypting password:', error);
                plainCred.password = '********';
            }
            return plainCred;
        });

        res.json(decryptedCredentials);
    } catch (error) {
        console.error('Error in GET /credentials:', error);
        res.status(500).json({ message: 'Error fetching credentials', error: error.message });
    }
});

// Add new credential
router.post('/', isAdmin, async (req, res) => {
    try {
        console.log('POST /credentials - Starting...');
        console.log('Request body:', { ...req.body, password: '********' });
        console.log('User context:', req.userContext);

        const { name, username, password, project, category, status, isAdmin: isAdminCred } = req.body;
        
        // Validate required fields
        if (!name || !username || !password) {
            console.log('Missing required fields:', { name: !!name, username: !!username, password: !!password });
            return res.status(400).json({ 
                message: 'Missing required fields',
                details: {
                    name: !name ? 'Name is required' : null,
                    username: !username ? 'Username is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }

        // Get user context from middleware
        const { userId, userName, userEmail } = req.userContext;

        // Only admin users can create admin credentials
        if (isAdminCred && !req.isAdmin) {
            return res.status(403).json({ message: 'Only admins can create admin credentials' });
        }

        // Encrypt the password
        console.log('Encrypting password...');
        let encryptedPassword;
        try {
            encryptedPassword = encrypt(password);
            console.log('Password encrypted successfully');
        } catch (error) {
            console.error('Password encryption failed:', error);
            return res.status(500).json({ 
                message: 'Password encryption failed', 
                error: error.message 
            });
        }
        
        // Create the credential object
        const credential = new Credential({
            name,
            username,
            password: {
                encryptedData: encryptedPassword.encryptedData,
                iv: encryptedPassword.iv,
                tag: encryptedPassword.tag
            },
            project: project || 'Default',
            category: category || 'General',
            status: status || 'active',
            isAdmin: isAdminCred || false,
            ownerId: userId,
            ownerName: userName,
            ownerEmail: userEmail,
            lastModifiedBy: {
                userId,
                userName,
                userEmail,
                timestamp: new Date()
            }
        });

        console.log('Saving credential...');
        const savedCredential = await credential.save();
        console.log('Saved new credential:', savedCredential._id);

        // Return decrypted version
        const returnCred = savedCredential.toObject();
        returnCred.password = password; // Send back original password
        
        res.status(201).json(returnCred);
    } catch (error) {
        console.error('Error in POST /credentials:', error);
        res.status(500).json({ 
            message: 'Error saving credential', 
            error: error.message,
            stack: error.stack,
            details: {
                name: error.errors?.name?.message,
                username: error.errors?.username?.message,
                password: error.errors?.password?.message,
                ownerId: error.errors?.ownerId?.message,
                ownerName: error.errors?.ownerName?.message,
                ownerEmail: error.errors?.ownerEmail?.message
            }
        });
    }
});

// Update credential
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'];
        const userName = req.headers['x-user-name'];
        const userEmail = req.headers['x-user-email'];

        // Find the credential
        const credential = await Credential.findById(id);
        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Check permission
        if (!req.isAdmin && credential.ownerId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this credential' });
        }

        const updateData = { ...req.body };

        // Only admin can change admin status
        if (!req.isAdmin) {
            delete updateData.isAdmin;
        }

        // If password is being updated, encrypt it
        if (updateData.password && typeof updateData.password === 'string') {
            const encryptedPassword = encrypt(updateData.password);
            updateData.password = {
                encryptedData: encryptedPassword.encryptedData,
                iv: encryptedPassword.iv,
                tag: encryptedPassword.tag
            };
        }

        // Update lastModifiedBy
        updateData.lastModifiedBy = {
            userId,
            userName,
            userEmail,
            timestamp: new Date()
        };

        // Update the credential
        const updatedCredential = await Credential.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        // Return decrypted version
        const returnCred = updatedCredential.toObject();
        if (updateData.password && typeof req.body.password === 'string') {
            returnCred.password = req.body.password;
        } else {
            try {
                returnCred.password = decrypt({
                    encryptedData: returnCred.password.encryptedData,
                    iv: returnCred.password.iv,
                    tag: returnCred.password.tag
                });
            } catch (error) {
                console.error('Error decrypting password:', error);
                returnCred.password = '********';
            }
        }

        res.json(returnCred);
    } catch (error) {
        console.error('Error in PUT /credentials/:id:', error);
        res.status(500).json({ message: 'Error updating credential', error: error.message });
    }
});

// Delete credential
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'];

        if (!id) {
            console.log('No ID provided');
            return res.status(400).json({ message: 'Credential ID is required' });
        }

        const credential = await Credential.findById(id);
        if (!credential) {
            console.log(`Credential with ID ${id} not found`);
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Check permission
        if (!req.isAdmin && credential.ownerId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this credential' });
        }

        await Credential.findByIdAndDelete(id);
        console.log(`Successfully deleted credential ${id}`);
        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /credentials/:id:', error);
        res.status(500).json({ message: 'Error deleting credential', error: error.message });
    }
});

// Share credential with other users (Admin only)
router.post('/:id/share', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, userName, userEmail, accessLevel } = req.body;

        if (!req.isAdmin) {
            return res.status(403).json({ message: 'Only admins can share credentials' });
        }

        const credential = await Credential.findById(id);
        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Add user to sharedWith array
        credential.sharedWith.push({
            userId,
            userName,
            userEmail,
            accessLevel: accessLevel || 'read'
        });

        await credential.save();
        res.json({ message: 'Credential shared successfully' });
    } catch (error) {
        console.error('Error sharing credential:', error);
        res.status(500).json({ message: 'Error sharing credential', error: error.message });
    }
});

module.exports = router;
