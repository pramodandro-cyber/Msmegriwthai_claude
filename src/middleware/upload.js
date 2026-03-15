const multer = require('multer');
const { fileTypeFromBuffer } = require('file-type');

const allowedMimeTypes = new Set([
  'application/pdf',
  'text/csv',
  'application/json'
]);

const maxFileSizeBytes = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }
    return cb(null, true);
  }
});

async function validateUploadedFile(req, res, next) {
  if (!req.file) {
    return next();
  }

  const detected = await fileTypeFromBuffer(req.file.buffer);

  if (detected && !allowedMimeTypes.has(detected.mime)) {
    return res.status(400).json({ error: 'Uploaded file content does not match expected type' });
  }

  if (!req.file.buffer || req.file.buffer.length === 0) {
    return res.status(400).json({ error: 'Uploaded file is empty or unreadable' });
  }

  return next();
}

module.exports = {
  upload,
  validateUploadedFile,
  maxFileSizeBytes,
  allowedMimeTypes
};
