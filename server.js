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

// Trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Detailed request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Enhanced request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Security middleware with Teams-friendly CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https://*.teams.microsoft.com", "https://*.onrender.com"],
            connectSrc: ["'self'", "https://*.onrender.com", "https://*.globiq.com", "https://*.teams.microsoft.com", "https://login.microsoftonline.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://res.cdn.office.net", "https://*.onrender.com", "https://*.teams.microsoft.com", "https://statics.teams.cdn.office.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://res.cdn.office.net", "https://cdnjs.cloudflare.com", "https://statics.teams.cdn.office.net"],
            imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://statics.teams.cdn.office.net"],
            frameSrc: ["'self'", "https://teams.microsoft.com", "https://*.teams.microsoft.com", "https://*.onrender.com"],
            frameAncestors: ["'self'", "https://teams.microsoft.com", "https://*.teams.microsoft.com", "https://*.skype.com", "https://dod-teams.microsoft.us", "https://gov-teams.microsoft.us"],
            workerSrc: ["'self'", "blob:"],
            formAction: ["'self'", "https://*.teams.microsoft.com", "https://login.microsoftonline.com"],
            mediaSrc: ["'self'", "https:", "blob:"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false
}));

// CORS configuration for Teams
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'https://teams.microsoft.com',
            'https://*.teams.microsoft.com',
            'https://*.skype.com',
            'https://password-manager-for-teams.onrender.com',
            'https://dod-teams.microsoft.us',
            'https://gov-teams.microsoft.us'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if the origin matches any of our allowed patterns
        if (allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                const pattern = allowed.replace('*', '.*');
                return new RegExp(pattern).test(origin);
            }
            return allowed === origin;
        })) {
            callback(null, true);
        } else {
            console.log(`Origin ${origin} not allowed by CORS`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    credentials: true,
    maxAge: 86400 // CORS preflight cache for 24 hours
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Config endpoint for Teams
app.get('/config.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'config.html'));
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true
});

// Apply rate limiting only to API routes
app.use('/api/', limiter);

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
