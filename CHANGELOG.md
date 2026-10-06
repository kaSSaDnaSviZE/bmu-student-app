# Changelog

## 0.2.0 — 2026-10-06

Release-candidate scaffolding. This is still not an official Baku Engineering University application, and the official data provider is still not connected.

- Additive Prisma models for academic years, catalog courses and sections, audit, device tokens, notification preferences, object metadata, library loans and reservations, dorm applications, dining, career, support messages, attendance policy, feature flags, sync logs, and a student-service directory. Existing `Course` rows stay the legacy section records.
- Optional `User.staffRole` and `User.deletionRequestedAt`. The `Role` enum is unchanged.
- API request ids, `/api/v1` aliases, a JSON error filter, server-side permissions, live/ready health checks, and a production guard that refuses mock data.
- Local object-storage provider with mime and size checks. S3 and FCM providers do not send without configuration, and this build still does not call those networks.
- Android release signing no longer uses the debug keystore unless `BMU_ALLOW_DEBUG_SIGNING=true`.
- Flutter session restore for tokens (secure storage) and language/theme (shared preferences).
- Environment templates, security and release notes, and CI workflows for security, mobile, and the static web pages.

## 0.1.0

Initial demo: NestJS API, Prisma seed, and Flutter client for fictional student data.
