import guidance from "../../assistant-guidance.cjs";
const ALLOWED_ROLES = new Set(["user","assistant"]);

const {INSTRUCTIONS,WRITTEN_CONTACT_ERROR}=guidance;

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      "x-content-type-options":"nosniff"
    }
  });
}

function cleanHistory(history){
  if(!Array.isArray(history)) return [];
  return history.slice(-8).flatMap(item=>{
    if(!item || !ALLOWED_ROLES.has(item.role) || typeof item.content!=="string") return [];
    const text=item.content.trim().slice(0,1200);
    return text ? [{role:item.role,content:text}] : [];
  });
}

function extractText(data){
  if(typeof data?.output_text==="string" && data.output_text.trim()) return data.output_text.trim();
  for(const item of (data?.output||[])){
    if(item?.type!=="message") continue;
    for(const c of (item.content||[])){
      if(c?.type==="output_text" && typeof c.text==="string" && c.text.trim()) return c.text.trim();
    }
  }
  return "";
}

export default async (req) => {
  if(req.method!=="POST") return json({error:"Metodo non consentito."},405);
  if(!process.env.OPENAI_API_KEY) return json({error:WRITTEN_CONTACT_ERROR},503);

  let payload;
  try{ payload=await req.json(); }catch{ return json({error:"Richiesta non valida."},400); }

  const message=typeof payload?.message==="string" ? payload.message.trim() : "";
  if(!message) return json({error:"Scrivi una domanda."},400);
  if(message.length>1200) return json({error:"Il messaggio supera il limite consentito."},400);

  const history=cleanHistory(payload?.history);
  const input=history.length ? history : [{role:"user",content:message}];

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);

  try{
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      signal:controller.signal,
      headers:{
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-6-luna",
        instructions:INSTRUCTIONS,
        input,
        max_output_tokens:500,
        store:false
      })
    });

    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      console.error("OpenAI response error",r.status,data?.error?.type||"",data?.error?.code||"");
      if(r.status===429) return json({error:"La Segretaria AI è molto richiesta. Riprova tra poco."},429);
      if(r.status===401 || r.status===403) return json({error:"Configurazione AI da verificare."},503);
      return json({error:"Segretaria AI momentaneamente non disponibile."},502);
    }

    const answer=extractText(data);
    if(!answer) return json({error:"Non è stato possibile generare una risposta."},502);
    return json({answer});
  }catch(e){
    if(e?.name==="AbortError") return json({error:"La risposta sta impiegando troppo tempo. Riprova."},504);
    console.error("Segretaria AI error",e?.message||e);
    return json({error:"Segretaria AI momentaneamente non disponibile."},502);
  }finally{
    clearTimeout(timer);
  }
};