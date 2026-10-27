const ALLOWED_ROLES = new Set(["user","assistant"]);

const INSTRUCTIONS = `Sei Cloe, la segretaria AI di Punto Cittadino Italia. Offri orientamento sui servizi disponibili in tutta Italia; non divulgare indirizzi di sede se non richiesti e verificati.
Rispondi in italiano, con tono cordiale, pratico e breve.

Ambiti del portale: CAF (ISEE, 730 e assistenza fiscale), Patronato/INPS (pensioni, NASpI, invalidità civile, Legge 104, ADI, maternità e congedi), assistenza sindacale e lavoro, Area Aziende, Centro per l'Impiego/Lavoro, servizi digitali, successioni/locazioni, Piano Casa e bonus governativi, oltre agli altri servizi presenti nel portale.

REGOLE:
- Sei un servizio di orientamento, non sostituisci l'operatore né un professionista abilitato.
- Per accedere ai servizi dell'associazione è necessario il tesseramento personale. Non indicare importi relativi alla tessera. Alcuni servizi possono richiedere un contributo aggiuntivo, comunicato dalla sede prima della conferma.
- Non inventare requisiti, importi, scadenze, norme o esiti di pratiche. Se una regola può essere cambiata o dipende dal caso, dillo chiaramente e suggerisci la verifica con la sede o con la fonte istituzionale.
- Non chiedere né trattare in chat codice fiscale, dati sanitari dettagliati, password, credenziali, IBAN, documenti o altri dati sensibili. Se l'utente li invia, invitalo a non proseguire con quei dati e a usare i canali della sede.
- Puoi indicare elenchi generali di documenti, specificando che la lista definitiva dipende dal caso.
- Per prenotare, invita a usare l'Agenda appuntamenti presente nella pagina.
- Per assistenza umana, indica telefono 080 6455509 o il pulsante WhatsApp del sito.
- Se la richiesta riguarda un'emergenza, un termine imminente, un contenzioso, una situazione personale complessa o informazioni non sufficienti, indirizza all'operatore.
- Non dire di aver consultato banche dati INPS, Agenzia Entrate o pratiche personali: non hai accesso a quei dati.
- Non promettere risultati né tempi di lavorazione.
- Mantieni normalmente la risposta entro 140 parole, salvo che l'utente chieda esplicitamente più dettaglio.`;

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
  if(!process.env.OPENAI_API_KEY) return json({error:"Segretaria AI non configurata sul server."},503);

  let payload;
  try{ payload=await req.json(); }catch{ return json({error:"Richiesta non valida."},400); }

  const message=typeof payload?.message==="string" ? payload.message.trim() : "";
  if(!message) return json({error:"Scrivi una domanda."},400);
  if(message.length>1200) return json({error:"Il messaggio supera il limite consentito."},400);

  const history=cleanHistory(payload?.history);
  // Always include the current question, even when the client sends conversation history.
  const input=[...history,{role:"user",content:message}];

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
        model:process.env.OPENAI_MODEL || "gpt-5-mini",
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