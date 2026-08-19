# Community Passport access model

## Security objective

Access is determined by the signed-in user, active organization membership, organization role, referral relationship, active consent, selected fields, and MFA assurance level. UI visibility is never treated as authorization.

## Matrix

| Record | Origin organization | Destination organization | Unrelated organization | Global directory admin without membership |
|---|---|---|---|---|
| Organization directory | Active organizations | Active organizations | Active organizations | All organizations |
| Organization memberships | Own/self; organization admin manages | Own/self; organization admin manages | None | Manage |
| Person row | Read | No direct access | None | None |
| Passport | Read | No direct access | None | None |
| Need | Read | Consent-aware referral projection only | None | None |
| Consent row | Read/revoke | Consent status and allowed fields through projection | None | None |
| Referral | Sent referrals | Received referrals | None | None |
| Shared update | Read | Read/create through workflow | None | None |
| Audit event | Organization events | Organization events | None | No universal access |

## Write capabilities

| Action | admin | navigator | case_worker | viewer |
|---|---:|---:|---:|---:|
| Manage organization users | Yes | No | No | No |
| Create person/Passport | Yes | Yes | No | No |
| Add need | Yes | Yes | No | No |
| Grant/revoke consent | Yes | Yes | No | No |
| Create outbound referral | Yes | Yes | No | No |
| Accept/update inbound referral | Yes | Yes | Yes | No |
| Read scoped records | Yes | Yes | Yes | Yes |

Every sensitive read and workflow requires an `aal2` MFA session.

## Consent-aware projection

PostgreSQL RLS controls rows, not arbitrary per-row column visibility. Therefore destination users never receive `SELECT` on the origin's participant row. `get_passport_referral_detail` constructs a new JSON object field by field after verifying consent.

When consent is revoked or expired:

- participant contact fields are no longer returned;
- the destination retains minimal referral status/history required for audit;
- no low-level API query can bypass the projection using the authenticated role.

## Audit rules

Audit records are append-only and created inside security-definer workflow functions. The application cannot update or delete them. Metadata is capped at 2 KB and should contain controlled status or organization identifiers only.

Required audit actions include creation, viewing, status changes, completion, consent grant, and consent revocation.

## Threats explicitly addressed

- organization C querying organization A data;
- destination querying unshared participant fields;
- password-only session reading PII;
- client changing referral organization IDs;
- invalid or skipped referral status transitions;
- status change without timeline/audit record;
- revoked/expired consent continuing to expose contact data;
- anonymous or public writes;
- service-role key exposure in the browser.

