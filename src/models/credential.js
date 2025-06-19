const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const credentialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
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
        default: 'Default',
        trim: true
    },
    category: {
        type: String,
        default: 'General',
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Pre-save middleware to encrypt password
credentialSchema.pre('save', function(next) {
    if (this.isModified('password') && typeof this.password === 'string') {
        const encrypted = encrypt(this.password);
        this.password = encrypted;
    }
    next();
});

// Method to decrypt password
credentialSchema.methods.getDecryptedPassword = function() {
    try {
        return decrypt(this.password);
    } catch (error) {
        console.error('Error decrypting password:', error);
        return null;
    }
};

// Virtual for decrypted password
credentialSchema.virtual('decryptedPassword').get(function() {
    return this.getDecryptedPassword();
});

const Credential = mongoose.model('Credential', credentialSchema);

module.exports = Credential;
