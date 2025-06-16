require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { encrypt, decrypt } = require('./utils/encryption');
const Credential = require('./models/credential');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-ancestors": ["'self'", "https://teams.microsoft.com"],
            "img-src": ["'self'", "data:", "https:"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        }
    }
}));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Connect to MongoDB
connectDB();

// Debug route
app.get('/api/debug', async (req, res) => {
    try {
        const credentials = await Credential.find({});
        console.log('Stored credentials:', credentials);
        res.json({ count: credentials.length, credentials });
    } catch (err) {
        console.error('Debug route error:', err);
        res.status(500).json({ error: err.message });
    }
});

// API Routes for credentials
app.post('/api/credentials', async (req, res) => {
    try {
        console.log('Received credential creation request:', {
            website: req.body.website,
            username: req.body.username,
            hasPassword: !!req.body.password
        });

        const credential = new Credential({
            website: req.body.website,
            username: req.body.username,
            password: encrypt(req.body.password)
        });

        const savedCredential = await credential.save();
        console.log('Credential saved successfully:', savedCredential._id);
        res.json(savedCredential);
    } catch (err) {
        console.error('Credential creation error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/credentials', async (req, res) => {
    try {
        const credentials = await Credential.find({});
        console.log('Retrieved credentials count:', credentials.length);
        res.json(credentials);
    } catch (err) {
        console.error('Error fetching credentials:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add DELETE endpoint
app.delete('/api/credentials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Credential.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete credential error:', error);
        res.status(500).json({
            success: false,
            error: "Failed to delete credential"
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
