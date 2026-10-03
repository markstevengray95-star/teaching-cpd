# Teaching CPD Hub

A responsive professional-development platform for school staff.

## School timetable and planner sync

Open **School → Timetable** (`/timetable`) to build a whole-school timetable with the Time Maker tools: constraints and issues, staff workload, curriculum modelling, option blocks, cover, daily changes, department dashboard and CSV/Excel exchange. School owners, administrators and SLT manage the builder; other staff use **My timetable & lesson planner**.

1. Set up the school, staff, classes, curriculum and rooms in the builder, or import validated school records. Drafts save to the school's private Supabase workspace.
2. Under **Link timetable teachers to CPD staff accounts**, match each builder teacher to an existing member of the selected school. A CPD account can link to one teacher record.
3. Generate and select a complete timetable, resolve hard issues, then choose **Publish & sync timetable**. Staff receive only their own published allocations. Draft edits do not affect planners until publication.
4. Manage date-specific room changes, cancellations and cover in the builder, then choose **Sync daily changes**. This updates the planner's Today view without replacing the approved master timetable.

Planners refresh on opening, focus and every 45 seconds while visible. The adapter supports A/B weeks, double lessons, enabled teaching days and per-day period times. A one-week school pattern repeats across both weeks in the existing two-week planning workspace. Matching lesson plans, notes and resource attachments retain their IDs; removed lessons and conflicting personal entries are archived and included in full backups. **Tools → Import previous device planner** explicitly imports the historical device-only planner into the signed-in account; the original remains untouched. Personal planning still saves on the current device, scoped by account and school; school drafts and published allocations save centrally.

`supabase/school-timetable-setup.sql` supplies the additive schema and guarded authenticated RPCs for the existing CPD Supabase project. It does not change existing school records or lesson-planning tables. Private storage has RLS and no direct browser table access; publication uses revision checks to avoid overwriting another timetabler's changes. Public RPC wrappers execute as caller and delegate to private functions that check current school membership and management roles.

`npm run build` builds the isolated builder into `public/time-maker` before Next.js. Generated assets are ignored; source provenance is in `vendor/time-maker/README.md`. `npm run audit:timetable` verifies planner preservation, the real SQL against fictional accounts in PostgreSQL, and the imported Time Maker logic. Staff use CPD accounts; the standalone app's separate staff/student login screens are not exposed in this integration.

## Current build

Phase 1 is implemented as an immediately usable demo:

- Staff profile and role-aware identity
- Dashboard with CPD hours, course progress and recommendations
- Searchable CPD course library
- Saved progress on the current device
- Interactive content, quizzes, classroom scenarios and reflections
- My CPD learning record
- Completion certificates with print / Save as PDF
- Responsive desktop, tablet and mobile design
- Seeded CPD content covering teaching & learning, safeguarding, SEND, leadership, wellbeing and responsible AI

The reusable interactive module engine also establishes the core of Phase 2.

## Production roadmap

The next production step is to connect authentication and persistence to Supabase, then add QR attendance and live CPD sessions. The interface currently labels local-only sign-in clearly as Demo Mode so it cannot be mistaken for a production authentication system.

## Deployment

This project is structured for Vercel deployment.
