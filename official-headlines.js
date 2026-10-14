/* Public headlines only: no personal data, tracking or AI requests. */
(()=>{
 'use strict';
 if(location.pathname!=='/news-bonus.html')return;
 async function load(){
  const target=document.querySelector('main')||document.querySelector('.cafpc-design-hero')?.parentElement||document.body;
  if(document.getElementById('cafpc-official-headlines'))return;
  const section=document.createElement('section');section.id='cafpc-official-headlines';section.className='cafpc-services-showcase';
  const heading=document.createElement('h2');heading.textContent='Notizie dalle fonti ufficiali';section.appendChild(heading);
  const status=document.createElement('p');status.setAttribute('aria-live','polite');status.textContent='Verifica degli aggiornamenti disponibili…';section.appendChild(status);target.appendChild(section);
  try{
   const r=await fetch('/.netlify/functions/official-updates',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();
   const sources=Array.isArray(data.headlineSources)?data.headlineSources:[],now=Date.now();
   const fresh=sources.filter(s=>s.ok&&Number.isFinite(Date.parse(s.checked_at))&&now-Date.parse(s.checked_at)>=0&&now-Date.parse(s.checked_at)<48*3600000);
   const allowed=new Set(fresh.map(s=>s.source));
   const items=(Array.isArray(data.headlines)?data.headlines:[]).filter(item=>allowed.has(item.source)).slice(0,40);
   const list=document.createElement('div');list.className='cafpc-headline-list';let shown=0;
   for(const item of items){
    let url;try{url=new URL(item.source_url)}catch{continue;}
    if(url.protocol!=='https:'||url.username||url.password||url.port||!['www.inps.it','www.inail.it'].includes(url.hostname)||typeof item.title!=='string'||!item.title||item.title.length>240||!Number.isFinite(Date.parse(item.published_at)))continue;
    if(now-Date.parse(item.published_at)>30*86400000||Date.parse(item.published_at)>now)continue;
    const article=document.createElement('article'),link=document.createElement('a'),meta=document.createElement('p');
    link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.title;
    meta.textContent=item.source+' · '+new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',dateStyle:'medium'}).format(new Date(item.published_at));
    article.appendChild(link);article.appendChild(meta);list.appendChild(article);shown++;
   }
   status.textContent=shown?'Titoli delle ultime notizie INPS e INAIL. Apri la fonte per il testo completo e le condizioni aggiornate.':'Nessuna notizia recente disponibile dalle fonti controllate.';
   if(sources.some(s=>!s.ok)||fresh.length!==sources.length){const notice=document.createElement('p');notice.textContent='Una o più fonti non sono aggiornate o disponibili. Consulta direttamente il sito istituzionale.';section.appendChild(notice);}
   section.appendChild(list);
  }catch{status.textContent='Aggiornamenti temporaneamente non disponibili. Consulta direttamente INPS e INAIL.';}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
