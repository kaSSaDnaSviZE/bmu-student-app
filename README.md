# BMU Student App

A demo student application for **Baku Engineering University (BMU)**. A student can sign in and see schedule, courses, grades, attendance, assignments, the academic calendar, campus directory, events, clubs, a demo digital ID, and a scoped student assistant.

This project is **not** an official Baku Engineering University application and it is **not** connected to BMU’s private systems. It does not contain real student records. Academic data is seeded fiction served through `MockBMUDataProvider`.

`NODE_ENV=production` refuses to start unless `BMU_DATA_PROVIDER` is exactly `official`. There is no silent fallback to mock data. `OfficialBMUDataProvider` still fails closed (HTTP 503) until a real university API exists. Selecting `official` does not mean the integration works.

## Features

- Student, teacher, and admin authentication (JWT access tokens, rotating refresh tokens, hashed passwords)
- Student profile limited to the signed-in student
- Class schedule for today, tomorrow, and the week, including cancellations and room changes
- Courses with teacher, schedule, materials, assignments, grades, attendance, and announcements
- Grades and a final-exam calculator
- Attendance by course
- Assignments and deadlines
- Academic calendar
- Campus directory (buildings, classrooms, library, cafeteria, gym, administration, dormitories)
- Events (view, detail, register, cancel)
- Clubs (browse, join, leave)
- Demo digital student ID with a QR payload
- Basic student assistant that can only call scoped tools
- English, Azerbaijani, and Russian UI strings (default English) and light/dark Material 3 themes

## Tech stack

| Area | Choice |
| --- | --- |
| Mobile | Flutter, Dart, Material 3, Riverpod, GoRouter |
| API | Node.js, TypeScript, NestJS, REST, Swagger |
| Database | PostgreSQL, Prisma |
| Infra | Docker Compose, GitHub Actions |

## Architecture

```text
Flutter app  --REST/JWT-->  NestJS API  -->  BMUDataProvider
                                              ├─ MockBMUDataProvider      (Prisma, demo seed; not allowed in production)
                                              └─ OfficialBMUDataProvider  (selected only when BMU_DATA_PROVIDER=official; not connected)
```

`assertDataProviderPolicy()` is the only switch. The Nest factory calls it. Bootstrap calls it again and exits if production is misconfigured. Development and test may use `mock`. The local Compose file sets `NODE_ENV=development` for that reason; a production deploy must not copy that override.

The API also has server-side permissions (`schedule.read.own`, `grades.manage`, and the rest in `apps/api/src/common/permissions.ts`). Students get own-read permissions. Admins get staff permissions. The Flutter UI is not the source of truth. Extra staff titles are `User.staffRole`, not new `Role` enum values.

Request handling adds `x-request-id`, accepts `/api/v1/...` as an alias of the unversioned routes, and returns errors as `{ code, message, requestId }` without a stack trace. `/health/live` does not touch Postgres. `/health/ready` runs `SELECT 1`.

File bytes go through `ObjectStorageProvider` (local disk, or an S3-shaped provider that throws when it is not configured). They are not stored in Prisma. Push and FCM-shaped sends do nothing without configuration, and this build does not call Google.

The assistant never receives a database client. It calls `StudentTools`, which only forwards the authenticated student id into:

- `getStudentSchedule`
- `getStudentCourses`
- `getStudentGrades`
- `getStudentAttendance`
- `getStudentDeadlines`
- `getAcademicCalendar`
- `getCampusLocation`

Azerbaijani and Russian phrases map to those same intents. Prompt injection and “all students” phrasing are refused.

See [docs/architecture.md](docs/architecture.md), [docs/database.md](docs/database.md), [docs/api.md](docs/api.md), [SECURITY.md](SECURITY.md), and [RELEASE.md](RELEASE.md).

## Environments

| File | Purpose |
| --- | --- |
| `.env.development` | Committed demo secrets for a laptop. `BMU_DATA_PROVIDER=mock` |
| `.env.example` | Template. Copy to `.env` |
| `.env.staging.example` | Unfilled staging template. Production mode requires `official` |
| `.env.production.example` | Unfilled production template. Mock will not boot |

