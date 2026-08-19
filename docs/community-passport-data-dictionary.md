# Community Passport data dictionary

| Entity | Data classification | Owner | Direct destination access | Retention note |
|---|---|---|---|---|
| Organization | Internal directory | Puente ATX | Active organization names | Retain while participating |
| Organization user | Access control | Organization/Puente | Own organization only | Disable rather than delete during pilot |
| Person | Confidential PII | Origin organization | Never | Provisional 12 months after Passport closure |
| Passport | Confidential operational | Origin organization | Never directly | Provisional 12 months after closure |
| Need | Confidential operational | Origin organization | Consent-aware referral projection | Follows Passport |
| Consent | Confidential authorization | Origin organization | Limited projection | Follows Passport/legal policy |
| Referral | Confidential shared operational | Origin and destination | Yes, if participant organization | Follows Passport/legal policy |
| Referral update | Confidential shared operational | Origin and destination | Yes | Follows referral |
| Audit event | Restricted security record | Participating organization | Organization-scoped | Retention requires policy approval |

## Explicitly prohibited data

- Social Security number;
- diagnosis or medical history;
- clinical notes or records;
- immigration status or documents;
- insurance information;
- uploaded files;
- payment or billing information;
- passwords, MFA secrets, or recovery codes;
- analytics payloads containing participant identity.

## Controlled values

The authoritative enum and allowlist definitions live in migration 011. Application constants must mirror those values and tests must detect drift.
