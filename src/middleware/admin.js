const adminAuthMiddleware = (req, res, next) => {
    // No-op: admin is now checked via X-Admin header in route handlers
    next();
};

module.exports = adminAuthMiddleware;
