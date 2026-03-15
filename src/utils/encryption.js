const crypto = require('crypto');

const ENCRYPTION_ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function resolveKey() {
  const base64Key = process.env.ENCRYPTION_KEY;

  if (!base64Key) {
    throw new Error('ENCRYPTION_KEY is required and must be a base64 encoded 32-byte key');
  }

  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  }

  return key;
}

function encryptField(plaintext) {
  if (plaintext === undefined || plaintext === null) {
    return null;
  }

  const key = resolveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    algorithm: ENCRYPTION_ALGO,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    value: encrypted.toString('base64')
  };
}

function decryptField(payload) {
  if (!payload || !payload.iv || !payload.authTag || !payload.value) {
    return null;
  }

  const key = resolveKey();
  const decipher = crypto.createDecipheriv(
    payload.algorithm || ENCRYPTION_ALGO,
    key,
    Buffer.from(payload.iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.value, 'base64')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

module.exports = {
  encryptField,
  decryptField
};
