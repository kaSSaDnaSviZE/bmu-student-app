# Contributing

Thanks for helping improve the BMU Student App demo.

## Ground rules

- Do not add real student, staff, or parent personal data.
- Do not commit `.env`, API keys, passwords, tokens, or private certificates.
- Keep student-private queries behind the authenticated student id. Never trust a student id sent by the client.
- New university data access goes through `BMUDataProvider`. The assistant may only call `StudentTools`.
- Do not pretend a feature talks to official BMU systems.

## Setup

Follow the installation steps in [README.md](README.md). Run `npm test`, `npm run lint`, and `npm run typecheck` before opening a pull request. If you touch Flutter, also run `flutter analyze` and `flutter test` in `apps/mobile`.

## Pull requests

- Keep the change focused.
- Update `docs/` when an endpoint, table, or architecture boundary changes.
- Add or update a test for auth, authorization, and any new student-scoped behavior.

## Code layout

- `apps/api` — NestJS REST API
- `apps/mobile` — Flutter client
- `prisma` — schema, migrations, and seed
- `docs` — architecture, database, API, roadmap
