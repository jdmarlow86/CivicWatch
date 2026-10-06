import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const input=process.argv[2]||path.join(ROOT,"data","raw","E2025 Expenditures.xlsx");
const output=process.argv[3]||path.join(ROOT,"data","normalized","tn-expenditures.json");
const sourceMetaPath=path.join(ROOT,"data","raw","tn-tag-source.json");
const sourceMeta=JSON.parse(await fs.readFile(sourceMetaPath,"utf8"));
const buf=await fs.readFile(input);
const wb=XLSX.read(buf,{cellDates:true});
const rows=[];

for(const sheet of wb.SheetNames){
  const data=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:null,raw:true});
  for(const raw of data){
    const amount=Number(String(raw.opAudit??"").replace(/[$,]/g,""));
    if(!Number.isFinite(amount)) continue;
    const government=String(raw.ClientName??"").trim();
    const department=String(raw["Minor Description"]??raw["Major Description"]??"Government").trim();
    const major=String(raw["Major Description"]??"").trim();
    const line=String(raw["Line Description"]??"").trim();
    const object=String(raw.ObjectDescription??"").trim();
    const purpose=[line,object].filter(Boolean).join(" • ")||"Government expenditure";
    const fiscalYear=Number(raw.AuditYear)||2025;
    const id=String(rows.length+1);
    rows.push([id,government||"Tennessee local government",department,purpose,major,fiscalYear,amount]);
  }
}

const total=rows.reduce((sum,row)=>sum+row[6],0);
const governments=[...new Set(rows.map(row=>row[1]))].sort();
const departments=[...new Set(rows.map(row=>row[2]))].sort();

await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify({schemaVersion:"2.0",source:sourceMeta,fields:["id","government","department","purpose","category","fiscalYear","amount"],recordCount:rows.length,total,governments,departments,records:rows}));
console.log(`Imported ${rows.length} records from ${wb.SheetNames.length} sheets -> ${output}`);
