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

// Middleware setup
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false // Disabled for development
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api/credentials', credentialsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

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

// CORS Configuration
const corsOptions = {
    origin: [
        'https://password-manager-p49n.onrender.com',
        'http://localhost:3000',
        'http://localhost:5000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'X-User-Id',
        'X-User-Name',
        'X-User-Email',
        'User-Context'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Basic security headers with relaxed CSP for development
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Handle OPTIONS requests
app.options('*', cors(corsOptions));

// Connect to database
connectDB().then(() => {
    console.log('Connected to MongoDB successfully');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404s
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
