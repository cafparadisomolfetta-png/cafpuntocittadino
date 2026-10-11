(()=>{'use strict';
const $=id=>document.getElementById(id);let credential=null;
const status=$('status'),panel=$('agenda-panel');
function info(text){status.textContent=text}
function clear(){credential=null;panel.hidden=true;$('results').replaceChildren();$('login-button').hidden=false;}
async function configure(){
 try{
  const r=await fetch('/.netlify/functions/gestionale-session',{cache:'no-store'});
  if(!r.ok)throw Error('Il login non è ancora configurato.');
  const cfg=await r.json();if(!cfg.clientId)throw Error('Client ID mancante');
  if(!window.google?.accounts?.id)throw Error('Il servizio Google Login non è disponibile.');
  google.accounts.id.initialize({client_id:cfg.clientId,callback:async({credential:jwt})=>{
   credential=jwt;info('Verifica dei permessi…');await load(true);
  },auto_select:false});
  google.accounts.id.renderButton($('login-button'),{theme:'outline',size:'large',text:'signin_with',width:250});
  info('Accedi con il tuo account Google abilitato dalla direzione.');
 }catch(e){info(e.message||'Login non disponibile.')}
}
async function load(identity=false){
 if(!credential)return info('Effettua l’accesso prima di aprire l’agenda.');
 const site=$('site'),day=$('day');
 const selected=site.value||'molfetta'; // The server never trusts this selection.
 const date=day.value||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 day.value=date;
 info('Caricamento agenda…');
 try{
  const url='/.netlify/functions/gestionale-agenda?'+new URLSearchParams({site:selected,date});
  const r=await fetch(url,{headers:{Authorization:'Bearer '+credential},cache:'no-store'});
  if(r.status===401||r.status===403){clear();throw Error('Accesso non autorizzato per questa sede. Contatta l’amministratrice.')}
  if(!r.ok)throw Error('Agenda non disponibile: verifica collegamento Google Calendar e autorizzazioni.');
  const data=await r.json();
  $('profile').textContent=data.email+' · '+data.role;
  if(identity){site.replaceChildren();for(const s of data.sites||[]){const o=document.createElement('option');o.value=s;o.textContent=s;site.append(o)}}
  panel.hidden=false;$('login-button').hidden=true;
  const container=$('results');container.replaceChildren();
  if(!data.appointments?.length){container.textContent='Nessun appuntamento per il giorno selezionato.'}
  for(const a of data.appointments||[]){
   const item=document.createElement('article');item.className='appointment';
   const t=document.createElement('strong');t.textContent=new Date(a.start).toLocaleTimeString('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'})+' · '+a.summary;
   const d=document.createElement('p');d.textContent=[a.category,a.mode].filter(Boolean).join(' — ');
   item.append(t,d);container.append(item);
  }
  info('Agenda caricata. I dati sono visibili solo ai profili autorizzati.');
 }catch(e){info(e.message||'Errore agenda')}
}
$('retry').addEventListener('click',configure);$('load').addEventListener('click',()=>load(false));
$('logout').addEventListener('click',()=>{clear();google?.accounts?.id?.disableAutoSelect();info('Accesso terminato.');});
window.addEventListener('load',configure);
})();