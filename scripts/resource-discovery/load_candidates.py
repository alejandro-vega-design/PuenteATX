#!/usr/bin/env python3
"""Load a discovery-source CSV (irs_bmf.py or any future source script that
emits the same CSV_IMPORT_HEADERS-shaped output) into the discovery_candidates
review queue in Supabase.

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as environment variables
— never pass them on the command line or commit them. Load from a local,
gitignored .env yourself, e.g.:

  export $(grep -v '^#' .env | xargs) && python3 scripts/resource-discovery/load_candidates.py \\
    --source irs_bmf --csv /tmp/irs-bmf-candidates.csv

This script only INSERTs into discovery_candidates (status defaults to
'pending' in the DB) — it never touches the resources table and never
publishes anything. A row is skipped if a candidate with the same
(source, source_ref) already exists, so re-running a source's script monthly
doesn't re-queue the same organization every time.
"""
import argparse
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request

# Columns consumed directly by discovery_candidates' own top-level columns;
# everything else in the row goes into suggested_fields.
TOP_LEVEL_FIELDS = {"organization_name", "primary_category"}
EIN_PATTERN = re.compile(r"EIN (\d+)")


def supabase_headers(service_role_key):
    return {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }


def supabase_get(base_url, path, service_role_key):
    request = urllib.request.Request(f"{base_url}{path}", headers=supabase_headers(service_role_key))
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def supabase_insert(base_url, table, rows, service_role_key):
    if not rows:
        return
    request = urllib.request.Request(
        f"{base_url}/rest/v1/{table}",
        data=json.dumps(rows).encode("utf-8"),
        headers={**supabase_headers(service_role_key), "Prefer": "return=minimal"},
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        response.read()


def extract_source_ref(verification_notes: str) -> str:
    match = EIN_PATTERN.search(verification_notes or "")
    return match.group(1) if match else ""


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, help="Source layer name, e.g. irs_bmf")
    parser.add_argument("--csv", required=True, help="Candidate CSV produced by a source script")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be inserted without writing to Supabase")
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not args.dry_run and (not supabase_url or not service_role_key):
        print("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or pass --dry-run to test without them).", file=sys.stderr)
        sys.exit(1)

    with open(args.csv, newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    print(f"Read {len(rows)} rows from {args.csv}", file=sys.stderr)

    existing_refs = set()
    if not args.dry_run:
        existing = supabase_get(
            supabase_url,
            f"/rest/v1/discovery_candidates?source=eq.{args.source}&select=source_ref",
            service_role_key,
        )
        existing_refs = {row["source_ref"] for row in existing if row.get("source_ref")}
        print(f"{len(existing_refs)} candidates from source '{args.source}' already in the queue", file=sys.stderr)

    to_insert = []
    skipped_existing = 0
    for row in rows:
        source_ref = extract_source_ref(row.get("verification_notes", ""))
        if source_ref and source_ref in existing_refs:
            skipped_existing += 1
            continue
        suggested_fields = {key: value for key, value in row.items() if key not in TOP_LEVEL_FIELDS and value}
        to_insert.append({
            "source": args.source,
            "source_ref": source_ref or None,
            "organization_name": row["organization_name"],
            "primary_category": row["primary_category"],
            "suggested_fields": suggested_fields,
        })

    print(f"{len(to_insert)} new candidates to insert ({skipped_existing} already queued, skipped)", file=sys.stderr)

    if args.dry_run:
        print(json.dumps(to_insert[:3], indent=2, ensure_ascii=False), file=sys.stderr)
        print("(--dry-run: nothing written)", file=sys.stderr)
        return

    batch_size = 200
    for start in range(0, len(to_insert), batch_size):
        batch = to_insert[start:start + batch_size]
        try:
            supabase_insert(supabase_url, "discovery_candidates", batch, service_role_key)
        except urllib.error.HTTPError as error:
            print(f"Insert failed at batch starting row {start}: {error.read().decode('utf-8', errors='replace')}", file=sys.stderr)
            sys.exit(1)
        print(f"Inserted rows {start + 1}-{start + len(batch)}", file=sys.stderr)

    print(f"Done — {len(to_insert)} candidates queued for review at /admin/descubrimiento", file=sys.stderr)


if __name__ == "__main__":
    main()
