CREATE TABLE IF NOT EXISTS governments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  state TEXT
);
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  publisher TEXT NOT NULL,
  dataset TEXT NOT NULL,
  url TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  checksum TEXT
);
CREATE TABLE IF NOT EXISTS spending (
  id TEXT PRIMARY KEY,
  government_id TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  source_record_id TEXT,
  source_sheet TEXT,
  date TEXT,
  fiscal_year INTEGER,
  vendor_name TEXT,
  vendor_normalized TEXT,
  department TEXT,
  purpose TEXT,
  category TEXT,
  amount_cents INTEGER NOT NULL,
  FOREIGN KEY(government_id) REFERENCES governments(id),
  FOREIGN KEY(source_id) REFERENCES sources(id)
);
CREATE INDEX IF NOT EXISTS idx_spending_date ON spending(date);
CREATE INDEX IF NOT EXISTS idx_spending_fy ON spending(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_spending_vendor ON spending(vendor_normalized);
CREATE INDEX IF NOT EXISTS idx_spending_department ON spending(department);
CREATE INDEX IF NOT EXISTS idx_spending_amount ON spending(amount_cents);
