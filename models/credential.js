const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
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
    username: {
        type: String,
        required: true,
        trim: true
    },
    encryptedPassword: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    },
    isAdminOnly: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    }],
    expiresAt: {
        type: Date
    },
    lastAccessed: {
        type: Date
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

// Index for better search performance
credentialSchema.index({ project: 1, category: 1, name: 1 });
credentialSchema.index({ sharedWith: 1 });

// Pre-save middleware to update the updatedAt timestamp
credentialSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Credential', credentialSchema);
