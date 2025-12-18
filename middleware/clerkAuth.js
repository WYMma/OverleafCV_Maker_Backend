const { clerkClient } = require('@clerk/clerk-sdk-node');

/**
 * Middleware to verify Clerk authentication token
 * Extracts user ID from the token and attaches it to req.userId
 */
const verifyClerkToken = async (req, res, next) => {
    try {
        // LOUD check for placeholder secret key
        const secretKey = process.env.CLERK_SECRET_KEY;
        if (!secretKey || secretKey === 'your_clerk_secret_key_here') {
            console.error('\n!!! CRITICAL ERROR: CLERK_SECRET_KEY is MISSING or using a PLACEHOLDER in .env !!!');
            console.error('Please get your Secret Key from the Clerk Dashboard: https://dashboard.clerk.com\n');
            return res.status(500).json({ error: 'Auth configuration error in backend' });
        }

        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify the JWT token with Clerk
        try {
            // In Clerk SDK v4+, verifyToken is the recommended way to verify JWTs locally
            const decodedToken = await clerkClient.verifyToken(token, {
                secretKey: secretKey,
            });

            if (!decodedToken || !decodedToken.sub) {
                console.error('Token verification failed: No sub claim found', decodedToken);
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Attach user ID to request object (sub = userId)
            req.userId = decodedToken.sub;
            next();
        } catch (clerkError) {
            // Check for the "Gone" error which often indicates an API mismatch
            if (clerkError.status === 410) {
                console.error('\n!!! CLERK AUTH ERROR: Received 410 Gone !!!');
                console.error('This often means the SDK is trying to reach a deprecated endpoint.');
                console.error('Please ensure your Clerk instance is up to date and your secret key is correct.\n');
            } else {
                console.error('Clerk verification error:', clerkError.message);
            }
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports = { verifyClerkToken };
