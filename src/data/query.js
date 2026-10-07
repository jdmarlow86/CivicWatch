// Shared query and aggregation helpers for normalized CivicWatch records.
const text=v=>String(v??"").toLowerCase();
const amount=r=>Number(r.amount??0);
export function filterSpending(records,{q="",department="",vendor="",fiscalYear="",minAmount="",maxAmount="",from="",to=""}={}){
 const needle=text(q);
 return records.filter(r=>{const hay=[r.vendor?.name,r.vendor?.normalizedName,r.department,r.purpose,r.category].map(text).join(" ");if(needle&&!hay.includes(needle))return false;if(department&&r.department!==department)return false;if(vendor&&text(r.vendor?.normalizedName||r.vendor?.name)!==text(vendor))return false;if(fiscalYear&&Number(r.fiscalYear)!==Number(fiscalYear))return false;if(minAmount!==""&&amount(r)<Number(minAmount))return false;if(maxAmount!==""&&amount(r)>Number(maxAmount))return false;if(from&&r.date<from)return false;if(to&&r.date>to)return false;return true});
}
export function paginate(records,page=1,pageSize=50){const p=Math.max(1,Number(page)||1),s=Math.min(250,Math.max(1,Number(pageSize)||50)),start=(p-1)*s;return{items:records.slice(start,start+s),page:p,pageSize:s,total:records.length,totalPages:Math.ceil(records.length/s)}}
export function summarize(records){const total=records.reduce((s,r)=>s+amount(r),0);return{count:records.length,total,average:records.length?total/records.length:0,largest:records.reduce((m,r)=>amount(r)>amount(m)?r:m,null)}}
function rank(records,key){const m=new Map();for(const r of records){const k=key(r)||"Unknown";const x=m.get(k)||{name:k,count:0,amount:0};x.count++;x.amount+=amount(r);m.set(k,x)}return[...m.values()].sort((a,b)=>b.amount-a.amount)}
export const rankVendors=r=>rank(r,x=>x.vendor?.normalizedName||x.vendor?.name);
export const rankDepartments=r=>rank(r,x=>x.department);
export const rankCategories=r=>rank(r,x=>x.category);
export const rankYears=r=>rank(r,x=>String(x.fiscalYear||"Unknown"));
export function yearOverYear(records,field="department"){const years=[...new Set(records.map(r=>Number(r.fiscalYear)).filter(Boolean))].sort((a,b)=>a-b),current=years.at(-1),previous=years.at(-2);if(!current||!previous)return[];const key=r=>field==="vendor"?(r.vendor?.normalizedName||r.vendor?.name):r[field]||"Unknown";const totals=y=>{const m=new Map();for(const r of records.filter(r=>Number(r.fiscalYear)===y)){const k=key(r);m.set(k,(m.get(k)||0)+amount(r))}return m};const a=totals(previous),b=totals(current),keys=new Set([...a.keys(),...b.keys()]);return[...keys].map(name=>{const prior=a.get(name)||0,now=b.get(name)||0;return{name,previous:prior,current:now,change:now-prior,changePct:prior?(now-prior)/prior*100:null}}).sort((x,y)=>Math.abs(y.change)-Math.abs(x.change))}
export const largestPayments=(records,limit=25)=>[...records].sort((a,b)=>amount(b)-amount(a)).slice(0,Math.min(250,limit));
