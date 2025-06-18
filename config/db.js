const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MongoDB connection string is missing in environment variables');
        }

        console.log('Connecting to MongoDB...');
        mongoose.set('debug', true); // Enable debugging

        // Configure mongoose
        mongoose.set('strictQuery', false);
        
        // Connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true,
            },
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Send a ping to confirm a successful connection
        await conn.connection.db.admin().ping();
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error during MongoDB disconnection:', err);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error:`, error);
        // Log more details about the connection error
        if (error.name === 'MongoServerError') {
            console.error('MongoDB Server Error Details:', {
                code: error.code,
                codeName: error.codeName,
                errorLabels: error.errorLabels,
            });
        }
        throw error; // Re-throw to be handled by the caller
    }
};

module.exports = connectDB;
