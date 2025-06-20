const Admin = require('../models/admin');

const adminAuthMiddleware = async (req, res, next) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');
        const userName = req.header('X-User-Name');

        if (!userId || !userEmail) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check if user is an admin
        const admin = await Admin.findOne({ 
            userEmail: userEmail,
            isActive: true 
        });

        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.admin = { userId, userName, userEmail };
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = adminAuthMiddleware;
