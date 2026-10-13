(()=>{'use strict';
const $=id=>document.getElementById(id);let credential=null,session=0,loadID=0;
const status=$('status'),panel=$('agenda-panel');
function info(text){status.textContent=text}
function clear(){session++;loadID++;credential=null;panel.hidden=true;$('results').replaceChildren();$('login-button').hidden=false;$('profile').textContent='';$('site').replaceChildren();}
async function configure(){
 try{
  const r=await fetch('/.netlify/functions/gestionale-session',{cache:'no-store'});
  if(!r.ok)throw Error('Il login non è ancora configurato.');
  const cfg=await r.json();if(!cfg.clientId)throw Error('Client ID mancante');
  if(!window.google?.accounts?.id)throw Error('Il servizio Google Login non è disponibile.');
  google.accounts.id.initialize({client_id:cfg.clientId,callback:async({credential:jwt})=>{
   session++;credential=jwt;info('Verifica dei permessi…');await load(true);
  },auto_select:false});
  google.accounts.id.renderButton($('login-button'),{theme:'outline',size:'large',text:'signin_with',width:250});
  info('Accedi con il tuo account Google abilitato dalla direzione.');
 }catch(e){info(e.message||'Login non disponibile.')}
}
async function load(identity=false){
 if(!credential)return info('Effettua l’accesso prima di aprire l’agenda.');
 const original=session,request=++loadID;const site=$('site'),day=$('day');
 const selected=site.value||''; // The server never trusts this selection.
 const date=day.value||(()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=k=>p.find(x=>x.type===k)?.value;return [v('year'),v('month'),v('day')].join('-')})();
 day.value=date;
 info('Caricamento agenda…');
 try{
  const url='/.netlify/functions/gestionale-agenda?'+new URLSearchParams({site:selected,date});
  const r=await fetch(url,{headers:{Authorization:'Bearer '+credential},cache:'no-store'});
  if(r.status===401||r.status===403){clear();throw Error('Accesso non autorizzato per questa sede. Contatta l’amministratrice.')}
  if(!r.ok)throw Error('Agenda non disponibile: verifica collegamento Google Calendar e autorizzazioni.');
  const data=await r.json();if(original!==session||request!==loadID)return;
  $('profile').textContent=data.email+' · '+data.role;
  if(identity){site.replaceChildren();for(const s of data.sites||[]){const o=document.createElement('option');o.value=s;o.textContent=s;site.append(o)}}
  panel.hidden=false;$('login-button').hidden=true;
  const container=$('results');container.replaceChildren();
  if(!data.appointments?.length){container.textContent='Nessun appuntamento per il giorno selezionato.'}
  for(const a of data.appointments||[]){
   const item=document.createElement('article');item.className='appointment';
   const t=document.createElement('strong');t.textContent=new Date(a.start).toLocaleTimeString('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'})+' · '+a.summary;
   const d=document.createElement('p');d.textContent=[a.category,a.mode].filter(Boolean).join(' — ');
   item.append(t,d);
   if(a.editable&&a.etag){
    const form=document.createElement('form'),newDate=document.createElement('input'),newTime=document.createElement('input'),move=document.createElement('button'),cancel=document.createElement('button');
    newDate.type='date';newDate.required=true;newDate.value=date;newDate.setAttribute('aria-label','Nuova data appuntamento');newTime.type='time';newTime.required=true;newTime.value=new Date(a.start).toLocaleTimeString('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'});newTime.setAttribute('aria-label','Nuovo orario appuntamento');move.type='submit';move.textContent='Sposta appuntamento';cancel.type='button';cancel.textContent='Annulla appuntamento';
    const mutate=async(method,values)=>{move.disabled=true;cancel.disabled=true;try{const result=await fetch('/api/appointments/'+encodeURIComponent(a.id),{method,headers:{Authorization:'Bearer '+credential,'X-CAF-Area':'staff','Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({site:data.site,etag:a.etag,...values})});const response=await result.json();if(original!==session)return;if(!result.ok)throw Error(response.error==='APPOINTMENT_VERSION_CONFLICT'?'Appuntamento aggiornato da un altro operatore. Ricarica l’agenda.':'Operazione non completata: ricarica l’agenda prima di riprovare.');await load(false);info((method==='DELETE'?'Appuntamento annullato.':response.moved===false?'Appuntamento già previsto nell’orario indicato.':'Appuntamento spostato.')+(response.notificationQueued?' Notifica inserita nella coda di invio.':' Informa l’assistito della variazione.'));}catch(e){if(original===session)info(e.message)}finally{move.disabled=false;cancel.disabled=false}};
    form.onsubmit=event=>{event.preventDefault();mutate('POST',{date:newDate.value,time:newTime.value})};cancel.onclick=()=>{if(window.confirm('Annullare definitivamente questo appuntamento?'))mutate('DELETE',{})};if(a.moveable!==false)form.append(newDate,newTime,move);form.append(cancel);item.append(form);
   }
   container.append(item);
  }
  // Load cancelled appointments independently, so a history outage cannot hide live appointments.
  const historyContainer=document.createElement('section');
  const heading=document.createElement('h3');heading.textContent='Disdette del giorno';
  historyContainer.append(heading);container.append(historyContainer);
  try{
   const response=await fetch('/.netlify/functions/gestionale-disdette?'+new URLSearchParams({site:data.site,date}),{headers:{Authorization:'Bearer '+credential},cache:'no-store'});
   if(!response.ok)throw Error('Storico temporaneamente non disponibile');
   const cancellations=await response.json();if(original!==session||request!==loadID)return;
   if(!cancellations.history?.length){const empty=document.createElement('p');empty.textContent='Nessuna disdetta registrata per il giorno selezionato.';historyContainer.append(empty)}
   for(const item of cancellations.history||[]){
    const card=document.createElement('article');card.className='appointment appointment-cancelled';
    const title=document.createElement('strong');title.textContent='DISDETTO · '+item.summary;
    const detail=document.createElement('p');detail.textContent='Appuntamento: '+new Date(item.start).toLocaleString('it-IT',{timeZone:'Europe/Rome'})+' · Annullato: '+new Date(item.cancelledAt).toLocaleString('it-IT',{timeZone:'Europe/Rome'});
    card.append(title,detail);historyContainer.append(card);
   }
  }catch{
   const warning=document.createElement('p');warning.textContent='Storico disdette non disponibile: gli appuntamenti attivi sono comunque aggiornati.';historyContainer.append(warning);
  }
  info('Agenda caricata. I dati sono visibili solo ai profili autorizzati.');
 }catch(e){if(original===session&&request===loadID)info(e.message||'Errore agenda')}
}
$('retry').addEventListener('click',configure);$('load').addEventListener('click',()=>load(false));
$('logout').addEventListener('click',()=>{clear();window.google?.accounts?.id?.disableAutoSelect();info('Accesso terminato.');});
window.addEventListener('load',configure);window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted)clear()});
// Periodic refresh only for a visible, authenticated dashboard.
let refreshing=false;
async function refreshSafely(){if(refreshing||document.hidden||!credential||panel.hidden)return;refreshing=true;try{await load(false)}finally{refreshing=false}}
setInterval(refreshSafely,60000);
// Refresh on foreground return; do not duplicate overlapping background requests.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSafely()});
})();