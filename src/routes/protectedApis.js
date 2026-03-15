const express = require('express');
const { sanitizePayload, commonPayloadValidation, enforceValidation } = require('../middleware/validation');
const { validateTokenAndSession } = require('../middleware/auth');
const { analysisAndReportLimiter } = require('../middleware/rateLimit');
const { upload, validateUploadedFile } = require('../middleware/upload');
const { encryptField, decryptField } = require('../utils/encryption');

const router = express.Router();
const reports = new Map();

router.use(validateTokenAndSession);
router.use(analysisAndReportLimiter);
router.use(express.json({ limit: '1mb' }));
router.use(sanitizePayload);

router.post(
  '/api/company-intelligence',
  upload.single('file'),
  validateUploadedFile,
  commonPayloadValidation,
  enforceValidation,
  (req, res) => {
    const encryptedCompanyName = encryptField(req.body.companyName || '');

    return res.status(200).json({
      status: 'secured',
      endpoint: 'company-intelligence',
      encryptedCompanyName,
      fileAccepted: Boolean(req.file)
    });
  }
);

router.post('/api/analyze-business', commonPayloadValidation, enforceValidation, (req, res) => {
  const encryptedBusinessId = encryptField(req.body.businessId || '');

  return res.status(200).json({
    status: 'secured',
    endpoint: 'analyze-business',
    encryptedBusinessId
  });
});

router.post('/api/generate-report', commonPayloadValidation, enforceValidation, (req, res) => {
  const reportId = `r-${Date.now()}`;
  const encryptedUserEmail = encryptField(req.body.userEmail || '');

  reports.set(reportId, {
    reportId,
    owner: req.user.id,
    encryptedUserEmail,
    createdAt: new Date().toISOString(),
    reportType: req.body.reportType || 'summary'
  });

  return res.status(201).json({ reportId, status: 'generated' });
});

router.post('/api/dashboard', commonPayloadValidation, enforceValidation, (req, res) => {
  return res.status(200).json({
    status: 'secured',
    endpoint: 'dashboard',
    filters: req.body.dashboardFilters || {}
  });
});

router.get('/api/report/:id', (req, res) => {
  const report = reports.get(req.params.id);

  if (!report || report.owner !== req.user.id) {
    return res.status(404).json({ error: 'Report not found' });
  }

  return res.status(200).json({
    ...report,
    userEmail: decryptField(report.encryptedUserEmail)
  });
});

module.exports = router;
