const authMiddleware = (req, res, next) => {
    console.log('Auth middleware - headers:', req.headers);

    // Extract user information from headers
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'];
    const userEmail = req.headers['x-user-email'];

    // Log the extracted information
    console.log('Auth middleware - extracted user info:', { userId, userName, userEmail });

    // Check if all required headers are present
    if (!userId || !userName || !userEmail) {
        console.log('Auth middleware - missing required headers');
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Missing required authentication headers',
            details: { userId: !!userId, userName: !!userName, userEmail: !!userEmail }
        });
    }

    // Attach user information to request object
    req.user = {
        id: userId,
        name: userName,
        email: userEmail
    };

    console.log('Auth middleware - authentication successful');
    next();
};

module.exports = authMiddleware;
