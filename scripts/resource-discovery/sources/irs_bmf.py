#!/usr/bin/env python3
"""IRS Business Master File (BMF) discovery source — Phase 1 of the PuenteATX
resource-discovery pipeline (see scripts/resource-discovery/README.md).

Downloads the Texas EO BMF extract, keeps organizations that are:
  - in a Travis County ZIP code (per src/config/centralTexasZipCentroids.js,
    the SAME crosswalk the site itself uses — read live, never copied), and
  - unconditionally tax-exempt (STATUS 01), and
  - tagged with an NTEE code relevant to a PuenteATX category (see
    NTEE_CATEGORY_MAP below; sources cited there),

and writes a candidate CSV matching the live CSV_IMPORT_HEADERS order from
src/data/csvImport.js, ready for /admin/recursos/importar.

This script NEVER publishes and never invents facts the BMF doesn't contain.
Every field beyond organization_name/primary_category/verification_notes is
left blank on purpose — a human completes the 19-point research checklist
(prepare-puente-resources skill) per candidate before it goes live. The BMF's
address is the org's IRS correspondence/mailing address, not necessarily a
public service location, so address fields are intentionally left for the
human researcher rather than auto-populated (same rule the skill already
applies to CSV imports generally).

Usage:
  python3 irs_bmf.py --out discovery-queue/irs-bmf-candidates.csv
  python3 irs_bmf.py --out ... --bmf-file /path/to/already-downloaded/eo_tx.csv
"""
import argparse
import csv
import json
import re
import sys
import urllib.request
from datetime import date, timezone, datetime
from pathlib import Path
from typing import Optional, Set

REPO_ROOT = Path(__file__).resolve().parents[3]
ZIP_CONFIG_PATH = REPO_ROOT / "src/config/centralTexasZipCentroids.js"
BMF_URL = "https://www.irs.gov/pub/irs-soi/eo_tx.csv"
TARGET_COUNTY = "Travis"
ACTIVE_STATUS_CODES = {"01"}  # "Unconditional Exemption" — IRS EO BMF data dictionary (eo-info.pdf)

CSV_IMPORT_HEADERS = [
    "organization_name", "title_es", "title_en", "summary_es", "summary_en",
    "description_es", "description_en", "slug", "primary_category",
    "additional_categories", "keywords_es", "keywords_en", "languages",
    "service_methods", "cost_type", "eligibility_es", "eligibility_en",
    "required_documents_es", "required_documents_en", "application_steps_es",
    "application_steps_en", "hours_es", "hours_en", "accessibility_notes_es",
    "accessibility_notes_en", "service_area_es", "service_area_en", "phone",
    "sms_phone", "whatsapp_phone", "email", "website_url", "address_line_1",
    "address_line_2", "city", "state", "postal_code", "county", "latitude",
    "longitude", "source_url", "is_featured", "is_emergency", "last_verified_at",
    "verification_notes",
]

