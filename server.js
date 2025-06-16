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
app.use(express.static(path.join(__dirname, './')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Connect to MongoDB
connectDB();

// API Routes
app.post('/api/credentials', async (req, res) => {
    try {
        const { website, username, password } = req.body;
        if (!website || !username || !password) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }
        // Encrypt password
        const encryptedPassword = encrypt(password);
        const credential = new Credential({
            website,
            username,
            password: encryptedPassword
        });
        await credential.save();
        res.json({ success: true, id: credential._id });
    } catch (error) {
        console.error('Save credential error:', error);
        res.status(500).json({
            success: false,
            error: "Failed to save credential"
        });
    }
});

app.get('/api/credentials', async (req, res) => {
    try {
        const credentials = await Credential.find({}).lean();
        // Decrypt passwords
        const decryptedCredentials = credentials.map(cred => ({
            ...cred,
            password: decrypt(cred.password)
        }));
        res.json(decryptedCredentials);
    } catch (error) {
        console.error('Retrieve credentials error:', error);
        res.status(500).json({
            success: false,
            error: "Failed to retrieve credentials"
        });
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
