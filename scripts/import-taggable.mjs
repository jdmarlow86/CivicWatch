import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const input=process.argv[2]||path.join(ROOT,"data","raw","E2025 Expenditures.xlsx");
const output=process.argv[3]||path.join(ROOT,"data","normalized","tn-expenditures.json");
const sourceUrl="https://comptroller.tn.gov/content/dam/cot/la/documents/tag-exports/E2025%20Expenditures.xlsx";
const buf=await fs.readFile(input);
const wb=XLSX.read(buf,{cellDates:true});
const rows=[];
for(const sheet of wb.SheetNames){
  const data=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:null,raw:true});
  for(const raw of data){
    const keys=Object.keys(raw);
    const pick=(patterns)=>{const k=keys.find(k=>patterns.some(p=>k.toLowerCase().includes(p)));return k?raw[k]:null};
    const amount=Number(pick(["expenditure","amount","expense","total"]));
    if(!Number.isFinite(amount)) continue;
    const vendor=String(pick(["vendor","payee","recipient","provider","entity"])??"").trim();
    const department=String(pick(["department","function","agency","office"])??sheet).trim();
    const purpose=String(pick(["description","purpose","expenditure type","account","object"])??"").trim();
    const dateRaw=pick(["date"]);
    const date=dateRaw instanceof Date?dateRaw.toISOString().slice(0,10):String(dateRaw??"").slice(0,10);
    const fiscalYear=Number(pick(["fiscal year","fiscalyear","fy"]))||2025;
    rows.push({
      id:`TN-TAG-${rows.length+1}`,governmentId:"tn",
      date, fiscalYear, vendor:{name:vendor,normalizedName:vendor.toUpperCase().replace(/[^A-Z0-9]+/g," ").trim()},
      department,purpose,category:purpose,amount,
      source:{publisher:"Tennessee Comptroller of the Treasury",dataset:`TAG Expenditures ${fiscalYear}`,url:sourceUrl,retrievedAt:new Date().toISOString(),sourceRecordId:null,sheet}
    });
  }
}
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify({schemaVersion:"1.0",source:{url:sourceUrl,publisher:"Tennessee Comptroller of the Treasury"},recordCount:rows.length,records:rows},null,2));
console.log(`Imported ${rows.length} records from ${wb.SheetNames.length} sheets -> ${output}`);
