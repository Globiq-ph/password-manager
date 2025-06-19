const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16
const TAG_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        tag: tag.toString('hex')
    };
}

function decrypt(encrypted) {
    try {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(ENCRYPTION_KEY),
            Buffer.from(encrypted.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
        
        let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

module.exports = {
    encrypt,
    decrypt
};
