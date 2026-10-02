# API

Base URL in development: `http://localhost:3000`. Interactive docs: `/docs`.

Send `Authorization: Bearer <accessToken>` except on login, refresh, and health.

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

| Method | Path |
| --- | --- |
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

Course routes return 403 when the student is not enrolled, including for unknown ids, so the API does not reveal other students’ courses.

`POST /ai/chat` body is `{ "message": "When is my next class?" }`. The response is `{ answer, intent, toolsUsed, data? }`.
