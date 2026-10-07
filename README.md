# CivicWatch

Source-first civic transparency app for making government spending easier to search, understand, and trace to primary records.

## MVP status
- Responsive Tennessee-focused dashboard
- Spending search and department filtering
- Canonical spending-record schema with provenance
- Trust/source-first UX
- Illustrative records only; no sample amount represents an actual payment

## Run
npm install
npm run dev

## Data architecture
The ingestion pipeline normalizes official Tennessee expenditure exports into a canonical model, then can build a local SQLite database with indexed spending, vendor, department, government, and source tables. A future hosted read-only API can expose the same model without changing the frontend.

## Data commands
- `npm run data:download -- 2025` — download an official Tennessee TAG workbook
- `npm run data:import -- "data/raw/E2025 Expenditures.xlsx"` — normalize it
- `npm run data:db` — build `data/civicwatch.db`
- `npm run data:query -- road` — query the local database

## Next
Connect the database to a hosted read-only API, add vendor/year/category aggregation endpoints, and add reproducible data-quality checks.
