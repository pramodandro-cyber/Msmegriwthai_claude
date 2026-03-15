const { body, validationResult } = require('express-validator');

function stripDangerousChars(input) {
  return String(input)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

function deepSanitize(target) {
  if (typeof target === 'string') {
    return stripDangerousChars(target);
  }

  if (Array.isArray(target)) {
    return target.map((item) => deepSanitize(item));
  }

  if (target && typeof target === 'object') {
    const sanitizedObject = {};
    for (const [key, value] of Object.entries(target)) {
      sanitizedObject[key] = deepSanitize(value);
    }
    return sanitizedObject;
  }

  return target;
}

function sanitizePayload(req, _res, next) {
  req.body = deepSanitize(req.body || {});
  req.query = deepSanitize(req.query || {});
  next();
}

const commonPayloadValidation = [
  body('companyName').optional().isString().isLength({ min: 1, max: 150 }),
  body('analysisType').optional().isIn(['risk', 'market', 'financial', 'operations']),
  body('reportType').optional().isIn(['summary', 'detailed', 'executive']),
  body('data').optional().isObject(),
  body('dashboardFilters').optional().isObject(),
  body('businessId').optional().isUUID(),
  body('userEmail').optional().isEmail()
];

function enforceValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Request validation failed',
      details: errors.array()
    });
  }

  return next();
}

module.exports = {
  sanitizePayload,
  commonPayloadValidation,
  enforceValidation
};
