#!/usr/bin/env python3
"""Extract FY2025 state/federal grant schedule totals from official TN county AFR PDFs.

This deliberately records a value only when the report can be downloaded and the
expected schedule total is unambiguous. Missing or unusual reports are emitted as
uncompiled, never silently treated as $0.
"""
import json
import re
import time
import io
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

COUNTIES = [
"Anderson","Bedford","Benton","Bledsoe","Blount","Bradley","Campbell","Cannon","Carroll","Carter","Cheatham","Chester","Claiborne","Clay","Cocke","Coffee","Crockett","Cumberland","Davidson","Decatur","DeKalb","Dickson","Dyer","Fayette","Fentress","Franklin","Gibson","Giles","Grainger","Greene","Grundy","Hamblen","Hamilton","Hancock","Hardeman","Hardin","Hawkins","Haywood","Henderson","Henry","Hickman","Houston","Humphreys","Jackson","Jefferson","Johnson","Knox","Lake","Lauderdale","Lawrence","Lewis","Lincoln","Loudon","Macon","Madison","Marion","Marshall","Maury","McMinn","McNairy","Meigs","Monroe","Montgomery","Moore","Morgan","Obion","Overton","Perry","Pickett","Polk","Putnam","Rhea","Roane","Robertson","Rutherford","Scott","Sequatchie","Sevier","Shelby","Smith","Stewart","Sullivan","Sumner","Tipton","Trousdale","Unicoi","Union","Van Buren","Warren","Washington","Wayne","Weakley","White","Williamson","Wilson"
]
BASE = "https://comptroller.tn.gov/content/dam/cot/la/documents/county/2025/FY25{county}AFR.pdf"
OUT = Path("public/data/county-grants-fy2025.json")

def extract_schedule_totals(pdf_bytes):
    """Extract totals from the specific grant schedule near the end of the AFR."""
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise RuntimeError("Install PyMuPDF before running this extractor") from exc

    with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
        start_page = None
        first = max(0, len(pdf) - 45)
        for page_index in range(len(pdf) - 1, first - 1, -1):
            page_text = pdf[page_index].get_text("text") or ""
            normalized = re.sub(r"\s+", " ", page_text).lower()
            if ("schedule of expenditures of federal awards" in normalized
                    and "state grants" in normalized):
                start_page = page_index
                break

        if start_page is None:
            return None, None, "Grant schedule heading was not found in the final 45 pages."

        schedule_text = []
        state_total = None
        federal_total = None
        for page_index in range(start_page, min(len(pdf), start_page + 8)):
            schedule_text.append(pdf[page_index].get_text("text") or "")
            joined = "\n".join(schedule_text)
            state_total = state_total or extract_labeled_total(joined, r"TOTAL\s+STATE\s+GRANTS")
            federal_total = federal_total or extract_labeled_total(
                joined, r"TOTAL\s+(?:EXPENDITURES\s+OF\s+)?FEDERAL\s+GRANTS"
            )
            if state_total is not None and federal_total is not None:
                break
        return state_total, federal_total, None


def extract_labeled_total(text, label_pattern):
    """Read an amount attached to an exact total label, including wrapped rows."""
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    label = re.compile(label_pattern, re.IGNORECASE)
    amount = re.compile(r"\$?\s*([0-9][0-9,]*(?:\.\d{2})?)")
    for index, line in enumerate(lines):
        match = label.search(line)
        if not match:
            continue
        same_line = amount.search(line[match.end():])
        if same_line:
            return int(round(float(same_line.group(1).replace(",", ""))))
        for following in lines[index + 1:index + 3]:
            found = amount.search(following)
            if found:
                return int(round(float(found.group(1).replace(",", ""))))
    return None

def process_county(county):
    """Download and extract one county report. Safe to run concurrently."""
    url = BASE.format(county=quote(county, safe=""))
    record = {"county": county, "fiscalYear": 2025, "report": url,
              "stateGrants": None, "federalGrants": None, "status": "not_extracted",
              "note": "Report unavailable or schedule totals could not be identified automatically."}
    try:
        request = Request(url, headers={"User-Agent": "CivicWatch public-data extractor"})
        with urlopen(request, timeout=12) as response:
            pdf_bytes = response.read()
        state_total, federal_total, extraction_note = extract_schedule_totals(pdf_bytes)
        record["stateGrants"] = state_total
        record["federalGrants"] = federal_total
        if state_total is not None and federal_total is not None:
            record["status"] = "extracted_needs_review"
            record["note"] = "Totals extracted from the Schedule of Expenditures of Federal Awards and State Grants. Verify against the linked report before treating as confirmed."
        else:
            record["status"] = "manual_review"
            record["note"] = extraction_note or "The grant schedule was found, but one or both exact total rows need manual review."
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        record["status"] = "report_unavailable"
        record["note"] = f"Official report URL could not be retrieved ({type(exc).__name__})."
    return record


def main():
    try:
        import fitz  # noqa: F401 - validate before starting concurrent downloads
    except ImportError as exc:
        raise SystemExit("Install PyMuPDF before running this extractor") from exc

    # County reports are independent. Bounded concurrency overlaps slow HTTP
    # requests without overwhelming the Comptroller's public website.
    results = {}
    max_workers = 8
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_county, county): county for county in COUNTIES}
        completed = 0
        for future in as_completed(futures):
            county = futures[future]
            try:
                record = future.result()
            except Exception as exc:
                # One unexpected PDF/parser issue must not abort all 95 counties.
                url = BASE.format(county=quote(county, safe=""))
                record = {"county": county, "fiscalYear": 2025, "report": url,
                          "stateGrants": None, "federalGrants": None, "status": "manual_review",
                          "note": f"Unexpected extraction error ({type(exc).__name__}); manual review required."}
            results[county] = record
            completed += 1
            print(f"[{completed}/{len(COUNTIES)}] {county}: {record['status']}", flush=True)

    # Keep output order stable regardless of the order workers finish.
    results = {county: results[county] for county in COUNTIES}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "source": "Tennessee Comptroller of the Treasury, county annual financial reports",
        "fiscalYear": 2025,
        "generatedAt": time.strftime("%Y-%m-%d"),
        "method": "Parallel downloads with targeted extraction from the official grant schedule; values remain provisional until manually checked.",
        "counties": results
    }, indent=2) + "\n", encoding="utf-8")
    extracted = sum(1 for item in results.values() if item["status"] == "extracted_needs_review")
    print(f"Wrote {OUT}; {extracted}/{len(COUNTIES)} reports had both totals detected.")

if __name__ == "__main__":
    main()
