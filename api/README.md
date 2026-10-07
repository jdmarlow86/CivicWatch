# CivicWatch query API design

The production API should expose read-only endpoints over the normalized database:

- GET /api/spending?q=road&department=Public%20Works&fiscalYear=2025
- GET /api/spending/:id
- GET /api/vendors/:normalizedName
- GET /api/departments
- GET /api/summary?fiscalYear=2025
- GET /api/observations

Responses should include provenance for every expenditure. The API must distinguish:
1. government-reported fields,
2. CivicWatch-normalized fields,
3. CivicWatch-derived observations.

The current GitHub Pages deployment remains static. A hosted API/database can be attached later without changing the public data model.
