# Security

This repository is an unofficial demo. It is not a Baku Engineering University system and it must not be described as one.

## Secrets

- Do not commit `.env`, keystores, upload passwords, API keys, or crash DSNs.
- `.env.development` contains obvious local demo secrets only. Do not reuse them anywhere else.
- `.env.staging.example` and `.env.production.example` are templates.
- Refresh tokens are stored as hashes. `JWT_REFRESH_SECRET` is reserved and optional; it is not required for the current hash scheme.
- Audit metadata redacts keys that look like passwords, tokens, cookies, or API keys. Do not put secrets in the audit action string.

## Access control

Authorization is enforced in the API. The Flutter client is not a security boundary.

- Student routes use the student id from the JWT, not from the query or body.
- `roleHasPermission` maps `STUDENT`, `TEACHER`, and `ADMIN`. Students receive own-read permissions such as `schedule.read.own` and `library.loans.read.own`. They do not receive `grades.manage`.
- Admins receive staff permissions (teacher academic tools plus user, audit, flag, and directory management). Extra staff titles are an optional `User.staffRole` string. The `Role` enum stays `STUDENT | TEACHER | ADMIN`.
- Library loans and dorm applications are loaded with the authenticated student id. Dormitory listings omit roommate identities.
- The assistant refuses prompt-injection phrasing and requests for every student, in English, Azerbaijani, and Russian. It still cannot call the database directly.

## Production data

`NODE_ENV=production` starts only when `BMU_DATA_PROVIDER` is exactly `official`. Mock seed data is not a fallback. The official provider is still a closed stub: it does not call a university API and it does not invent records.

## Files and push

- Uploads are limited to an allowlist of MIME types and 10 MB. Object keys reject path traversal. Bytes are not stored in Prisma.
- The S3-compatible provider throws if endpoint, bucket, or keys are missing. This build does not upload even when those values are set, because no S3 client is bundled.
- Push delivery is a no-op unless FCM settings exist, and even then this build does not send.

## Health and errors

- `GET /health/live` does not touch the database. `GET /health/ready` runs `SELECT 1`.
- API errors are `{ code, message, requestId }`. Stack traces are not returned to clients. Production 500 responses use a generic message.
- `x-request-id` is set on each request. `/api/v1/...` is rewritten onto the existing routes.

## Accounts and sensitive directories

- `User.deletionRequestedAt` records a request. It does not delete the row, backups, or objects.
- `StudentServiceInfo` is a directory of hours and location. It has no diagnosis or patient fields.
- Attendance thresholds live in `AttendancePolicy`. They are app settings, not a university regulation.

## What this file does not do

It does not replace a legal review, a penetration test, or university approval to use BMU names and marks.
