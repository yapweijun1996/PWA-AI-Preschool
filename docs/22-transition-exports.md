# 22 — Controlled Preschool-to-Primary-School Transition

**Future feature only.** A student learning history may help a receiving institution plan support, but cross-school records are **not** automatically shared by default.

## Approved transfer prerequisites

- Confirm legitimate transfer purpose, governing institution policy, child/guardian notices and legal authority.
- Verify receiving organization's identity and named recipients; record approval from sending data controller.
- Restrict contents to what the recipient needs. Consider a **parent-controlled, educator-approved PDF** before API federation.
- Allow sender to revoke access where lawful, enforce expiry and maintain disclosure/audit history.
- Don't transfer child biometric voiceprints/faces or unrelated incident/sensitive notes as part of normal portfolio export.

## Suggested transition payload

`student_pseudonymous_id`, academic period, curriculum summary, approved learning domains, confirmed educator narrative, evidence citation index (non-public), review approvals, sender/recipient metadata, expiry, and consent/legal basis flags. Personal identity attributes should be separately controlled and minimized.

## Security considerations

Protect with encrypted delivery, recipient verification, least privilege, signed manifest/hash, delivery acknowledgment and revocation/retention controls. A GitHub-hosted public app must **never** serve this kind of transfer.
