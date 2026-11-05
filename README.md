# Assignment Platform

## Setup
1. `npm install`
2. `cp .env.example .env` and fill in `DATABASE_URL`, `JWT_SECRET`, `FACULTY_INVITE_CODE`
3. Start PostgreSQL, then `npm run db:push`
4. `npm run dev`

Demo data (added in a later step) is created with `npm run db:seed` and removed with `npm run db:unseed`.

## Step 2: auth
- `npm run db:seed` adds a demo course and sections so students can register (`npm run db:unseed` removes them).
- With the dev server running, `npm run test:security` checks role separation, forged tokens and logout invalidation.
- Password reset links print to the server console in development. Add a mail provider in `src/lib/mail.ts` before production.

## Step 3: faculty shell and assignments
- Faculty claim the classes they teach under **My classes**; they can only create assignments for those.
- Uploaded files live in `storage/` and are only served through `/api/files/attachments/[id]` after an ownership check.
- Classes come from the Course and Section tables. There is no admin screen yet, so `npm run db:seed` provides demo classes.

## Step 4: student dashboard
- Students see an assignment only if it is published, belongs to their section, and is class-wide or aimed at them (`visibleWhere` in `src/lib/student-assignments.ts`).
- Marks and feedback reach a page only after the faculty publishes them; the loader drops unpublished evaluations.

## Step 5: submissions
- Uploads are checked on the server: extension, MIME type, real file contents, size, file count, deadline, late and resubmission rules (`src/lib/submissions.ts`, `src/lib/uploads.ts`).
- Each submission is a numbered version; earlier versions and their files are kept for history.
- A submission returned for correction can be resubmitted even after the deadline and keeps its original on-time/late flag.
- Submitted files are served only to the student who uploaded them and the faculty who owns the assignment.

## Step 6: evaluation
- **Schema changed:** run `npm run db:push` (Evaluation now has nullable `marks`, plus `rawMarks` and `penaltyPct`).
- Marks stay hidden until faculty press Publish. Saving an evaluation is private; the student sees "awaiting evaluation".
- The late penalty is applied on the server from the assignment's setting; faculty enter marks before the penalty.
- Return for correction stores the feedback as a published note with no marks, and lets the student upload a new version.

## Step 7: notifications, calendar, history, analytics, profile
- No schema changes since Step 6.
- Deadline reminders have no scheduler: they are generated when any user's notification bell refreshes (at most every 5 minutes). Add a cron job calling the same function if you need guaranteed timing.
- Profile: registration number, faculty ID, course, semester and section are read-only. Changing a password signs out every other device.
