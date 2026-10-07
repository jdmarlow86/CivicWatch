# CivicWatch query contract

Shared contract for the UI, local data, and future hosted API.

Filters: q, governmentId, department, vendor, category, fiscalYear, minAmount, maxAmount, from, to.

Endpoints:
- GET /api/spending — paginated filtered expenditures
- GET /api/summary — count, total, average, largest payment
- GET /api/vendors — ranked vendor totals
- GET /api/departments — ranked department totals
- GET /api/categories — ranked category totals
- GET /api/year-over-year?groupBy=department — two-year comparison
- GET /api/largest — largest individual payments

Every response should identify its source dataset. Derived values are CivicWatch calculations, not government-reported values.
