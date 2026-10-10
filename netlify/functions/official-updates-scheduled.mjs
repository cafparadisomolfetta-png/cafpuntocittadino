import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

export const config = { schedule: "@daily" };

const SOURCES = [
  {id:"inps",name:"INPS",url:"https://www.inps.it/it/it/rss.html"},
  {id:"puglia",name:"Regione Puglia",url:"https://www.regione.puglia.it/"},
  {id:"arpal",name:"ARPAL Puglia",url:"https://arpal.regione.puglia.it/"},
  {id:"pugliasalute",name:"PugliaSalute",url:"https://www.sanita.puglia.it/"},
  {id:"interno",name:"Ministero dell'Interno",url:"https://www.interno.gov.it/"},
  {id:"entrate",name:"Agenzia delle Entrate",url:"https://www.agenziaentrate.gov.it/"},
  {id:"ader",name:"Agenzia Entrate-Riscossione",url:"https://www.agenziaentrateriscossione.gov.it/"},
  {id:"send",name:"SEND",url:"https://notifichedigitali.pagopa.it/"}
];

const KNOWN_KEYS = [
  "isee","bonus-mamme","bonus-nuovi-nati","bonus-nido","assegno-unico",
  "congedo-parentale","naspi","adi","pensioni","invalidita-civile","730",
  "maternita","piano-casa"
];

function sha(text){ return createHash("sha256").update(text).digest("hex"); }

async function fetchText(url){
  const r = await fetch(url,{
    headers:{"user-agent":"CAF-Punto-Cittadino-Monitor/2.0"},
    signal:AbortSignal.timeout(15000)
  });
  if(!r.ok) throw new Error(String(r.status));
  const t=(await r.text())
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g," ")
    .replace(/\s+/g," ")
    .trim();
  return t.slice(0,45000);
}

async function extractUpdates(source, text){
  if(!process.env.OPENAI_API_KEY) return [];
  const prompt = `
Analizza ESCLUSIVAMENTE il testo della fonte istituzionale qui sotto.
Estrai solo bonus, prestazioni, agevolazioni, servizi pubblici o aggiornamenti rilevanti per un portale CAF/Patronato/Sindacato.
Non inventare nulla. Se una novità è ambigua o mancano requisiti/importi/scadenze, usa status "needs_review".
Se riconosci una misura già nota usa una key tra: ${KNOWN_KEYS.join(", ")}.
Se è una misura nuova, crea una key breve in kebab-case e imposta is_new=true.
Restituisci SOLO JSON valido come array di oggetti con:
key,title,summary,status,is_new,source_url
dove status è "verified" oppure "needs_review".
Fonte: ${source.name}
URL: ${source.url}
TESTO:
${text}
`;
  const r=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      model:"gpt-6-luna",
      input:prompt,
      max_output_tokens:1800,
      store:false
    })
  });
  if(!r.ok) return [];
  const data=await r.json();
  const raw=(data.output_text||"").trim();
  try{
    const arr=JSON.parse(raw);
    return Array.isArray(arr)?arr:[];
  }catch{
    return [];
  }
}

function mergeCatalog(oldCatalog,newItems){
  const map=new Map((oldCatalog||[]).map(x=>[x.key,x]));
  for(const item of newItems){
    if(!item?.key || !item?.title) continue;
    map.set(item.key,{
      ...(map.get(item.key)||{}),
      ...item,
      updated_at:new Date().toISOString()
    });
  }
  return [...map.values()].slice(0,120);
}

export default async ()=>{
  const store=getStore("official-updates");
  let state={sources:[],catalog:[]};
  try{state=JSON.parse((await store.get("state.json"))||'{"sources":[],"catalog":[]}')}catch{}

  const prev=new Map((state.sources||[]).map(x=>[x.id,x]));
  const sourceStatus=[];
  let catalog=state.catalog||[];

  for(const source of SOURCES){
    try{
      const text=await fetchText(source.url);
      const hash=sha(text);
      const old=prev.get(source.id);
      const changed=!old?.hash || old.hash!==hash;

      if(changed){
        const items=await extractUpdates(source,text);
        catalog=mergeCatalog(catalog,items);
      }

      sourceStatus.push({
        id:source.id,name:source.name,url:source.url,
        ok:true,hash,changed,checked_at:new Date().toISOString()
      });
    }catch(e){
      const old=prev.get(source.id);
      sourceStatus.push({
        id:source.id,name:source.name,url:source.url,
        ok:false,hash:old?.hash||null,changed:false,
        checked_at:new Date().toISOString()
      });
    }
  }

  const next={checkedAt:new Date().toISOString(),sources:sourceStatus,catalog};
  await store.set("state.json",JSON.stringify(next));
  return new Response(JSON.stringify({ok:true,items:catalog.length}),{
    headers:{"content-type":"application/json"}
  });
};