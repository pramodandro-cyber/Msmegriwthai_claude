# MSMEGrowth AI — Production Upgrade Notes

## Updated System Architecture
- **Login-first route gating:** client-side route guard blocks all pages except `/login` unless a valid session token exists.
- **Authentication layer:** Google OAuth-style sign-in flow creates JWT-like session token, persists in secure cookie + local storage, and validates on app bootstrap.
- **AI intelligence layer:** company intelligence trigger on `Company Name` input (blur) calls `/company-intelligence` equivalent and returns structured JSON with `confidence_score`.
- **Analysis pipeline:** `/analyze-business` computes readiness score, `/generate-report` merges AI company intelligence + financial inputs for scheme matching and risk flags.
- **Dashboard service model:** `/user-dashboard` loads reports/profiles history and `/report-download` exports current report.

## Implemented API Surface (Spec)

### `POST /auth/google`
- Input: OAuth authorization code
- Output: `{ token, user, exp }`

### `GET /auth/session`
- Input: `Authorization: Bearer <jwt>` or secure cookie
- Output: `{ valid: boolean, user? }`

### `POST /company-intelligence`
- Input:
```json
{ "company_name": "ABC Engineering Pvt Ltd" }
```
- Output:
```json
{
  "company_name": "",
  "industry": "",
  "business_activity": "",
  "estimated_company_size": "",
  "headquarters_location": "",
  "years_in_operation": "",
  "company_description": "",
  "market_presence": "",
  "risk_indicators": "",
  "confidence_score": 0
}
```

### `POST /analyze-business`
- Input: normalized business profile
- Output: `{ "score": 0-100 }`

### `POST /generate-report`
- Input: business profile + company intelligence
- Output: funding score, loan eligibility, subsidy estimate, risk flags, scheme recommendations

### `GET /user-dashboard`
- Output: my reports, recent reports, funding score history, saved business profiles

### `GET /report-download/:id`
- Output: PDF stream (current mock exports report JSON file)

## Security & Reliability Upgrades
- Mandatory authentication before pricing, forms, report, and dashboard routes.
- Session expiry validation on app bootstrap.
- Secure cookie session write (`Secure; SameSite=Strict`) + token-based session checks.
- Input normalization in business analysis path.
- Stable async loading states for auth, intelligence, and report generation.
- Report/profile persistence with bounded history for dashboard stability.

## Bug Fixes & Stability Improvements Completed
- Fixed unauthenticated access to pricing/assessment/report/dashboard routes.
- Fixed report generation pipeline to always persist latest report history before navigation.
- Fixed missing company-intelligence prefill by binding intelligence trigger to company name blur.
- Fixed dashboard empty-state crashes by defensive rendering + default arrays.
- Reduced user-flow inconsistency by enforcing strict sequence: Login → Pricing → Input → Analysis → Report → Dashboard.

## Database Schema Changes (Required for backend production)

### `users`
- `id` (pk)
- `email` (unique)
- `name`
- `oauth_provider`
- `oauth_subject`
- `created_at`

### `sessions`
- `id` (pk)
- `user_id` (fk)
- `jwt_id`
- `expires_at`
- `created_at`

### `business_profiles`
- `id` (pk)
- `user_id` (fk)
- `company_name`
- `industry`
- `state`
- `years_in_operation`
- `payload_json`
- `updated_at`

### `company_intelligence`
- `id` (pk)
- `profile_id` (fk)
- `source_summary_json`
- `normalized_output_json`
- `confidence_score`
- `updated_at`

### `reports`
- `id` (pk)
- `user_id` (fk)
- `profile_id` (fk)
- `funding_readiness_score`
- `loan_eligibility`
- `subsidy_estimation`
- `report_json`
- `created_at`
