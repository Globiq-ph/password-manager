require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const credentialsRoutes = require('./routes/credentials');
const adminRoutes = require('./routes/admin');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname)));

// Parse JSON bodies with increased limit - THIS MUST COME BEFORE OTHER MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy
app.set('trust proxy', 1);

// Request logging middleware - AFTER body parsing
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.url}`);
    
    // Log headers
    console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'x-user-id': req.headers['x-user-id'],
        'x-user-name': req.headers['x-user-name'],
        'x-user-email': req.headers['x-user-email']
    });

    // Safely log request body for POST/PUT requests
    if (['POST', 'PUT'].includes(req.method) && req.body) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) {
            sanitizedBody.password = '********';
        }
        console.log('Request body:', sanitizedBody);
    }

    next();
});

// CORS configuration
const corsOptions = {
    origin: [
        'https://password-manager-p49n.onrender.com',
        'http://localhost:3000',
        'http://localhost:5000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'X-User-Id',
        'X-User-Name',
        'X-User-Email',
        'User-Context'
    ],
    exposedHeaders: ['Content-Length', 'X-Content-Type'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Basic security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Connect to database
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Routes
app.use('/api/credentials', credentialsRoutes);
app.use('/api/admin', adminRoutes);

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin.html for /admin path
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {},
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Handle 404s
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
