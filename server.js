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
        const { name, username, password } = req.body;
        // Encrypt the password
        const encryptedPassword = encrypt(password);
        
        // Create new credential with encrypted password
        const credential = new Credential({
            name,
            username,
            password: {
                iv: encryptedPassword.iv,
                encryptedData: encryptedPassword.encryptedData,
                tag: encryptedPassword.tag
            }
        });

        const savedCredential = await credential.save();
        console.log('Credential saved successfully:', savedCredential._id);
        
        // Send back credential without sensitive data
        const responseCredential = {
            _id: savedCredential._id,
            name: savedCredential.name,
            username: savedCredential.username,
            createdAt: savedCredential.createdAt,
            updatedAt: savedCredential.updatedAt
        };
        
        res.status(201).send({ message: 'Credential saved successfully', credential: responseCredential });
    } catch (err) {
        console.error('Credential creation error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/credentials', async (req, res) => {
    try {
        const credentials = await Credential.find({});
        console.log('Retrieved credentials count:', credentials.length);

        // Decrypt passwords for response
        const decryptedCredentials = credentials.map(cred => {
            const doc = cred.toObject();
            try {
                if (doc.password && doc.password.iv && doc.password.encryptedData && doc.password.tag) {
                    doc.password = decrypt(doc.password);
                }
            } catch (decryptError) {
                console.error('Failed to decrypt password:', decryptError);
                doc.password = '*** Failed to decrypt ***';
            }
            return doc;
        });

        res.json(decryptedCredentials);
    } catch (err) {
        console.error('Error fetching credentials:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete credential
app.delete('/api/credentials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Credential.findByIdAndDelete(id);
        res.status(200).send({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to delete credential' });
    }
});

// Delete multiple credentials
app.delete('/api/credentials', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'Invalid request format' });
        }

        const result = await Credential.deleteMany({ _id: { $in: ids } });
        res.json({ message: `${result.deletedCount} credentials deleted successfully` });
    } catch (err) {
        console.error('Error deleting credentials:', err);
        res.status(500).json({ error: err.message });
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
