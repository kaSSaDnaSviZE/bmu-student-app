# Roadmap

## Now

Local demo: auth, student academic views, campus directory, events, clubs, demo ID, and a tool-scoped assistant.

## Next

1. Official BMU provider behind `BMUDataProvider`, with contract tests against a sandbox BMU API if one is offered. Keep the mock provider for development.
2. University SSO instead of local passwords, once BMU publishes an integration.
3. Push notifications for deadlines and schedule changes.
4. Assignment file upload to object storage, not the database.
5. A real map SDK using the stored building coordinates. Still no fake GPS.
6. Optional model-backed assistant that is only allowed to select from `StudentTools`. No raw SQL tool.
7. Teacher grade entry and attendance taking, still unable to read unrelated students.
8. Offline cache on the phone for the last downloaded schedule.
9. Accessibility pass and fuller Azerbaijani and Russian copy.
10. Replace the demo digital ID only after an official card specification exists.

## Explicitly out of scope until BMU agrees

Live grade sync, official QR credentials, production dorm assignments, and any import of real personal data.