Do not commit a filled `.env`. Production and the API container image (`NODE_ENV=production`) must set `BMU_DATA_PROVIDER=official`. That still does not connect to BMU; the official provider returns 503. App Store, Play, signing keys, hosting, SSO, legal review, and branding permission are tracked in [RELEASE_BLOCKERS.md](RELEASE_BLOCKERS.md). Backups are not configured ([docs/backup.md](docs/backup.md)).

## Installation

Requirements: Node.js 22, npm, PostgreSQL 16 (or Docker), Flutter stable.

```bash
git clone https://github.com/kaSSaDnaSviZE/bmu-student-app.git
cd bmu-student-app
cp .env.example .env
```

Edit `.env` and set `JWT_ACCESS_SECRET` to at least 32 random characters. Do not commit `.env`. For a local demo you can `cp .env.development .env` instead. Do not use that file in production.

### Database

With Docker:

```bash
docker compose up -d postgres
```

Or use your own Postgres and set `DATABASE_URL`.

```bash
npm ci
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma db seed
```

### Backend

```bash
npm run dev:api
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/docs`  
Health: `http://localhost:3000/health`

The full stack, including the API container, is:

```bash
docker compose up --build
```

Seed after the API container is up:

```bash
docker compose exec api npx prisma db seed
```

### Flutter

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3000
```

Android emulator: use `http://10.0.2.2:3000`. A physical device needs your computer’s LAN address.

### Tests

```bash
npm test
npm run lint
npm run typecheck
npm run build
cd apps/mobile && flutter analyze && flutter test
```

## Environment variables

| Name | Purpose |
| --- | --- |
| `APP_ENV` | `development`, `staging`, or `production` label |
| `NODE_ENV` | `production` refuses any data provider except `official` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | HMAC secret, minimum 32 characters |
| `JWT_REFRESH_SECRET` | Optional separate secret. Unused by the current refresh-token hash |
| `JWT_ACCESS_TTL` | Access token lifetime in seconds (default 900) |
| `JWT_REFRESH_TTL_DAYS` | Refresh token lifetime (default 14) |
| `PORT` | API port (default 3000) |
| `CORS_ORIGIN` | Comma-separated origins, or `*` for local only |
| `BMU_DATA_PROVIDER` | `mock` (local/test only) or `official` (required in production; still not a live BMU API) |
| `OFFICIAL_BMU_API_BASE_URL` | Reserved. Unused until an official API exists |
| `OFFICIAL_BMU_API_KEY` | Reserved. Never commit a real key |
| `OBJECT_STORAGE_PROVIDER` | `local` or `s3` |
| `OBJECT_STORAGE_LOCAL_DIR` | Directory for the local provider |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` | Required together before the S3 provider will attempt a call. This build still does not upload |
| `FCM_SERVER_KEY`, `FCM_PROJECT_ID` | Both required or push stays a no-op and sends nothing |
| `CRASH_DSN` | Empty disables crash reporting |

## Demo accounts

Password for every seeded account: `DemoPass123!`

| Email | Role |
| --- | --- |
| `demo.student@bmu.example` | Student (Alex Demo, group CE-2201) |
| `demo.teacher@bmu.example` | Teacher |
| `demo.admin@bmu.example` | Admin |

Other students use `student02@bmu.example` through `student20@bmu.example` with the same password. These people are fictional.

## Current limitations

- No official BMU SSO, SIS, or gradebook connection. `OfficialBMUDataProvider` fails closed. Production will not silently serve mock data.
- The assistant is a controlled intent router, not an open model with database access.
- The digital ID is explicitly a demo and must not be used as a campus credential.
- Campus coordinates are approximate directory points. The app does not read GPS.
- Authentication is local to this demo database.
- Teacher and admin clients are not a separate product; their tokens cannot read another student’s private routes.
- Android release builds are unsigned until an upload keystore is supplied. Play API 36 is not forced, because it depends on the Flutter SDK in use.
- Object storage, push, crash reporting, and database backups are not turned on by default.
- Account deletion is a timestamp plus a manual operator step, not an automatic erase.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).
