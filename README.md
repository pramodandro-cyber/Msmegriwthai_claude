# Msmegriwthai_claude

Secure middleware stack implementation for:

- `/api/company-intelligence`
- `/api/analyze-business`
- `/api/generate-report`
- `/api/dashboard`
- `/api/report/:id`

## Security controls applied consistently

- **Rate limiting** per authenticated user (fallback IP-based) on all protected API routes.
- **Token + session validation** via JWT and `x-session-id` matching.
- **Input sanitization and validation** on payloads.
- **Secure upload checks** (`/api/company-intelligence`): MIME/type, size (5MB), and content signature verification.
- **Encryption at rest** for sensitive business/user fields using AES-256-GCM and an environment-provided key.

## Environment variables

- `JWT_SECRET` (required)
- `JWT_ISSUER` (optional, default: `msmegriwthai-api`)
- `JWT_AUDIENCE` (optional, default: `msmegriwthai-client`)
- `ENCRYPTION_KEY` (required, base64 encoded 32-byte key)
- `PORT` (optional, default: `3000`)

## Run

```bash
npm install
npm start
```
