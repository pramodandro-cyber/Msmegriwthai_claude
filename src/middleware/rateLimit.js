const rateLimit = require('express-rate-limit');

const analysisAndReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }

    return `ip:${req.ip}`;
  },
  message: {
    error: 'Too many requests. Please retry later.'
  }
});

module.exports = {
  analysisAndReportLimiter
};
