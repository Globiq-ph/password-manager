const Admin = require('../models/admin');

const adminAuthMiddleware = async (req, res, next) => {
    try {
        const userId = req.header('X-User-Id');
        const userEmail = req.header('X-User-Email');
        const userName = req.header('X-User-Name');

        if (!userId || !userEmail) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // For dev user
        if (userId === 'dev-user' && userEmail === 'dev@globiq.com') {
            req.admin = { userId, userName: 'John Doe', userEmail };
            return next();
        }

        // Check if user is an admin
        const admin = await Admin.findOne({ 
            userEmail: userEmail,
            isActive: true 
        });

        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = adminAuthMiddleware;
