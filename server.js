require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { encrypt, decrypt } = require('./utils/encryption');
const Credential = require('./models/credential');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

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
        // Encrypt password if encryption is available, otherwise store as is
        let encryptedPassword = password;
        if (typeof encrypt === 'function') {
            encryptedPassword = encrypt(password);
        }
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
        // Decrypt if available
        const decryptedCredentials = credentials.map(cred => ({
            ...cred,
            password: (typeof decrypt === 'function') ? decrypt(cred.password) : cred.password
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
