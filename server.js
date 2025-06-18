require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const { encrypt, decrypt } = require('./utils/encryption');
const Credential = require('./models/credential');

const app = express();

// Detailed request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    
    // Log response
    const oldSend = res.send;
    res.send = function(data) {
        console.log('Response:', data);
        oldSend.apply(res, arguments);
    };
    next();
});

// CORS configuration
app.use(cors({
    origin: '*',  // Allow all origins temporarily for debugging
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Basic security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Config endpoint for Teams
app.get('/config.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'config.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB
connectDB();

// Import routes
const credentialsRoute = require('./routes/credentials');

// Use routes
app.use('/api/credentials', credentialsRoute);

// Debug route
app.get('/api/debug', async (req, res) => {
    try {
        const credentials = await Credential.find({});
        console.log('Debug route - Stored credentials:', credentials.length);
        res.json({ count: credentials.length, credentials });
    } catch (err) {
        console.error('Debug route error:', err);
        res.status(500).json({ error: err.message });
    }
});

// API Routes for credentials
app.post('/api/credentials', async (req, res) => {
    console.log('Received POST request to /api/credentials');
    console.log('Request body:', { 
        name: req.body.name,
        username: req.body.username,
        hasPassword: !!req.body.password 
    });

    try {
        const { name, username, password } = req.body;

        // Validate request body
        if (!name || !username || !password) {
            console.log('Validation failed:', { 
                hasName: !!name, 
                hasUsername: !!username, 
                hasPassword: !!password 
            });
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { 
                    hasName: !!name, 
                    hasUsername: !!username, 
                    hasPassword: !!password 
                }
            });
        }        // Encrypt the password
        const encryptedPassword = encrypt(password);
        console.log('Password encrypted successfully');

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

        // Save to database
        const savedCredential = await credential.save();
        console.log('Credential saved successfully:', savedCredential._id);
        
        // Send back credential without sensitive data
        res.status(201).json({
            message: 'Credential saved successfully',
            credential: {
                _id: savedCredential._id,
                name: savedCredential.name,
                username: savedCredential.username
            }
        });
    } catch (err) {
        console.error('Error saving credential:', err);
        res.status(500).json({ error: 'Failed to save credential', details: err.message });
    }
});

app.get('/api/credentials', async (req, res) => {
    console.log('Received GET request to /api/credentials');
    try {
        const credentials = await Credential.find({}).lean();
        console.log('Raw credentials from DB:', credentials);
        console.log('Retrieved credentials count:', credentials.length);const sanitizedCredentials = credentials.map(cred => {
            try {
                const decryptedPassword = decrypt({
                    iv: cred.password.iv,
                    encryptedData: cred.password.encryptedData,
                    tag: cred.password.tag
                });
                return {
                    _id: cred._id,
                    name: cred.name,
                    username: cred.username,
                    password: decryptedPassword
                };
            } catch (err) {
                console.error('Error decrypting password for credential:', cred._id, err);
                return {
                    _id: cred._id,
                    name: cred.name,
                    username: cred.username,
                    password: '*** Failed to decrypt ***'
                };
            }
        });

        console.log('Sending credentials to client:', sanitizedCredentials.length);
        res.json(sanitizedCredentials);
    } catch (err) {
        console.error('Error fetching credentials:', err);
        res.status(500).json({ error: 'Failed to fetch credentials', details: err.message });
    }
});

app.delete('/api/credentials/:id', async (req, res) => {
    console.log('Received DELETE request for credential:', req.params.id);
    try {
        const { id } = req.params;
        const result = await Credential.findByIdAndDelete(id);
        console.log('Delete result:', result);
        if (!result) {
            return res.status(404).json({ error: 'Credential not found' });
        }
        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ error: 'Failed to delete credential', details: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: err.message 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
