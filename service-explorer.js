(()=>{'use strict';
const guideQuestions={
 bonus:[
 ['Qual è la tua situazione principale?',['Lavoratore dipendente','Autonomo / libero professionista','Disoccupato / in cerca di lavoro','Pensionato','Studente / altra situazione']],
 ['Qual è la tua fascia di età?',['Meno di 55 anni','Da 55 a 64 anni','65 anni o più','Preferisco parlarne con un operatore']],
 ['Hai figli nel tuo nucleo?',['No','Sì, almeno uno sotto i 3 anni','Sì, dai 3 anni in su','Preferisco parlarne con un operatore']],
 ['Hai un ISEE aggiornato?',['Sì','No','Non so / da verificare']],
 ['Quali esigenze vuoi approfondire?',['Perdita del lavoro','Infortunio o malattia professionale','Decesso di un familiare','Affitto o utenze','Scuola e libri di testo','Disabilità o assistenza a un familiare','Nessuna / non so']]
 ],
 pensioni:[
 ['Qual è il tuo obiettivo?',['Capire quando potrò andare in pensione','Controllare i contributi','Verificare una pensione che ricevo','Informazioni dopo il decesso di un familiare']],
 ['Qual è la tua fascia di età?',['Meno di 55 anni','Da 55 a 64 anni','65 anni o più','Non desidero indicarla']],
 ['Quanti anni di contributi risultano indicativamente?',['Meno di 20','Da 20 a 34','35 o più','Non so / devo controllare']],
 ['Dove hai lavorato o versato contributi?',['Una sola gestione italiana','Più gestioni italiane','Anche all’estero','Non so']],
 ['Vuoi approfondire una situazione particolare?',['Periodi contributivi mancanti','Lavoro precoce, gravoso o usurante','Disabilità o assistenza familiare','Nessuna / preferisco parlarne con un operatore']]
 ]
};
function serviceInfo(name){
 if(/ISEE|DSU/.test(name))return ['Preparazione della DSU e orientamento sull’attestazione adatta alla richiesta.','Composizione del nucleo, redditi e patrimoni del periodo richiesto, eventuale contratto di locazione.'];
 if(/730|redditi|Detrazioni/.test(name))return ['Assistenza per la dichiarazione e l’esame della documentazione fiscale.','Certificazioni dei redditi, precedente dichiarazione, spese e documenti relativi agli oneri da esaminare.'];
 if(/Succession|succession/.test(name))return ['Primo esame della successione e degli adempimenti collegati.','Dati del defunto e degli eredi, eventuale testamento, documentazione patrimoniale disponibile.'];
 if(/IMU|F24/.test(name))return ['Esame dei dati necessari per il calcolo o la compilazione dei modelli.','Dati catastali, quote e periodi di possesso, avvisi o precedenti versamenti pertinenti.'];
 if(/INAIL|infortun|professionale/i.test(name))return ['Orientamento per la tutela INAIL e valutazione della richiesta con un operatore.','Riferimenti del rapporto di lavoro, certificazioni e comunicazioni già ricevute. I documenti sanitari vanno trattati nell’area riservata.'];
 if(/pension|Pension|Contribut/.test(name))return ['Esame della posizione previdenziale e individuazione degli approfondimenti utili.','Estratto contributivo, eventuali provvedimenti pensionistici, periodi in altre gestioni o all’estero.'];
 if(/NASpI|DIS-COLL|disoccup/.test(name))return ['Primo orientamento sulla prestazione pertinente al rapporto di lavoro cessato.','Contratto e cessazione, eventuali comunicazioni e domande già presentate.'];
 if(/Invalid|invalid|104|Permessi|accompagnamento|inabilità/.test(name))return ['Orientamento sulle richieste e sulle tutele da esaminare con il patronato.','Provvedimenti già disponibili ed eventuali riferimenti delle domande. Evita di inserire dati sanitari nei questionari pubblici.'];
 if(/affitto|locaz|Contratti/.test(name))return ['Assistenza sugli adempimenti collegati al contratto e alla tua esigenza.','Contratto, documenti relativi all’immobile e comunicazioni già ricevute, se pertinenti.'];
 if(/Assegno|Bonus|bonus|Libri|Matern|conged/.test(name))return ['Orientamento sulla prestazione o sull’avviso da verificare per la tua situazione.','ISEE quando richiesto, informazioni sul nucleo ed eventuali ricevute o precedenti domande pertinenti.'];
 if(/lavoro|paga|TFR|Colf|badanti|Dimission|Contratt|Vertenz/i.test(name))return ['Primo esame del rapporto di lavoro e dei documenti pertinenti alla richiesta.','Contratto, buste paga e comunicazioni relative al problema da esaminare.'];
 return ['Primo contatto per chiarire la richiesta e concordare il percorso con un operatore.','Una breve descrizione dell’esigenza e gli eventuali riferimenti già disponibili.'];
}
function guidedRoutes(kind,answers){
 const out=[];const add=(name,why)=>{if(!out.some(x=>x.name===name))out.push({name,why})};
 if(kind==='bonus'){
  if(answers[3]!==0)add('ISEE / DSU (ordinario, corrente, universitario)','Hai indicato un ISEE assente o da verificare: puoi iniziare dalla DSU.');
  if([1,2].includes(answers[2]))add('Assegno unico','Hai indicato figli nel nucleo: è utile approfondire le prestazioni familiari.');
  if(answers[2]===1)add('Bonus nido e contributi per la famiglia','Hai indicato almeno un figlio sotto i tre anni.');
  const extra=answers[4]||[];
  if(answers[0]===2||extra.includes(0)){add('NASpI / DIS-COLL e disoccupazione agricola','Hai indicato disoccupazione o perdita del lavoro: occorre distinguere il precedente rapporto.');add('Assegno di inclusione e sostegno al reddito','Puoi chiedere un esame delle misure di sostegno e dei relativi requisiti.');}
  if(extra.includes(1))add('INAIL: infortunio sul lavoro','Hai indicato un’esigenza INAIL: l’operatore distingue infortunio e malattia professionale.');
  if(extra.includes(2)){add('Successioni e volture catastali','Hai indicato il decesso di un familiare.');add('Pensione di reversibilità','È utile valutare separatamente eventuali prestazioni ai superstiti.');}
  if(extra.includes(3))add('Contratti di affitto (registrazione, proroga, risoluzione)','Hai selezionato affitto o utenze: puoi chiarire il tipo di esigenza con un operatore.');
  if(extra.includes(4))add('Libri di testo, scuola e agevolazioni comunali','Le opportunità dipendono dall’avviso e dal Comune di residenza.');
  if(extra.includes(5))add('Invalidità civile, accompagnamento e Legge 104','Hai indicato un’esigenza di assistenza familiare: gli approfondimenti si svolgono in privato.');
  add('Bonus sociali e agevolazioni sulle utenze','Da esaminare in base alla situazione del nucleo e ai requisiti applicabili.');
  if(answers[0]===3||answers[1]===2)add('Pensioni (domanda e consulenza)','Puoi richiedere un approfondimento previdenziale personale.');
 }else{
  if(answers[0]===3)add('Pensione di reversibilità','Hai indicato un decesso: il primo confronto riguarda le prestazioni ai superstiti.');
  else if(answers[0]===2)add('Pensioni (domanda e consulenza)','Hai già una pensione: porta il provvedimento per chiarire la verifica richiesta.');
  else add('Contributi e simulazione pensionistica','La prima verifica parte dalla posizione contributiva effettiva.');
  if(answers[2]===3||answers[4]===0)add('Contributi e simulazione pensionistica','Hai indicato contributi da ricostruire o periodi mancanti.');
  if(answers[3]===1)add('Pensioni (domanda e consulenza)','Contributi in più gestioni: richiedi una valutazione del coordinamento dei periodi.');
  if(answers[3]===2)add('Altre pratiche INPS','Periodi all’estero: occorre approfondire Paesi, gestioni e periodi assicurativi.');
  if(answers[4]===1)add('Pensioni (domanda e consulenza)','Lavoro precoce, gravoso o usurante: serve un esame individuale delle attività e dei periodi.');
  if(answers[4]===2)add('Consulenza generale','Puoi approfondire con l’operatore l’eventuale rilevanza della situazione personale, senza dati sanitari nel test pubblico.');
 }
 return out;
}
if(typeof module==='object'&&module.exports){module.exports={guideQuestions,guidedRoutes,serviceInfo};return;}
const root=document.getElementById('cafpc-explorer'),data=document.getElementById('cafpc-service-data');
if(!root||!data)return;
let groups;try{groups=JSON.parse(data.textContent);}catch{return;}
const catalog=groups.flatMap(g=>g.services.map(name=>({name,group:g.label})));
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(label,key,value)=>'<button type="button" data-'+key+'="'+safe(value)+'">'+safe(label)+'</button>';
// Category identity stays stable in catalog, recommendations and detail views.
const appearance=label=>/INAIL/.test(label)?['inail','shield-halved']:/INPS/.test(label)?['previdenza','landmark']:/Famiglia/.test(label)?['famiglia','heart']:/Lavoro/.test(label)?['lavoro','users']:/Associazione/.test(label)?['associazione','id-card']:/Orientamento/.test(label)?['orientamento','compass']:['fiscale','calculator'];
const badge=label=>'<span class="cafpc-service-icon" aria-hidden="true"><i class="fa-solid fa-'+appearance(label)[1]+'"></i></span>';
function serviceCard(name,description){
 const group=catalog.find(x=>x.name===name).group;
 return '<article class="cafpc-catalog-card" data-cafpc-theme="'+appearance(group)[0]+'">'+badge(group)+'<p class="cafpc-card-category">'+safe(group)+'</p><h4>'+safe(name)+'</h4><p class="cafpc-card-description">'+safe(description)+'</p>'+btn('Scopri il servizio →','service',name)+'</article>';
}
const book=name=>'<a class="btn btn--primary" href="/servizi-online.html?servizio='+encodeURIComponent(name)+'#prenotazione-online">Prenota per questo servizio</a>';
let kind='bonus',step=0,done=false,answers={},detail=null,mode='catalog';
function render(){
 const nav='<div class="cafpc-explorer-actions">'+btn('Tutti i servizi','explore','catalog')+btn('Scopri i bonus','explore','bonus')+btn('Orientamento pensioni','explore','pensioni')+'</div>';
 let body='';
 if(mode==='detail'){
  const info=serviceInfo(detail.name);
  body='<header class="cafpc-service-heading" data-cafpc-theme="'+appearance(detail.group)[0]+'">'+badge(detail.group)+'<div><p class="cafpc-design-eyebrow">'+safe(detail.group)+'</p><h2>'+safe(detail.name)+'</h2></div></header><div class="cafpc-explorer-grid"><article><h3>Come ti aiutiamo</h3><p>'+safe(info[0])+'</p><p>Puoi iniziare online, da tutta Italia, per telefono o con un contatto WhatsApp.</p>'+book(detail.name)+'</article><article><h3>Da preparare per il primo confronto</h3><p>'+safe(info[1])+'</p><p>Elenco orientativo: l’operatore confermerà documenti, identificazione, firme ed eventuali passaggi in presenza.</p><a href="/assistiti/">Area assistiti per documenti PDF e stato delle pratiche</a></article></div>';
 }else if(mode==='guide'){
  const qs=guideQuestions[kind],heading=kind==='bonus'?'Bonus e agevolazioni':'Orientamento pensioni';
  if(done){body='<h2>'+heading+': servizi da approfondire</h2><p>Questo percorso orienta verso un servizio. Non attesta il diritto a una prestazione e non calcola importi o date di pensionamento.</p><div class="cafpc-explorer-grid">'+guidedRoutes(kind,answers).map(x=>serviceCard(x.name,x.why)).join('')+'</div><details><summary>Rivedi le risposte</summary>'+qs.map((q,i)=>'<p><strong>'+safe(q[0])+'</strong><br>'+safe((Array.isArray(answers[i])?answers[i].map(n=>q[1][n]):[q[1][answers[i]]]).join(', '))+'</p>').join('')+'</details>'+btn('Modifica risposte','back','yes')+btn('Ricomincia','restart',kind);
  }else{
   const q=qs[step],multi=kind==='bonus'&&step===4,selected=answers[step],ready=multi?Array.isArray(selected)&&selected.length>0:Number.isInteger(selected);
   body='<p class="cafpc-design-eyebrow">'+heading+' · Domanda '+(step+1)+' di '+qs.length+'</p><h2>'+safe(q[0])+'</h2>'+(multi?'<p>Puoi selezionare più esigenze.</p>':'')+'<div class="cafpc-explorer-options">'+q[1].map((label,i)=>'<button type="button" data-answer="'+i+'" aria-pressed="'+(multi?(selected||[]).includes(i):selected===i)+'">'+safe(label)+'</button>').join('')+'</div><div class="cafpc-explorer-actions">'+(step?btn('Indietro','back','yes'):'')+'<button type="button" data-next="yes" '+(!ready?'disabled':'')+'>'+(step===qs.length-1?'Mostra i servizi consigliati':'Avanti')+'</button></div>';
  }
  body+='<p class="cafpc-explorer-note">Le risposte restano in questa pagina e si cancellano ricaricandola. Non inserire dati identificativi o documenti sanitari.</p>';
 }else{
  body='<h2>Servizi e percorsi guidati</h2><p>Apri una scheda oppure rispondi alle domande per individuare il servizio da approfondire. Assistenza online in tutta Italia.</p>'+groups.map(g=>'<section><h3>'+safe(g.label)+'</h3><div class="cafpc-explorer-grid">'+g.services.map(name=>serviceCard(name,serviceInfo(name)[0])).join('')+'</div></section>').join('');
 }
 root.innerHTML=nav+'<div class="cafpc-explorer-content" aria-live="polite">'+body+'</div>';
}
function selectMode(value){if(!['catalog','bonus','pensioni'].includes(value))return;mode=value==='catalog'?'catalog':'guide';if(mode==='guide'){kind=value;step=0;done=false;answers={};}render();}
root.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||!root.contains(b))return;
 if(b.dataset.explore){selectMode(b.dataset.explore);return;}
 if(b.dataset.service){detail=catalog.find(x=>x.name===b.dataset.service);if(detail){mode='detail';render();}return;}
 if(mode!=='guide')return;
 if(b.dataset.restart){selectMode(kind);return;}
 if(b.dataset.back){if(done)done=false;else step=Math.max(0,step-1);render();return;}
 if(b.dataset.answer!==undefined){const i=Number(b.dataset.answer),opts=guideQuestions[kind][step][1];if(!Number.isInteger(i)||i<0||i>=opts.length)return;
  if(kind==='bonus'&&step===4){let v=answers[step]||[];v=i===opts.length-1?[i]:v.filter(n=>n!==opts.length-1);if(i!==opts.length-1)v=v.includes(i)?v.filter(n=>n!==i):[...v,i];answers[step]=v;}else answers[step]=i;render();return;}
 if(b.dataset.next){const a=answers[step];if(a===undefined||(Array.isArray(a)&&!a.length))return;if(step===guideQuestions[kind].length-1)done=true;else step++;render();}
});
// Only accept a known, non-personal service name from a public link. Do not store answers or names.
const selected=new URLSearchParams(location.search).get('servizio'),select=document.getElementById('bkServizio');
function applySelectedService(){if(selected&&catalog.some(x=>x.name===selected)&&select){select.value=selected;select.dispatchEvent(new Event('change',{bubbles:true}));}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applySelectedService);else applySelectedService();
render();
})();
