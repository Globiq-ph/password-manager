const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vincentnbation1:Zp8hAe473OmcwjGS@cluster0.zu5suxb.mongodb.net/passwordmanager?retryWrites=true&w=majority';

async function testConnection() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('Successfully connected to MongoDB');
        console.log('Connection details:', mongoose.connection.host);
    } catch (error) {
        console.error('Connection error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
