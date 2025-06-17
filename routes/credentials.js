const express = require('express');
const router = express.Router();
const Credential = require('../models/credential');
const { encrypt, decrypt } = require('../utils/encryption');

// Get all credentials
router.get('/', async (req, res) => {
    try {
        console.log('Fetching credentials from database...');
        const credentials = await Credential.find({}).sort({ createdAt: -1 });
        console.log(`Found ${credentials.length} credentials`);
        
        // Decrypt passwords before sending
        const decryptedCredentials = credentials.map(cred => {
            const plainCred = cred.toObject();
            try {
                if (plainCred.password.includes(':')) {
                    plainCred.password = decrypt(plainCred.password);
                }
            } catch (error) {
                console.error('Error decrypting password:', error);
                plainCred.password = '********';
            }
            return plainCred;
        });

        res.json(decryptedCredentials);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ message: 'Error fetching credentials', error: error.message });
    }
});

// Add new credential
router.post('/', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Encrypt password before saving
        const encryptedPassword = encrypt(password);
        
        const credential = new Credential({
            name,
            username,
            password: encryptedPassword
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

// Delete credential
router.delete('/:id', async (req, res) => {
    try {
        const result = await Credential.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Credential not found' });
        }
        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ message: 'Error deleting credential', error: error.message });
    }
});

module.exports = router;
