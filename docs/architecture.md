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
5. Services call `BMUDataProvider`. The default binding is `MockBMUDataProvider`, which reads the seeded Postgres database. `OfficialBMUDataProvider` is selected with `BMU_DATA_PROVIDER=official` and currently returns 503. It has no Prisma client.

## Assistant

`POST /ai/chat` is student-only. `detectIntent` maps a question to one tool. Prompts that look like SQL, “all students”, or instruction override are refused and call nothing. `StudentTools` closes over the token’s student id, so a prompt cannot name another student.

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
