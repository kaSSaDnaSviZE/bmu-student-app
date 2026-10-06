# API

Base URL in development: `http://localhost:3000`. The same routes are available under `/api/v1` (for example `/api/v1/auth/login`). Interactive docs: `/docs`.

Send `Authorization: Bearer <accessToken>` except on login, refresh, and health. Errors use `{ code, message, requestId }`. The response includes `x-request-id`.

## Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refreshToken }` rotates the token |
| POST | `/auth/logout` | Bearer token. Body may include `refreshToken` |

## Student

| Method | Path | Role |
| --- | --- | --- |
| GET | `/me` | Authenticated. Students also receive their profile |
| GET | `/me/dashboard` | Student |
| GET | `/me/schedule?scope=today\|tomorrow\|week\|next` | Student |
| GET | `/me/courses` | Student |
| GET | `/me/grades` | Student |
| POST | `/me/grades/calculate` | Student. `{ courseId, target }` |
| GET | `/me/attendance` | Student |
| GET | `/me/assignments` | Student |
| POST | `/me/assignments/:id/submit` | Student |
| GET | `/me/notifications` | Authenticated, own rows only |
| PATCH | `/me/notifications/:id/read` | Own notification only |
| GET | `/me/student-id` | Student. `demoOnly: true` |

## Courses, campus, life

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/courses/:id` |
| GET | `/courses/:id/materials` |
| GET | `/courses/:id/assignments` |
| GET | `/campus/buildings` |
| GET | `/campus/classrooms/:id` |
| GET | `/campus/library` |
| GET | `/campus/dormitories` |
| GET | `/calendar` |
| GET | `/announcements` |
| GET | `/events` |
| GET | `/events/:id` |
| POST | `/events/:id/register` |
| DELETE | `/events/:id/register` |
| GET | `/clubs` |
| GET | `/clubs/:id` |
| POST | `/clubs/:id/join` |
| POST | `/clubs/:id/leave` |
| POST | `/support-requests` |
| GET | `/support-requests` |
| POST | `/ai/chat` |
| GET | `/health` |
| GET | `/health/live` | Process only. No database |
| GET | `/health/ready` | `SELECT 1` |
| GET | `/library/books?q=` | Authenticated directory search |
| GET | `/library/loans` | Authenticated student, own loans only |
| GET | `/dormitory` | Buildings and room counts. No roommate names |
| GET | `/dormitory/applications` | Own applications |
| POST | `/dormitory/applications` | Own application (`DRAFT` or `SUBMITTED`) |
| GET | `/career/opportunities` | Authenticated list, demo rows included |
| GET | `/career/events` | |
| GET | `/career/resources` | |
| GET | `/dining/menus` | Prices labeled demo |
| GET | `/student-services` | Hours and location only |
| POST | `/notifications/devices` | Register the caller’s device token |
| DELETE | `/notifications/devices` | Revoke the caller’s device token |

Course routes return 403 when the student is not enrolled, including for unknown ids, so the API does not reveal other students’ courses.

`POST /ai/chat` body is `{ "message": "When is my next class?" }`. The response is `{ answer, intent, toolsUsed, data? }`.
