# Database

PostgreSQL via Prisma. The schema lives in [prisma/schema.prisma](../prisma/schema.prisma).

## Models

`User`, `Student`, `Teacher`, `Faculty`, `Department`, `Program`, `Group`, `Course`, `Enrollment`, `ClassSchedule`, `Classroom`, `Building`, `Grade`, `Assessment`, `Attendance`, `Assignment` (with `AssignmentSubmission`), `CourseMaterial`, `Announcement`, `Notification`, `AcademicEvent`, `Club`, `ClubMembership`, `UniversityEvent` (with `EventRegistration`), `LibraryBook`, `Dormitory`, `DormitoryRoom`, `SupportRequest`, `StudentID`, `RefreshToken`.

Each model has timestamps. Foreign keys, unique pairs (enrollment, grade, attendance date, submission, club membership, event registration), and lookup indexes are declared on the schema.

## Schedule exceptions

A weekly slot stays `SCHEDULED`. `exceptionDate`, `exceptionStatus`, and optional room, time, or teacher overrides apply only on that calendar date. The seed marks one English session cancelled and one Physics session moved.

## Grades

Assessment weights are percent points of the course grade. The current grade renormalizes completed work. The final-exam calculator uses absolute weights: required final percent = `(target - earnedPoints) / finalWeight * 100`.

## Attendance

Present and late count as attended. Excused sessions are left out of the denominator. The demo student’s seeded rates are Programming 92, Mathematics 84, Physics 76, English 68.

## Commands

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma db seed
npx prisma migrate dev --schema prisma/schema.prisma   # local schema changes
```

The seed deletes demo rows and recreates them. It is safe to run again on a development database. Do not point it at a database you care about.
