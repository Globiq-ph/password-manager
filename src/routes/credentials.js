const express = require('express');
const router = express.Router();
const Credential = require('../models/credential');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all credentials
router.get('/', async (req, res) => {
    try {
        console.log('GET /credentials - user:', req.user);

        const credentials = await Credential.find({ status: { $ne: 'deleted' } })
            .select('-password.encryptedData -password.iv -password.tag')
            .sort('-createdAt');

        console.log(`Found ${credentials.length} credentials`);

        res.json({
            success: true,
            count: credentials.length,
            data: credentials
        });
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Create new credential
router.post('/', async (req, res) => {
    try {
        console.log('POST /credentials - user:', req.user);
        console.log('Request body:', req.body);

        const credential = new Credential({
            ...req.body,
            createdBy: req.user.name
        });

        await credential.save();
        console.log('Credential created successfully');

        // Return credential without sensitive data
        const savedCredential = credential.toObject();
        delete savedCredential.password;

        res.status(201).json({
            success: true,
            data: savedCredential
        });
    } catch (error) {
        console.error('Error creating credential:', error);
        res.status(400).json({
            error: 'Invalid request',
            message: error.message
        });
    }
});

// Get credential by ID
router.get('/:id', async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id)
            .select('-password.encryptedData -password.iv -password.tag');

        if (!credential) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Credential not found'
            });
        }

        res.json({
            success: true,
            data: credential
        });
    } catch (error) {
        console.error('Error fetching credential:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Update credential
router.put('/:id', async (req, res) => {
    try {
        const credential = await Credential.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user.name },
            { new: true, runValidators: true }
        ).select('-password.encryptedData -password.iv -password.tag');

        if (!credential) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Credential not found'
            });
        }

        res.json({
            success: true,
            data: credential
        });
    } catch (error) {
        console.error('Error updating credential:', error);
        res.status(400).json({
            error: 'Invalid request',
            message: error.message
        });
    }
});

// Delete credential
router.delete('/:id', async (req, res) => {
    try {
        const credential = await Credential.findByIdAndUpdate(
            req.params.id,
            { status: 'deleted' },
            { new: true }
        );

        if (!credential) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Credential not found'
            });
        }

        res.json({
            success: true,
            message: 'Credential deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
