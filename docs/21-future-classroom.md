# 21 — Optional Classroom Intelligence & Timetable Module

**Stage:** RESEARCH REQUIRED. **Not implemented in the public demo.**

## Potential scenarios

1. Curriculum/lesson-guide coverage assistant: compare a **teacher-entered lesson summary** with approved curriculum objectives, flag gaps for manual review.
2. Classroom notes: teachers record structured anonymous observations of learning moments and links to learning objectives.
3. Optional transcription pilot: with an approved legal/policy basis, record a bounded session and transcribe speech. **Speaker diarization does not establish which child spoke**. Require educator confirmation before attributing to student record.
4. Substitute teacher coordination: staff absence triggers an administrator-reviewed timetable proposal and notifications to only relevant staff.
5. Approved communication: draft class summary for principal and individualized guardian updates; **never automatically send** without school-approved authorization/policy.

## Explicit guardrails

- No hidden classroom recording, no blanket use of safety CCTV as teaching analytics source.
- No faceprint/voiceprint enrolment of children as a default.
- No automated clinical diagnoses, personality judgements or staff employment decisions based on AI monitoring.
- A child-specific email must never include other children's names, photographs, or speech.
- Clear retention and deletion windows; consent/notice and worker-related policies checked.
- Staff/guardian recipients verified and approval logged.

## Prototype sequence

Start with **lesson guides + written educator notes** → reviewable topic coverage → suggested lesson modifications. Only later research limited audio transcription under a DPIA, and avoid named student voice identification unless necessity, accuracy and legality are independently demonstrated.

## Example staff-MC handling

`teacher absence → detect scheduling conflict → find eligible substitute → propose reassignment → administrator approves → notify assigned teachers → track acknowledgment`. AI may suggest options but must not silently override staff rostering or message guardians with unverified facts.
