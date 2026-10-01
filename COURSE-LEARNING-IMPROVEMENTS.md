# Teaching CPD learning improvements

Release date: 1 October 2026. Repository: Teaching CPD only.

## Separate pushed updates

1. Course-specific activity challenges, explanatory answer feedback and downloadable/savable practical takeaways.
2. Personalised starting-point recommendations, four role lenses across three phases, and optional paced reading.
3. Seven- and fourteen-day follow-up recall/reflection, calendar export, official reference directory, transparent review status and keyboard/mobile verification.

The existing migration PR receives each update as a separate commit. No Staff Development wrapper, schema migration, external email service or notification automation is added.

## How the improvements work

- Each optional activity challenge uses an actual question and model explanation from its own course. It asks the learner to improve a weak response and transfer the idea to a real course case. The original activity instructions remain visible.
- Answer feedback compares the selection with the course response and explains the distinction. Written challenge answers are not automatically treated as correct or awarded a competence score.
- Practical takeaway templates include the course objectives and its implementation checklist, with fields for a problem, action, support, evidence and review date. Templates can be downloaded without saving personal information.
- A starting check of up to three course questions recommends reading, checks or application. It never exempts a required assessment or changes course completion. Saved recommendations restore only when the question set still matches.
- Teacher, teaching assistant, pastoral and leader examples adapt the actual course case for primary, secondary and post-16 settings. Safety lenses keep actions within role and current procedures.
- Reading is available in sections of two intact paragraphs, with an optional pause note and full-passage view. Existing Quick/Core/Deep reading choices remain; no source passage is removed.
- Follow-up starts from the completion date or an explicitly saved plan. Seven- and fourteen-day checks use recall before feedback, then ask what was tried and what evidence suggests keeping, adapting or stopping. These are optional suggested intervals, not measured completion times.
- The calendar download creates two events. A user must import it; calendar software controls notifications. Teaching CPD does not send email or run a background reminder job.
- Source panels distinguish learning-tool update date, directory check date and specialist content approval. No specialist approval is fabricated. Policy-critical content still requires review by the appropriate designated specialist.
- New controls have text labels and visible keyboard focus, responsive layouts and reduced-motion support. All core course timing estimates and required completion criteria are unchanged.
- Existing scene decision activities now allow reading the full transcript and opening the decision without timed playback. Existing browser-audio conversations already provide a transcript alternative.
- Fixed numbered-option parsing in legacy Phase 4 categorising/ranking tasks. Answer tags are data attributes, not visible hints, and the duplicate native option list stays hidden once the practice widget is active.

## Data and verification

New saved metadata uses versioned keys in the existing course reflection map. It goes through the app's existing serialized progress-write adapter; no alternative Supabase table is used. A failed write retains drafts and does not display a success message.

Automated audits cover all 103 catalogue courses, the 1,627 course-specific activity challenges, role/phase variants, focus targets, malformed saved records, date boundaries and standards-formatted calendar exports. Existing route, question, flashcard and timing audits remain in CI.

Representative browser checks use a local preview with the existing presentation controllers and a mocked progress adapter. They verify unanswered diagnostic gating, recommendation navigation, challenge comparison, takeaway save/failure, follow-up save/failure, reading pagination/full text, draft retention between tools, keyboard navigation, mobile width and no console errors. Production signed-in persistence and an asset-level audit of any existing media captions are not claimed as tested.

## Reference directory

Official DfE, HSE, ICO and NCSC pages and EEF guidance/evidence reviews were opened when adding the source directory. References are contextual background and current official entry points, not certification that every inherited generated passage is fully verified. The relevant source titles, URLs and purposes are shown per course by `lib/courseSources.ts`.
