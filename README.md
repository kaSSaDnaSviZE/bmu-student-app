# BMU Student App

A demo student application for **Baku Engineering University (BMU)**. A student can sign in and see schedule, courses, grades, attendance, assignments, the academic calendar, campus directory, events, clubs, a demo digital ID, and a scoped student assistant.

This project is **not** connected to BMU’s private systems. It does not contain real student records. Academic data is seeded fiction served through `MockBMUDataProvider`, which can later be replaced by an official provider without rewriting the app.

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
                                              ├─ MockBMUDataProvider  (Prisma, demo seed)
                                              └─ OfficialBMUDataProvider  (not configured)
```

The assistant never receives a database client. It calls `StudentTools`, which only forwards the authenticated student id into:

- `getStudentSchedule`
- `getStudentCourses`
- `getStudentGrades`
- `getStudentAttendance`
- `getStudentDeadlines`
- `getAcademicCalendar`
- `getCampusLocation`

See [docs/architecture.md](docs/architecture.md), [docs/database.md](docs/database.md), and [docs/api.md](docs/api.md).

## Installation

Requirements: Node.js 22, npm, PostgreSQL 16 (or Docker), Flutter stable.

```bash
git clone https://github.com/kaSSaDnaSviZE/bmu-student-app.git
cd bmu-student-app
cp .env.example .env
```

Edit `.env` and set `JWT_ACCESS_SECRET` to at least 32 random characters. Do not commit `.env`.

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
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | HMAC secret, minimum 32 characters |
| `JWT_ACCESS_TTL` | Access token lifetime in seconds (default 900) |
| `JWT_REFRESH_TTL_DAYS` | Refresh token lifetime (default 14) |
| `PORT` | API port (default 3000) |
| `CORS_ORIGIN` | Comma-separated origins, or `*` for local only |
| `BMU_DATA_PROVIDER` | `mock` (default) or `official` |
| `OFFICIAL_BMU_API_BASE_URL` | Reserved. Unused until an official API exists |
| `OFFICIAL_BMU_API_KEY` | Reserved. Never commit a real key |

## Demo accounts

Password for every seeded account: `DemoPass123!`

| Email | Role |
| --- | --- |
| `demo.student@bmu.example` | Student (Alex Demo, group CE-2201) |
| `demo.teacher@bmu.example` | Teacher |
| `demo.admin@bmu.example` | Admin |

Other students use `student02@bmu.example` through `student20@bmu.example` with the same password. These people are fictional.

## Current limitations

- No official BMU SSO, SIS, or gradebook connection. `OfficialBMUDataProvider` fails closed.
- The assistant is a controlled intent router, not an open model with database access.
- The digital ID is explicitly a demo and must not be used as a campus credential.
- Campus coordinates are approximate directory points. The app does not read GPS.
- Authentication is local to this demo database.
- Teacher and admin clients are not a separate product; their tokens cannot read another student’s private routes.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).
