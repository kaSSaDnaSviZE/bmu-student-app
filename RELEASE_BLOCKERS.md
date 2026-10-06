# Release blockers

These items are outside this repository. The 0.2.0 candidate does not clear them.

## Apple Developer Program

BLOCKER: Apple Developer Program membership, signing, and App Store review
WHY: iOS distribution needs an Apple Developer account, certificates, a provisioning profile, and review. This repo cannot enroll or submit.
IMPLEMENTED: Flutter iOS project and a placeholder privacy page. No certificates, App Store record, or review answers.
NEEDED: The legal entity’s Apple Developer membership, distribution certificate, App ID, privacy questionnaire, and review build.
NEXT ACTION: Enroll only after branding permission is granted, then create the App Store record with the real operator name and support email.

## Google Play

BLOCKER: Google Play Console account and store review
WHY: Android distribution through Play needs a developer account, an app record, a content rating, and a review. Target API requirements for 2026 must be checked against the installed Flutter SDK.
IMPLEMENTED: Release signing no longer defaults to the debug keystore. `bmu.targetSdk` can raise `targetSdk` when `compileSdk` supports it. A data-deletion page exists as HTML with placeholders.
NEEDED: Play Console access, an upload keystore held outside git, a privacy policy URL with real contact details, and a build whose `targetSdk` Play will accept.
NEXT ACTION: Create the Play app only after branding permission, store the upload key outside the repo, and confirm API 36 against the Flutter version used for that build.

## Signing keys

BLOCKER: Android upload key and Apple distribution certificate
WHY: Store builds must be signed by keys the operator controls. A debug keystore is not a release identity.
IMPLEMENTED: Gradle reads `BMU_UPLOAD_STORE_FILE` and related secrets from properties or the environment. `BMU_ALLOW_DEBUG_SIGNING` is local-only. CI rejects committed `*.jks`, `*.keystore`, and `*.p12` files.
NEEDED: Keys generated on a trusted machine and stored in a secret manager. Passwords must not be committed.
NEXT ACTION: Generate the upload keystore outside the repository and inject the four `BMU_UPLOAD_*` values in the release job.

## Hosting

BLOCKER: Production hosting for the API, Postgres, and object storage
WHY: The app cannot serve real users from a laptop or from the demo Compose file.
IMPLEMENTED: Health live/ready routes, a production env template, and a policy that refuses mock data when `NODE_ENV=production`. Compose forces `NODE_ENV=development` only for the local demo.
NEEDED: A host, a managed Postgres instance, TLS, backups, and object storage with a real client. The S3 provider in this repo does not upload yet.
NEXT ACTION: Choose a host, set `BMU_DATA_PROVIDER=official`, and do not copy the Compose development override.

## Official BMU API and SSO

BLOCKER: Official academic API and single sign-on
WHY: Schedule, grades, and identity are not available from this project. Seed data is fictional.
IMPLEMENTED: `OfficialBMUDataProvider` is selected only when `BMU_DATA_PROVIDER=official` and fails closed with 503. Production refuses `mock`. No silent fallback.
NEEDED: A written BMU interface: base URL, auth, scopes, and permission to call it. SSO that this app does not invent.
NEXT ACTION: Stop claiming integration until BMU provides an API contract and a non-production tenant. Keep the official provider failing closed until then.

## Legal review

BLOCKER: Privacy, terms, and account-deletion review
WHY: Store listings and a real user base need a counsel-reviewed policy. The HTML pages are placeholders with `{{SUPPORT_EMAIL}}` and `{{OPERATOR_NAME}}`.
IMPLEMENTED: Static pages for privacy, terms, delete-account, and support. `deletionRequestedAt` can be stored. Deletion is not automatic, and backups are not configured.
NEEDED: A lawyer or DPO to approve the text, the retention story, and who the operator is. A real support email. No invented phone numbers.
NEXT ACTION: Replace the placeholders only after that review, and document who executes deletion including backups.

## Branding permission

BLOCKER: Permission to use the BMU name, marks, and campus identity
WHY: The product name and package id refer to Baku Engineering University. Using them in a store listing without permission is a release blocker even if the code is unofficial.
IMPLEMENTED: README, API description, and in-app copy say this is not an official BMU application. Demo accounts use `@bmu.example`.
NEEDED: Written permission from the university, or a rename before any public listing.
NEXT ACTION: Ask the university before submitting to Apple or Play. If permission is refused, rename the app and application id.
