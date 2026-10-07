import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {filterSpending,summarize,rankVendors,rankDepartments,yearOverYear} from "../src/data/query.js";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const payload=JSON.parse(await fs.readFile(process.argv[2]||path.join(root,"data","normalized","tn-expenditures.json"),"utf8"));
const rows=filterSpending(payload.records||[],{fiscalYear:process.env.FY||""});
console.log("CivicWatch report");console.log("=================");
console.log("Records:",rows.length);console.log("Total:",summarize(rows).total.toLocaleString("en-US",{style:"currency",currency:"USD"}));
console.log("\nTop vendors");console.table(rankVendors(rows).slice(0,10));
console.log("\nTop departments");console.table(rankDepartments(rows).slice(0,10));
if(new Set((payload.records||[]).map(r=>r.fiscalYear)).size>1){console.log("\nLargest year-over-year changes");console.table(yearOverYear(payload.records).slice(0,10))}
