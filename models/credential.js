const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    project: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        iv: String,
        encryptedData: String,
        tag: String
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'restricted'],
        default: 'active'
    },
    isAdminOnly: {
        type: Boolean,
        default: false
    },
    createdBy: {
        userId: {
            type: String,
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        }
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
