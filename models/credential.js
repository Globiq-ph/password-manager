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
    // New fields for access control
    ownerId: {
        type: String,
        required: true,
        index: true
    },
    ownerName: {
        type: String,
        required: true
    },
    ownerEmail: {
        type: String,
        required: true
    },
    sharedWith: [{
        userId: String,
        userName: String,
        userEmail: String,
        accessLevel: {
            type: String,
            enum: ['read', 'write'],
            default: 'read'
        }
    }],
    lastModifiedBy: {
        userId: String,
        userName: String,
        userEmail: String,
        timestamp: {
            type: Date,
            default: Date.now
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

// Update the updatedAt timestamp and lastModifiedBy before saving
credentialSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    // lastModifiedBy is updated by the route handler
    next();
});

module.exports = mongoose.model('Credential', credentialSchema);
