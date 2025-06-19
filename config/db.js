const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // Log the connection attempt in production
        if (process.env.NODE_ENV === 'production') {
            console.log('Attempting to connect to MongoDB...');
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Increased timeout for production
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            maxPoolSize: 10, // Limit connection pool for better stability
            retryWrites: true,
            w: 'majority' // Ensure writes are acknowledged by majority
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection errors after initial connection
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
            // Attempt to reconnect
            console.log('Attempting to reconnect to MongoDB...');
            setTimeout(() => {
                mongoose.connect(process.env.MONGODB_URI).catch(console.error);
            }, 5000);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
            setTimeout(() => {
                mongoose.connect(process.env.MONGODB_URI).catch(console.error);
            }, 5000);
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        // Exit process with failure if initial connection fails
        process.exit(1);
    }
};

module.exports = connectDB;
