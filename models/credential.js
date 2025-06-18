const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        encryptedData: {
            type: String,
            required: true
        },
        iv: {
            type: String,
            required: true
        },
        tag: {
            type: String,
            required: true
        }
    },
    project: {
        type: String,
        required: true,
        default: 'Default'
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'restricted'],
        default: 'active'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        default: 'General'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
credentialSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Credential', credentialSchema);
