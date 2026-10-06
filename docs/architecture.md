# Architecture

The repository is a monorepo.

```text
bmu-student-app/
├── apps/mobile     Flutter client
├── apps/api        NestJS REST API
├── prisma          PostgreSQL schema, migrations, seed
├── docs
└── .github/workflows/ci.yml
```

## Request path

1. The Flutter app stores an access token and a refresh token after `POST /auth/login`.
2. Access tokens are JWTs. The payload contains `sub`, `role`, `studentId`, and `teacherId`. A random `jti` makes each token unique.
3. Refresh tokens are random strings. Only their SHA-256 hash is stored. Refresh rotates the token. Reuse of a revoked token revokes the user’s remaining refresh tokens.
4. `JwtAuthGuard` and `RolesGuard` run before student routes. Handlers call `requireStudent`, which reads the id from the token, not from the query or body.
5. Services call `BMUDataProvider`. `assertDataProviderPolicy()` chooses the implementation. `mock` is allowed in development and test. `NODE_ENV=production` throws unless the value is exactly `official`. `OfficialBMUDataProvider` has no Prisma client and returns 503. It is not a live BMU integration.
6. `/health/live` does not use the database. `/health/ready` runs `SELECT 1`. Errors are `{ code, message, requestId }`. The `x-request-id` header is set on the response. Paths under `/api/v1` are rewritten onto the unversioned routes.

## Assistant

`POST /ai/chat` is student-only. `detectIntent` maps a question to one tool, including the Azerbaijani and Russian phrases covered by `intent.spec.ts`. Prompts that look like SQL, “all students”, “bütün tələbələr”, “все студенты”, or instruction override are refused and call nothing. `StudentTools` closes over the token’s student id, so a prompt cannot name another student.

## Permissions and release-candidate modules

`roleHasPermission` is enforced on new routes with `PermissionsGuard`. Students do not receive staff permissions such as `grades.manage`. Library loans and dorm applications ignore any student id supplied by the client.

Library, dormitory, career, dining, and student-service directory routes read Prisma directly. Dining prices are labeled demo. The service directory has no medical records. Audit rows redact secret-like metadata. Device registration does not log the raw push token. A small in-process `JobRunner` can enqueue reminder and cleanup jobs without holding the HTTP request open.

## Campus map

Buildings store latitude and longitude for a future map SDK. Responses include `mapReady: false`. The mobile campus screen says the directory is not GPS.

## Security controls

- `class-validator` DTOs and a global whitelist pipe
- Role checks on student routes
- `@nestjs/throttler` (stricter on login and refresh)
- `helmet`
- CORS from `CORS_ORIGIN`
- bcrypt password hashes
- Secrets only from the environment
