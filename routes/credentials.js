const express = require('express');
const router = express.Router();
const Credential = require('../models/credential');
const { encrypt, decrypt } = require('../utils/encryption');

// Get all credentials
router.get('/', async (req, res) => {
    try {
        console.log('GET /credentials - Fetching all credentials');
        const credentials = await Credential.find({}).sort({ createdAt: -1 });
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
router.post('/', async (req, res) => {
    try {
        const { name, username, password, project, category, status, isAdmin } = req.body;
        
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Encrypt the password
        const encryptedPassword = encrypt(password);
        
        // Create the credential with encrypted password and new fields
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
            isAdmin: isAdmin || false
        });

        const savedCredential = await credential.save();
        console.log('Saved new credential:', savedCredential._id);

        // Return decrypted version
        const returnCred = savedCredential.toObject();
        returnCred.password = password; // Send back original password
        
        res.status(201).json(returnCred);
    } catch (error) {
        console.error('Error saving credential:', error);
        res.status(500).json({ message: 'Error saving credential', error: error.message });
    }
});

// Update credential
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        console.log(`PUT /credentials/${id} - Updating credential`);

        if (!id) {
            return res.status(400).json({ message: 'Credential ID is required' });
        }

        const credential = await Credential.findById(id);
        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
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

        // Update the credential
        const updatedCredential = await Credential.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        // Return decrypted version
        const returnCred = updatedCredential.toObject();
        if (updateData.password && typeof req.body.password === 'string') {
            returnCred.password = req.body.password; // Send back original password if it was updated
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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`DELETE /credentials/${id} - Deleting credential`);

        if (!id) {
            console.log('No ID provided');
            return res.status(400).json({ message: 'Credential ID is required' });
        }

        const credential = await Credential.findById(id);
        if (!credential) {
            console.log(`Credential with ID ${id} not found`);
            return res.status(404).json({ message: 'Credential not found' });
        }

        await Credential.findByIdAndDelete(id);
        console.log(`Successfully deleted credential ${id}`);
        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /credentials/:id:', error);
        res.status(500).json({ message: 'Error deleting credential', error: error.message });
    }
});

module.exports = router;
