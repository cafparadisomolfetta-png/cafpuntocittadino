import { getStore } from "@netlify/blobs";

export default async ()=>{
  const store=getStore("official-updates");
  let data={checkedAt:null,sources:[],catalog:[]};
  try{
    data=JSON.parse((await store.get("state.json"))||'{"checkedAt":null,"sources":[],"catalog":[]}');
  }catch{}
  return new Response(JSON.stringify({
    checkedAt:data.checkedAt||null,
    sources:(data.sources||[]).map(({id,name,url,ok,changed,checked_at})=>({id,name,url,ok,changed,checked_at})),
    catalog:(data.catalog||[]).map(({key,title,summary,status,is_new,source_url,updated_at})=>({
      key,title,summary,status,is_new,source_url,updated_at
    }))
  }),{
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store"
    }
  });
};