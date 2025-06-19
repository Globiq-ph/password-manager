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

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false // Disabled for development
}));

// Parse JSON bodies with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes with proper error handling
app.use('/api/credentials', credentialsRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files - ensure absolute paths
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Error handling for API routes
app.use('/api', (err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Serve the HTML file for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API routes with error handling
app.use('/api/credentials', credentialsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
