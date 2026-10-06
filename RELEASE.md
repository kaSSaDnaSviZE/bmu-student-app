# Release

Version 0.2.0 is a release candidate of an unofficial demo. It is not an official BMU app and it is not store-ready. See [RELEASE_BLOCKERS.md](RELEASE_BLOCKERS.md).

## Environments

| File | Use |
| --- | --- |
| `.env.development` | Local demo secrets and `BMU_DATA_PROVIDER=mock` |
| `.env.example` | Template committed for local setup |
| `.env.staging.example` | Staging template. `NODE_ENV=production` and `BMU_DATA_PROVIDER=official` |
| `.env.production.example` | Production template. Mock is refused |

`assertDataProviderPolicy()` runs at process start and again when the Nest provider is created. If `NODE_ENV` is `production` and the provider is not exactly `official`, the process exits. Development and test may use mock. Docker Compose sets `NODE_ENV=development` only so the local demo stack still runs; do not copy that override into a deploy.

The official adapter returns 503. Shipping that mode does not mean university data is connected.

## Database

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma db seed
```

Seed deletes and recreates fictional demo rows, including a few catalog, dining, career, and directory rows. Do not point it at a database you need to keep. Backups are not configured. See [docs/backup.md](docs/backup.md).

## API

- Health: `/health`, `/health/live`, `/health/ready`
- Versioned alias: `/api/v1/...` uses the same handlers as the unversioned paths
- New authenticated routes: `/library/books`, `/library/loans`, `/dormitory`, `/dormitory/applications`, `/career/opportunities`, `/dining/menus`, `/student-services`, `/notifications/devices`

## Android signing

Release builds are unsigned unless `BMU_UPLOAD_STORE_FILE` (and the matching password, alias, and key password) is provided as a Gradle property or environment variable. Debug signing is used only when `BMU_ALLOW_DEBUG_SIGNING=true`, and that flag is for a local machine. Do not commit a keystore.

`targetSdk` stays `flutter.targetSdkVersion` unless `-Pbmu.targetSdk=<n>` is passed. Play submissions in 2026 must verify API 36, and only after the installed Flutter `compileSdk` supports it. See the comment in `apps/mobile/android/app/build.gradle.kts` and `apps/mobile/android/gradle.properties`.

## Flutter session

`SessionController.hydrate()` restores the access and refresh token JSON from `flutter_secure_storage`, and language plus theme from `shared_preferences`. The constructor does not touch plugins, so widget tests can build `HomeScreen` without a device. `main` calls `hydrate` before `runApp`.

## Checks before a tag

```bash
npm ci
npx prisma generate --schema prisma/schema.prisma
npm run lint
npm run typecheck
npm test
npm run build
```

Flutter, when the SDK is installed:

```bash
cd apps/mobile && flutter pub get && flutter analyze && flutter test
```