# NTEE major-group letters and minor codes -> PuenteATX category slug.
# Source: IRS Exempt Organizations Business Master File data dictionary
# (https://www.irs.gov/pub/foia/ig/tege/eo-info.pdf, "NTEE CODES" table) for
# the P-prefixed minor codes, and the NCCS/Urban Institute NTEE major-group
# table (https://urbaninstitute.github.io/nccs-legacy/ntee/ntee.html) for the
# single-letter groups. Verified 2026-09-29 — re-check if the IRS reissues
# eo-info.pdf with a different table.
#
# "otros-recursos" is deliberately NOT auto-matched: it's PuenteATX's
# catch-all category and has no clean NTEE equivalent — an NTEE-based filter
# for it would mostly return noise. Anything that doesn't match a row below
# is simply not proposed as a candidate.
#
# Every major group repeats the same generic-infrastructure minor codes —
# 01 Alliance/Advocacy, 02 Management & Technical Assistance, 03 Professional
# Societies, 05 Research Institutes, 11 Single Organization Support, 12 Fund
# Raising/Distribution, 19 Support N.E.C. — none of that is a direct service
# to a person or family, so none of it is listed below for any letter.
#
# Major groups G (Voluntary Health Associations & Medical Disciplines) and H
# (Medical Research) are dropped entirely: G is almost entirely disease
# awareness/advocacy (G81 AIDS, G84 Autism, ...) and medical-specialty
# professional associations (G92 Biomedicine, G96 Neurology, ...), not direct
# patient services; H's ~30 minor codes are all literally "<condition>
# Research". A live test run (2026-09-29, 2,052 raw candidates) surfaced real
# false positives from both — a data-standards consortium (E05-adjacent), a
# fundraising bike race (G "Texas 4000 for Cancer"), and two research
# institutes (H "Wilderness Medical Society", "Texas Academy of Medicine
# Engineering Science and Technology").
#
# B (Education) intentionally excludes B20-B50 (actual K-12 schools,
# preschools, colleges, universities) and B83/B84 (sororities/fraternities,
# alumni associations) — decided 2026-09-29: PuenteATX's "educación" category
# is about support services a family seeks help from, not a listing of every
# school. Only the support-service minor codes are kept.
#
# K (Food) intentionally excludes the farm/agriculture codes (K20 Agricultural
# Programs, K25 Farmland Preservation, K26 Animal Husbandry, K28 Farm Bureau,
# K50 Home Economics) and the NAICS-style business codes (K6A-K6F, K90-K98:
# restaurants, grocery stores, bars, convenience stores) that appear under the
# same major group in the IRS's own extended list — those are not food
# assistance.
NTEE_CATEGORY_MAP = [
    ("P52", "transporte"),              # Transportation Assistance
    ("P51", "recursos-financieros"),    # Financial Counseling
    ("P58", "recursos-financieros"),    # Gift Distribution
    ("P60", "recursos-financieros"),    # Emergency Assistance
    ("K30", "comida"), ("K31", "comida"), ("K34", "comida"), ("K35", "comida"),
    ("K36", "comida"), ("K40", "comida"), ("K99", "comida"),
    ("L20", "vivienda"), ("L21", "vivienda"), ("L22", "vivienda"), ("L24", "vivienda"),
    ("L25", "vivienda"), ("L30", "vivienda"), ("L40", "vivienda"), ("L41", "vivienda"),
    ("L80", "vivienda"), ("L81", "vivienda"), ("L82", "vivienda"), ("L99", "vivienda"),
    # L50 (Homeowners & Tenants Associations) deliberately excluded — a live test
    # run (2026-09-29) showed it matches literal HOAs (neighborhood-rules
    # associations for existing homeowners), not housing assistance.
    ("E20", "salud"), ("E21", "salud"), ("E22", "salud"), ("E24", "salud"),
    ("E30", "salud"), ("E31", "salud"), ("E32", "salud"), ("E40", "salud"),
    ("E42", "salud"), ("E50", "salud"), ("E60", "salud"), ("E61", "salud"),
    ("E62", "salud"), ("E65", "salud"), ("E70", "salud"), ("E80", "salud"),
    ("E86", "salud"), ("E90", "salud"), ("E91", "salud"), ("E92", "salud"), ("E99", "salud"),
    ("F20", "salud"), ("F21", "salud"), ("F22", "salud"), ("F30", "salud"),
    ("F31", "salud"), ("F32", "salud"), ("F33", "salud"), ("F40", "salud"),
    ("F42", "salud"), ("F50", "salud"), ("F52", "salud"), ("F53", "salud"),
    ("F54", "salud"), ("F60", "salud"), ("F70", "salud"), ("F80", "salud"), ("F99", "salud"),
    ("B60", "educacion"),  # Adult, Continuing Education
    ("B70", "educacion"),  # Libraries
    ("B82", "educacion"),  # Scholarships, Student Financial Aid Services, Awards
    ("B92", "educacion"),  # Remedial Reading, Reading Encouragement
    ("I20", "ayuda-legal"), ("I21", "ayuda-legal"), ("I23", "ayuda-legal"),
    ("I30", "ayuda-legal"), ("I31", "ayuda-legal"), ("I40", "ayuda-legal"),
    ("I43", "ayuda-legal"), ("I44", "ayuda-legal"), ("I50", "ayuda-legal"),
    ("I51", "ayuda-legal"), ("I60", "ayuda-legal"), ("I70", "ayuda-legal"),
    ("I71", "ayuda-legal"), ("I72", "ayuda-legal"), ("I73", "ayuda-legal"),
    ("I80", "ayuda-legal"), ("I83", "ayuda-legal"), ("I99", "ayuda-legal"),
]
# Sort longest prefix first so a more specific code is always tried before a
# shorter one that happens to be a prefix of it (defensive — every entry above
# is already 3 characters, but this keeps the matcher correct if a bare
# major-group letter is ever added back for a category).
NTEE_CATEGORY_MAP.sort(key=lambda pair: -len(pair[0]))


