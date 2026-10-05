import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const year=process.argv[2]||"2025";
const out=process.argv[3]||path.join(ROOT,"data","raw",`E${year} Expenditures.xlsx`);
const indexUrl="https://comptroller.tn.gov/office-functions/la/e-services/tag-tableau/tag-exports.html";

const page=await fetch(indexUrl);
if(!page.ok) throw new Error(`Tennessee TAG export page unavailable: ${page.status} ${page.statusText}`);
const html=await page.text();
const hrefs=[...html.matchAll(/href=["']([^"']+)["']/gi)].map(m=>m[1]);
const candidates=hrefs.filter(h=>/2025|expenditure/i.test(h));
const href=candidates.find(h=>/E?2025.*Expenditures|Expenditures.*2025/i.test(decodeURIComponent(h)))||candidates.find(h=>/2025/i.test(h));
if(!href) throw new Error("Could not locate the Tennessee TAG expenditure export link on the official export page.");
const url=new URL(href,indexUrl).href;

const res=await fetch(url);
if(!res.ok) throw new Error(`Tennessee TAG expenditure export unavailable: ${res.status} ${res.statusText} (${url})`);
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.writeFile(out,Buffer.from(await res.arrayBuffer()));
await fs.writeFile(path.join(ROOT,"data","raw","tn-tag-source.json"),JSON.stringify({publisher:"Tennessee Comptroller of the Treasury",dataset:`TAG Expenditures ${year}`,url,retrievedAt:new Date().toISOString()},null,2));
console.log(`Downloaded FY${year} TAG expenditures -> ${out}`);
