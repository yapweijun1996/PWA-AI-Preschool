# 23 — Optional Online Course Sales Module

**Separate future product**, not part of the portfolio MVP. A school or training operator may wish to publish courses online; that does not imply access to student learning records.

## Candidate scope

Public catalog → programme detail page → availability → sign-up/cart → payment through contracted provider → enrolment confirmation → fulfilment/support. Use separate marketing/courses database and identities where possible.

## Non-goals for v1

No payment collection, storefront checkout, real pupil account coupling or marketing data sharing in the student portfolio demo.

## Isolation rules

- Visitor/customer identities and purchase history must not grant access to child records.
- Consent for marketing is distinct from educational record processing.
- Payment card details should not transit the app server when hosted checkout can be used.
- Exports to commerce tools must omit student progress, photos, audio and sensitive notes.
- Apply separate tenancy, access and audit rules if integrated in a private platform.

## Build order

Treat the portfolio's evidence correctness and data security as higher priority. Build independent catalog/checkout MVP only after product owners define commercial rules and payment provider contracts.