def load_travis_zip_codes() -> Set[str]:
    """Read the site's own ZIP->county crosswalk instead of keeping a copy.

    src/config/centralTexasZipCentroids.js is `export default { ...json... };`
    — the object body is valid JSON once that wrapper is stripped.
    """
    raw = ZIP_CONFIG_PATH.read_text(encoding="utf-8").strip()
    prefix = "export default"
    if not raw.startswith(prefix):
        raise ValueError(f"Unexpected format in {ZIP_CONFIG_PATH}: missing '{prefix}' prefix")
    body = raw[len(prefix):].strip()
    if body.endswith(";"):
        body = body[:-1]
    data = json.loads(body)
    return {
        entry["zipCode"]
        for entry in data["zipCodes"]
        if entry.get("county") == TARGET_COUNTY and entry.get("active", True)
    }


def category_for_ntee(ntee_cd: str) -> Optional[str]:
    if not ntee_cd:
        return None
    for prefix, category in NTEE_CATEGORY_MAP:
        if ntee_cd.startswith(prefix):
            return category
    return None


def fetch_bmf_rows(bmf_file: Optional[str]):
    if bmf_file:
        with open(bmf_file, newline="", encoding="utf-8", errors="replace") as handle:
            yield from csv.DictReader(handle)
        return
    request = urllib.request.Request(BMF_URL, headers={"User-Agent": "PuenteATX-resource-discovery/1.0 (+https://puenteatx.org)"})
    with urllib.request.urlopen(request) as response:
        lines = (line.decode("utf-8", errors="replace") for line in response)
        yield from csv.DictReader(lines)


def build_candidate_row(bmf_row: dict, category: str, zip5: str, run_date: str) -> dict:
    row = {header: "" for header in CSV_IMPORT_HEADERS}
    name = bmf_row.get("NAME", "").strip()
    row["organization_name"] = name
    row["primary_category"] = category
    row["city"] = bmf_row.get("CITY", "").strip().title()
    row["state"] = "TX"
    row["postal_code"] = zip5
    row["county"] = TARGET_COUNTY
    row["is_featured"] = "0"
    row["is_emergency"] = "0"
    ein = bmf_row.get("EIN", "").strip()
    ntee = bmf_row.get("NTEE_CD", "").strip()
    row["verification_notes"] = (
        f"Candidato descubierto vía IRS Business Master File (EIN {ein}) el {run_date}. "
        f"Categoría sugerida por código NTEE '{ntee}'. Pendiente: investigar sitio web, "
        "contacto, programa/servicio específico (title_es/en, summary, elegibilidad, "
        "horario). La dirección del BMF es la de registro/correspondencia ante el IRS, "
        "no necesariamente un lugar de atención al público — confirmar antes de usarla "
        "como address_line_1, o dejarla en blanco si el servicio es telefónico/en línea."
    )
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, help="Output CSV path")
    parser.add_argument("--bmf-file", help="Use an already-downloaded eo_tx.csv instead of fetching it")
    parser.add_argument("--existing-names", help=(
        "Optional path to a newline-delimited file of existing organization_name "
        "values (e.g. exported from resources) — matching names are skipped so "
        "the candidate list doesn't repeat what's already in the directory."
    ))
    args = parser.parse_args()

    travis_zips = load_travis_zip_codes()
    print(f"Loaded {len(travis_zips)} Travis County ZIP codes from {ZIP_CONFIG_PATH.relative_to(REPO_ROOT)}", file=sys.stderr)

    existing_names = set()
    if args.existing_names:
        existing_names = {
            line.strip().casefold()
            for line in Path(args.existing_names).read_text(encoding="utf-8").splitlines()
            if line.strip()
        }
        print(f"Loaded {len(existing_names)} existing organization names to exclude", file=sys.stderr)

    run_date = datetime.now(timezone.utc).astimezone().date().isoformat()
    candidates = []
    seen_eins = set()
    total_seen = 0
    for bmf_row in fetch_bmf_rows(args.bmf_file):
        total_seen += 1
        if bmf_row.get("STATUS", "").strip() not in ACTIVE_STATUS_CODES:
            continue
        zip5 = (bmf_row.get("ZIP", "") or "").strip()[:5]
        if zip5 not in travis_zips:
            continue
        category = category_for_ntee((bmf_row.get("NTEE_CD", "") or "").strip())
        if category is None:
            continue
        name = (bmf_row.get("NAME", "") or "").strip()
        if not name or name.casefold() in existing_names:
            continue
        ein = (bmf_row.get("EIN", "") or "").strip()
        if ein in seen_eins:
            continue
        seen_eins.add(ein)
        candidates.append(build_candidate_row(bmf_row, category, zip5, run_date))

    print(f"Scanned {total_seen} TX organizations -> {len(candidates)} Travis County candidates", file=sys.stderr)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_IMPORT_HEADERS)
        writer.writeheader()
        writer.writerows(candidates)
    print(f"Wrote {len(candidates)} candidates to {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
