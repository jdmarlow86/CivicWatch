# CivicWatch data pipeline

The pipeline uses official Tennessee Comptroller TAG expenditure exports.

## Local ingestion

1. Download an official workbook:
   npm run data:download -- 2025
2. Normalize it:
   npm run data:import -- "data/raw/E2025 Expenditures.xlsx"
3. Start the app:
   npm run dev

The normalized JSON retains publisher, dataset, source URL, retrieval time, fiscal year, and source sheet. The importer intentionally skips rows it cannot confidently identify as monetary expenditures rather than inventing mappings.

The 2025 export is the first supported source. Tennessee currently lists expenditure exports for 2025 and prior years on its TAG Exports page.