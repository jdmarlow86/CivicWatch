import Database from "better-sqlite3";
const db=new Database(process.argv[2]||"data/civicwatch.db",{readonly:true});
const q=process.argv.slice(3).join(" ").trim();
const rows=q?db.prepare(`SELECT date,vendor_name,department,purpose,amount_cents FROM spending WHERE vendor_name LIKE ? OR department LIKE ? OR purpose LIKE ? ORDER BY amount_cents DESC LIMIT 25`).all(`%${q}%`,`%${q}%`,`%${q}%`):db.prepare("SELECT date,vendor_name,department,purpose,amount_cents FROM spending ORDER BY amount_cents DESC LIMIT 25").all();
console.table(rows.map(r=>({...r,amount:r.amount_cents/100})));
