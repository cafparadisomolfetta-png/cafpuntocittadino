import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
export const config = { schedule: "@daily" };
const SOURCES=[
 {id:"inps",name:"INPS",url:"https://www.inps.it/it/it/rss.html"},
 {id:"puglia",name:"Regione Puglia",url:"https://www.regione.puglia.it/"},
 {id:"arpal",name:"ARPAL Puglia / Centri per l'Impiego",url:"https://arpal.regione.puglia.it/"},
 {id:"pugliasalute",name:"PugliaSalute",url:"https://www.sanita.puglia.it/"},
 {id:"interno",name:"Ministero dell'Interno",url:"https://www.interno.gov.it/"},
 {id:"entrate",name:"Agenzia delle Entrate",url:"https://www.agenziaentrate.gov.it/"},
 {id:"ader",name:"Agenzia Entrate-Riscossione",url:"https://www.agenziaentrateriscossione.gov.it/"},
 {id:"send",name:"SEND",url:"https://notifichedigitali.pagopa.it/"}
];
async function fp(url){
 const r=await fetch(url,{headers:{"user-agent":"CAF-Punto-Cittadino-Monitor/1.0"},signal:AbortSignal.timeout(12000)});
 if(!r.ok) throw new Error(String(r.status));
 const t=(await r.text()).replace(/\s+/g," ").slice(0,1000000);
 return createHash("sha256").update(t).digest("hex");
}
export default async()=>{
 const store=getStore("official-updates"); let old={sources:[]};
 try{old=JSON.parse((await store.get("status.json"))||'{"sources":[]}')}catch{}
 const prev=new Map((old.sources||[]).map(x=>[x.id,x])), now=new Date().toISOString(), result=[];
 for(const src of SOURCES){
  try{const hash=await fp(src.url),p=prev.get(src.id);result.push({...src,ok:true,hash,changed:Boolean(p?.hash&&p.hash!==hash),changedAt:(p?.hash&&p.hash!==hash)?now:(p?.changedAt||null)})}
  catch{const p=prev.get(src.id);result.push({...src,ok:false,hash:p?.hash||null,changed:false,changedAt:p?.changedAt||null})}
 }
 await store.set("status.json",JSON.stringify({checkedAt:now,sources:result}));
 return new Response("ok");
};