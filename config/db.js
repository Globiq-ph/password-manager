const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MongoDB connection string is missing in environment variables');
        }

        console.log('Connecting to MongoDB...');
        mongoose.set('debug', true);  // Enable debugging

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Send a ping to confirm a successful connection
        await conn.connection.db.command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
