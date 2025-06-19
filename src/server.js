require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('../config/db');

// Import routes
const credentialsRoutes = require('./routes/credentials');
const adminRoutes = require('./routes/admin');

const app = express();

// Serve static files from root and src directories
app.use(express.static(path.join(__dirname, '..'))); // Serve files from root
app.use('/src', express.static(path.join(__dirname))); // Serve files from src

// Parse JSON bodies with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy
app.set('trust proxy', 1);

// Request logging middleware
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
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://password-manager-p49n.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'x-user-id',
        'x-user-name',
        'x-user-email'
    ],
    credentials: true
};

app.use(cors(corsOptions));

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://password-manager-p49n.onrender.com"]
        }
    }
}));

// API routes
app.use('/api/credentials', credentialsRoutes);
app.use('/api/admin', adminRoutes);

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
