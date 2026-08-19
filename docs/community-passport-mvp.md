# Community Passport MVP

## Purpose

Community Passport is a small closed-loop referral module for a pilot that includes Puente ATX, ALAS Texas, A2 Toques Foundation, and E3 Alliance. It connects a participant, one or more needs, consent-limited referrals, and shared referral outcomes.

It is not an EHR, CRM, clinical record, or enterprise case-management system. It must not contain diagnoses, medical history, SSNs, immigration documents or status, insurance information, uploaded files, or clinical notes.

## Approved pilot defaults

- Development and acceptance testing use fictional participants only.
- Consent is recorded as verbal consent confirmed by the staff user.
- Closed Passport retention is provisionally 12 months and requires legal/operational approval before real participant data is introduced.
- MFA using a TOTP authenticator application is required for every user who accesses Community Passport data.
- An existing Puente ATX system administrator does not receive universal participant access merely because they are a directory administrator.
- Every employee uses an individual Supabase Auth account. Shared organization accounts are prohibited.

## Existing architecture reused

- React 18 and the existing Vite SPA.
- History API routing in `App.jsx` and `AdminApp.jsx`.
- Supabase Auth email/password sessions.
- `admin_profiles` for global directory administration.
- Existing admin shell, forms, tables, dialogs, toast, tokens, Material Symbols Outlined icons, and ES/EN copy patterns.
- Direct Supabase REST/RPC access through the centralized request utility.
- Vercel Web Analytics and Speed Insights remain active.

No second dashboard, auth provider, router, translation system, icon library, or design system is introduced.

## Domain model

```text
Organization
  └── Organization users

Person
  └── Passport
       ├── Needs
       ├── Consents
       └── Referrals
            └── Shared referral updates

Audit events record important access and workflow changes.
```

The canonical database schema is introduced by:

1. `011_community_passport_schema.sql`
2. `012_community_passport_access.sql`
3. `013_community_passport_workflows.sql`

The migrations are additive and do not modify existing resource rows.

## Roles

Global `admin_profiles` roles remain responsible for directory administration. Community Passport authorization is organization-scoped through `organization_users`.

| Role | Initial capability |
|---|---|
| `admin` | Manage organization membership and all organization-scoped workflows |
| `navigator` | Create participants, Passports, needs, consent, and referrals; update received referrals |
| `case_worker` | Read organization-scoped records and update received referrals |
| `viewer` | Read organization-scoped records only |

All memberships and their organizations must be active.

## Access model

The originating organization can read its people, Passports, needs, consent records, outbound referrals, and shared outcomes.

The receiving organization can read referral rows addressed to it and update their status. It cannot select the underlying `people`, `passports`, `needs`, or `consents` rows belonging to the origin organization.

Participant fields for a receiving organization are returned only by `get_passport_referral_detail(referral_id)`. The function verifies:

- authenticated user;
- MFA assurance level `aal2`;
- active organization membership;
- participation in the referral;
- matching consent organization;
- active and unexpired consent;
- the explicit allowed-field list.

RLS is not used as column masking. A receiving organization never receives direct access to a full participant row.

## Consent

The MVP allowlist is:

- preferred name;
- first name;
- last name;
- phone;
- email;
- preferred language;
- ZIP code;
- need summary.

Unknown field names are rejected by a database constraint. A referral requires an active consent matching the participant, Passport, and destination organization.

Revocation prevents future consent-aware reads. It cannot cause an organization to forget information already viewed, so training and participant-facing language must explain that limitation.

## Closed-loop workflow

Initial referral statuses:

```text
new → accepted
accepted → contact_attempted | contacted | enrolled | not_eligible | unable_to_contact | closed
contact_attempted → contacted | not_eligible | unable_to_contact | closed
contacted → enrolled | service_received | not_eligible | unable_to_contact | closed
enrolled → service_received | not_eligible | unable_to_contact | closed
```

Terminal outcomes cannot be reopened through the initial MVP functions. A later correction workflow must be explicit and audited rather than silently rewriting history.

Every accepted/status update transaction writes:

1. the referral status;
2. the shared timeline update;
3. audit events visible to both participating organizations.

`service_received` records that the receiving organization reported the service as received. It is not clinical verification or independent proof of impact.

## Shared notes

The MVP has shared operational notes only. It has no private case notes.

The interface must warn:

> This note is visible to both organizations. Do not include diagnoses, medical information, immigration information, documents, or other sensitive information.

Notes are limited to 1,000 characters.

## MFA

Community Passport table policies and workflow functions require the Supabase JWT claim `aal = aal2`. Password-only sessions can still reach the enrollment/challenge experience but cannot read participant, Passport, referral, consent, update, or audit rows.

MFA uses TOTP applications rather than SMS. Recovery must be performed by an authorized administrator and audited operationally. Recovery codes, final enrollment UX, and factor-management UX are implemented in the authentication phase.

## Routes planned

- `/admin/organizaciones`
- `/admin/pasaportes`
- `/admin/pasaportes/nuevo`
- `/admin/pasaportes/:id`
- `/admin/pasaportes/:id/referir`
- `/admin/referidos`
- `/admin/referidos/:id`

Reports, settings, external notifications, and Resource Navigator integration are outside the first MVP.

## Analytics and audit

Operational events are sourced from `audit_events`, not from anonymous browser analytics. This avoids duplicating referral identifiers or participant context into the public product-event pipeline.

Audit metadata contains status names and organization IDs only. It must not contain names, email addresses, phone numbers, ZIP codes, notes, or consent text.

Vercel Analytics and Speed Insights continue to measure general traffic and performance. No participant PII is sent to either service.

## Retention

The provisional operational rule is to retain closed Passports for 12 months. Automated deletion is deliberately not included until the organization approves:

- legal basis and participant notice;
- whether audit events must outlive operational records;
- handling of active or disputed referrals;
- backup retention;
- deletion verification.

## Deployment sequence

1. Back up and verify the target Supabase project.
2. Apply migrations 011–015 in order to a non-production project first.
3. Execute the RLS test matrix with three fictional organizations.
4. Create organizations through a trusted admin process.
5. Create individual Auth users manually; public signup remains disabled.
6. Add organization memberships.
7. Enroll each pilot user in TOTP MFA.
8. Complete the full fictional Puente → ALAS → Puente flow.
9. Complete privacy and consent review.
10. Only then permit real participant data.

The initial migration order is schema (`011`), access policies (`012`), transactional workflows (`013`), protected read models (`014`), and the initial pilot organization records (`015`). Migration `018` adds E3 Alliance. Neither organization migration creates users or memberships.

After the migrations, create each staff account manually in Supabase Authentication. Sign in with an existing Puente ATX administrator, complete TOTP enrollment, and use **Organizations** to assign each Auth UID to the appropriate organization and smallest necessary role. Public signup remains disabled.

No new browser environment variable is required beyond the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never add a service-role key to a `VITE_` variable.

Supabase TOTP does not provide application-managed recovery codes in this implementation. Recovery must be handled by an authorized Supabase project administrator; the client must never bypass MFA.

## Out of scope

- PHI and clinical data;
- file uploads;
- email and SMS automation;
- external APIs and hospital integrations;
- configurable workflows;
- private case notes;
- exports of participant records;
- automatic matching or AI;
- public accounts;
- universal administrative access;
- advanced reporting.
