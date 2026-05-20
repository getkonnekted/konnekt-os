# Security Specification for Konnekt.ng

## Data Invariants
1. Profiles: A user can only create/edit their own profile (`ownerId` must match `auth.uid`).
2. Links: Only the profile owner can manage links.
3. Analytics: Anyone can create a view/action event, but once created, it's immutable.
4. Leads: Anyone can submit a lead to a profile, but only the profile owner can read/manage their own "Lead Vault".

## The "Dirty Dozen" Payloads (Attacker Strategy)

1. **Identity Spoofing**: Attacker tries to create a profile with `ownerId` set to another user's UID.
2. **Handle Hijacking**: Attacker tries to update a profile `handle` that they don't own.
3. **Analytics Spam**: Attacker tries to delete analytics records to skew ROI data.
4. **Lead Peeking**: Attacker tries to read the `/leads` subcollection of another user's profile.
5. **PII Injection**: Attacker tries to inject malicious script into the `bio` or `intent` fields.
6. **Immutable Field Bypass**: Attacker tries to update `createdAt` on a profile.
7. **Privilege Escalation**: Attacker tries to add a `role: "admin"` field to their profile document.
8. **Orphaned Write**: Attacker tries to create a `Lead` on a non-existent profile.
9. **Junk ID Poisoning**: Attacker uses a 1MB string as a `profileId` to bloat index costs.
10. **State Skipping**: Attacker tries to set a lead status to "Closed" without proper transitions (if implemented).
11. **Shadow Field**: Attacker adds `verified: true` to their user profile payload during creation.
12. **Mass Scrape**: Attacker tries to query the entire `/profiles` collection without filtering by specific interest/ID.

## Test Runner (Logic Verification)
(This would be implemented in `firestore.rules.test.ts` as per skill guidelines).
