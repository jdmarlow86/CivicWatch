export async function loadSpending(){
  const r=await fetch(`${import.meta.env.BASE_URL}data/normalized/tn-expenditures.json`,{cache:"no-store"});
  if(!r.ok)throw new Error(`Data request failed: ${r.status}`);
  const j=await r.json();
  if(!j.records?.length)throw new Error("No Tennessee records were published.");
  return j;
}
