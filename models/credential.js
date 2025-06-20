const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    project: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    encryptedPassword: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: '' // base64-encoded image string
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Credential', credentialSchema);
