# Backups

Backups are **not configured**.

Nothing in this repository schedules a Postgres dump, a point-in-time archive, or a copy of object storage. `docker-compose.yml` keeps a local volume for development only. That volume is not a backup.

`User.deletionRequestedAt` does not delete rows or backups, because there are no backups to delete.

Before any shared or production database is used, the operator has to:

1. Choose a backup tool and a retention period.
2. Store dumps somewhere that is not the database server’s only disk.
3. Restore a dump onto an empty database at least once and record that the restore worked.
4. Decide how a confirmed account-deletion request is applied to those dumps.
5. Keep backup credentials out of git.

Until those steps are done, do not treat this project as having a recovery plan.
