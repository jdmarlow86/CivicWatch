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
    const keys=Object.keys(raw);
    const key=(patterns)=>keys.find(k=>patterns.some(p=>k.toLowerCase().replace(/[^a-z0-9]/g,"").includes(p)));
    const pick=(patterns)=>{const k=key(patterns);return k?raw[k]:null};
    const amountValue=pick(["expenditure","amount","expense","totalexpenditures","totalexpense"]);
    const amount=typeof amountValue==="number"?amountValue:Number(String(amountValue??"").replace(/[$,]/g,""));
    if(!Number.isFinite(amount)) continue;

    const government=String(pick(["county","municipality","government","jurisdiction","entity"])??"").trim();
    const vendor=String(pick(["vendor","payee","recipient","provider"])??"").trim();
    const department=String(pick(["department","function","agency","office","fund"])??sheet).trim();
    const purpose=String(pick(["description","purpose","expendituretype","account","object","category"])??"").trim();
    const fiscalYear=Number(pick(["fiscalyear","fiscalfy","fy"]))||2025;
    const dateRaw=pick(["date"]);
    const date=dateRaw instanceof Date?dateRaw.toISOString().slice(0,10):String(dateRaw??"").slice(0,10);

    rows.push({
      id:`TN-TAG-${rows.length+1}`,
      governmentId:"tn",
      governmentName:government||"Tennessee local government",
      jurisdiction:government||"Tennessee",
      date,
      fiscalYear,
      vendor:{name:vendor||"—",normalizedName:vendor?vendor.toUpperCase().replace(/[^A-Z0-9]+/g," ").trim():""},
      department,
      purpose:purpose||"Government expenditure",
      category:purpose||department,
      amount,
      source:{
        publisher:sourceMeta.publisher,
        dataset:sourceMeta.dataset,
        url:sourceMeta.url,
        retrievedAt:sourceMeta.retrievedAt,
        sourceRecordId:null,
        sheet
      }
    });
  }
}

await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify({
  schemaVersion:"1.1",
  source:sourceMeta,
  recordCount:rows.length,
  records:rows
},null,2));
console.log(`Imported ${rows.length} records from ${wb.SheetNames.length} sheets -> ${output}`);
