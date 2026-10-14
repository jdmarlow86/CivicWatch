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

def extract_total(text, kind):
    # Search around the exact total label and parse the first monetary value
    # on the same or immediately following lines. Avoid matching subtotals.
    source = "FEDERAL" if kind == "federal" else "STATE"
    labels = [
        rf"TOTAL\s+{source}\s+GRANTS",
        rf"TOTAL\s+{source}\s+GRANT\s+EXPENDITURES",
        rf"TOTAL\s+{source}\s+AWARDS",
        rf"TOTAL\s+{source}\s+ASSISTANCE",
    ]
    for label in labels:
        matches = list(re.finditer(label, text, flags=re.IGNORECASE))
        for match in matches:
            window = text[match.end():match.end()+180]
            # PDFs commonly place the total on the next line or right aligned.
            amounts = re.findall(r"\$?\s*([0-9][0-9,]*(?:\.\d{2})?)", window)
            if amounts:
                value = amounts[0].replace(",", "")
                try:
                    return int(round(float(value)))
                except ValueError:
                    pass
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
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        if not text.strip():
            record["status"] = "manual_review"
            record["note"] = "PDF downloaded but no selectable text was found."
        else:
            record["stateGrants"] = extract_total(text, "state")
            record["federalGrants"] = extract_total(text, "federal")
            if record["stateGrants"] is not None and record["federalGrants"] is not None:
                record["status"] = "extracted_needs_review"
                record["note"] = "Automated extraction; verify totals and schedule scope against the linked report before treating as confirmed."
            else:
                record["status"] = "manual_review"
                record["note"] = "Report downloaded, but one or both grant totals need manual review."
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        record["status"] = "report_unavailable"
        record["note"] = f"Official report URL could not be retrieved ({type(exc).__name__})."
    return record


def main():
    global pdfplumber
    try:
        import pdfplumber as _pdfplumber
        pdfplumber = _pdfplumber
    except ImportError as exc:
        raise SystemExit("Install pdfplumber before running this extractor") from exc

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
        "method": "Parallel PDF text extraction; extracted values are provisional until manually checked.",
        "counties": results
    }, indent=2) + "\n", encoding="utf-8")
    extracted = sum(1 for item in results.values() if item["status"] == "extracted_needs_review")
    print(f"Wrote {OUT}; {extracted}/{len(COUNTIES)} reports had both totals detected.")

if __name__ == "__main__":
    main()
