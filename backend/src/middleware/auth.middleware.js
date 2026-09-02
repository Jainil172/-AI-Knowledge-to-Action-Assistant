import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
    }

    try {
        const defaultSecret = 'hackathon_secret_key_123'; // ensure it matches controller secret strategy
        const decoded = jwt.verify(token, process.env.JWT_SECRET || defaultSecret);
        req.user = decoded; // { id, email }
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }
};
