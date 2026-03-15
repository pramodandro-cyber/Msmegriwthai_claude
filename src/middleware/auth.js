const jwt = require('jsonwebtoken');

function validateTokenAndSession(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: process.env.JWT_ISSUER || 'msmegriwthai-api',
      audience: process.env.JWT_AUDIENCE || 'msmegriwthai-client'
    });

    const sessionId = req.headers['x-session-id'];
    if (!sessionId || sessionId !== decoded.sessionId) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      sessionId: decoded.sessionId
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
}

module.exports = { validateTokenAndSession };
