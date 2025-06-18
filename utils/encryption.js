const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default32charencryptionkeyfordevonly';
const IV_LENGTH = 16;

// Validate encryption key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('Invalid encryption key. Key must be 32 characters long.');
}

function encrypt(text) {
    if (!text) {
        throw new Error('No text provided for encryption');
    }

    try {
        // Create initialization vector
        const iv = crypto.randomBytes(IV_LENGTH);
        
        // Create cipher
        const cipher = crypto.createCipheriv(
            'aes-256-gcm', 
            Buffer.from(ENCRYPTION_KEY), 
            iv
        );
        
        // Encrypt
        const encrypted = Buffer.concat([
            cipher.update(text.toString()), // Convert to string in case a number is passed
            cipher.final()
        ]);
        
        // Get auth tag
        const tag = cipher.getAuthTag();
        
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted.toString('hex'),
            tag: tag.toString('hex')
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error(`Failed to encrypt data: ${error.message}`);
    }
}

function decrypt(encrypted) {
    if (!encrypted || !encrypted.iv || !encrypted.encryptedData || !encrypted.tag) {
        throw new Error('Invalid encrypted data structure');
    }

    try {
        // Create decipher
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(ENCRYPTION_KEY),
            Buffer.from(encrypted.iv, 'hex')
        );
        
        // Set auth tag
        decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
        
        // Decrypt
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted.encryptedData, 'hex')),
            decipher.final()
        ]);
        
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error(`Failed to decrypt data: ${error.message}`);
    }
}

module.exports = { encrypt, decrypt };
