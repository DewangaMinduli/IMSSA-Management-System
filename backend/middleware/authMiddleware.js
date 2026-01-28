const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// 1. VERIFY TOKEN (Is the user logged in?)
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No Token Provided." });
    }

    try {
        // Remove "Bearer " prefix if it exists
        const tokenString = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;

        const verified = jwt.verify(tokenString, process.env.JWT_SECRET);
        req.user = verified; // Stores { id: 1, role: 'executive' }
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

// 2. CHECK ROLE (Does the user have permission?)
exports.checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user role matches one of the allowed roles
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access Denied. You do not have permission. Required: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
};