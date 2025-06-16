const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

// Validate encryption key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('Invalid encryption key. Key must be 32 characters long.');
}

function encrypt(text) {
    if (!text) {
        throw new Error('No text provided for encryption');
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex'),
        tag: tag.toString('hex')
    };
}

function decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(ENCRYPTION_KEY),
        Buffer.from(encrypted.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted.encryptedData, 'hex')),
        decipher.final()
    ]);
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
