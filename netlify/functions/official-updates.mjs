import { getStore } from "@netlify/blobs";
const SAFE=[
 {id:"inps",name:"INPS",url:"https://www.inps.it/it/it/rss.html"},
 {id:"puglia",name:"Regione Puglia",url:"https://www.regione.puglia.it/"},
 {id:"arpal",name:"ARPAL Puglia / Centri per l'Impiego",url:"https://arpal.regione.puglia.it/"},
 {id:"pugliasalute",name:"PugliaSalute",url:"https://www.sanita.puglia.it/"},
 {id:"interno",name:"Ministero dell'Interno",url:"https://www.interno.gov.it/"},
 {id:"entrate",name:"Agenzia delle Entrate",url:"https://www.agenziaentrate.gov.it/"},
 {id:"ader",name:"Agenzia Entrate-Riscossione",url:"https://www.agenziaentrateriscossione.gov.it/"},
 {id:"send",name:"SEND",url:"https://notifichedigitali.pagopa.it/"}
];
export default async()=>{
 const store=getStore("official-updates"); let data;
 try{data=JSON.parse((await store.get("status.json"))||"null")}catch{}
 if(!data)data={checkedAt:null,sources:SAFE.map(x=>({...x,ok:false,changed:false,changedAt:null}))};
 data.sources=(data.sources||[]).map(({id,name,url,ok,changed,changedAt})=>({id,name,url,ok,changed,changedAt}));
 return new Response(JSON.stringify(data),{headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
};