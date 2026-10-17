(()=>{'use strict';
if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('/public-sw.js',{scope:'/'}).catch(()=>{});
const routes=[['Home','/'],['CAF e Fiscale','/caf.html'],['Patronato / INPS','/patronato.html'],['Lavoro / Sindacato','/lavoro-sindacato.html'],['Area Aziende','/area-aziende.html'],['News e Bonus','/news-bonus.html'],['Servizi online','/servizi-online.html'],['Lavora con noi','/lavora-con-noi.html']];
const path=location.pathname;
const same=(a,b)=>a.replace(/\s+/g,' ').trim().toLowerCase()===b.toLowerCase();
function setupNav(){
 const candidates=[...document.querySelectorAll('nav')];let nav=candidates.find(n=>n.classList.contains('pro-nav'))||candidates.find(n=>n.querySelectorAll('a').length>=3);
 if(!nav){nav=document.createElement('nav');nav.className='cafpc-page-nav';(document.querySelector('header')||document.body).append(nav)}
 nav.classList.add('cafpc-page-nav');
 nav.querySelectorAll('a').forEach(a=>{const t=a.textContent.trim();if(/^privacy$/i.test(t))a.remove();});
 routes.forEach(([label,url])=>{const anchors=[...nav.querySelectorAll('a')].filter(a=>same(a.textContent,label));let a=anchors[0];if(!a){a=document.createElement('a');a.textContent=label;nav.append(a)}a.href=url;if(url===path||(url==='/'&&path==='/index.html'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');anchors.slice(1).forEach(x=>x.remove());});
 // Redirect category links that used to scroll through the long single-page layout.
 const categoryIds={
  '#catalogo':'/caf.html','#isee':'/caf.html','#modello730':'/caf.html','#successioni':'/caf.html','#imu':'/caf.html','#f24':'/caf.html',
  '#naspi':'/patronato.html','#pensioni':'/patronato.html','#inail':'/patronato.html','#assegno-unico':'/patronato.html',
  '#dimissioni':'/lavoro-sindacato.html','#vertenze':'/lavoro-sindacato.html',
  '#area-aziende':'/area-aziende.html','#lavora-con-noi':'/lavora-con-noi.html',
  '#centro-aggiornamenti':'/news-bonus.html','#aggiornamenti-automatici':'/news-bonus.html',
  '#prenotazione-online':'/servizi-online.html#prenotazione-online'
 };
 document.querySelectorAll('a[href^="#"]').forEach(a=>{
  if(a.closest('nav,header') && categoryIds[a.getAttribute('href')]) a.href=categoryIds[a.getAttribute('href')];
 });
 // The original home navigation must not point to the Lavoro page for careers.
 nav.querySelectorAll('a').forEach(a=>{if(/lavora con noi/i.test(a.textContent))a.href='/lavora-con-noi.html'});
 // Make all sitewide navigation cards point to their own page.
 document.querySelectorAll('a').forEach(a=>{const txt=a.textContent.trim(); if(/^privacy$/i.test(txt)&&a.closest('nav'))a.remove();});
}
function setupFooter(){
 let foot=document.querySelector('footer');if(!foot){foot=document.createElement('footer');document.body.append(foot)}
 let links=document.getElementById('cafpc-legal-links');if(!links){links=document.createElement('div');links.id='cafpc-legal-links';foot.append(links)}
 links.innerHTML='<a href="/assistiti/">Area assistiti</a><a href="/privacy.html">Privacy Policy</a><a href="/cookie-policy.html">Cookie Policy</a><button type="button" id="cafpc-reopen">Preferenze cookie</button>';
 foot.querySelectorAll('a').forEach(a=>{if(a.closest('#cafpc-legal-links'))return;if(/privacy|cookie/i.test(a.textContent))a.remove()});
 document.getElementById('cafpc-reopen').addEventListener('click',()=>showCookie(true));
}
function showCookie(){
 if(window.CAFPCConsent) window.CAFPCConsent.open();
}
function careers(){
 if(!/lavora-con-noi\.html$/.test(path))return;
 if(document.querySelector('.lavora-choice-grid')){
  const links=document.querySelectorAll('.lavora-choice-grid a');
  const form=document.getElementById('cv-form');
  const select=form?.querySelector('select[name="tipo_candidatura"]');
  links.forEach((a,i)=>{
    a.setAttribute('href','/candidature/?tipo='+encodeURIComponent(i===0?'Ho già una struttura e voglio collaborare':'Voglio iniziare un percorso con voi'));
    a.addEventListener('click',()=>{
      if(select){
        select.value=i===0?'Ho già una struttura e voglio collaborare':'Voglio iniziare un percorso con voi';
        select.dispatchEvent(new Event('change',{bubbles:true}));
      }
    });
  });
  return;
 }
 const section=document.createElement('section');section.id='cafpc-career-choices';
 section.innerHTML='<h1>Lavora con noi</h1><p>Seleziona il percorso più adatto a te: entra nella nostra rete con una struttura esistente oppure proponi una nuova collaborazione.</p><div class="cafpc-career-grid"><article><h2>Hai già una struttura?</h2><p>Hai un ufficio, uno sportello o una struttura già operativa? Contattaci per valutare un possibile percorso di collaborazione, secondo i requisiti previsti.</p><a href="#cafpc-career-form" data-cafpc-choice="Struttura esistente">Presenta la tua struttura →</a></article><article><h2>Vuoi iniziare/collaborare con noi?</h2><p>Vuoi avviare un nuovo punto di riferimento, collaborare oppure proporti per un tirocinio? Raccontaci il tuo progetto.</p><a href="#cafpc-career-form" data-cafpc-choice="Nuova collaborazione">Proponi la tua candidatura →</a></article></div>';
 const target=document.querySelector('main')||document.body;target.insertBefore(section,target.firstChild);
 section.querySelectorAll('[data-cafpc-choice]').forEach(a=>a.href='/candidature/');
}

// Branded per-page introductory panels; existing service content and forms are retained.
function designPages(){
 const pages={
  '/caf.html':{eyebrow:'CAF E FISCALE',title:'Più semplici i tuoi <em>adempimenti fiscali</em>',desc:'Consulenza e assistenza per privati, famiglie e imprese: dichiarazioni, ISEE, IMU, successioni e servizi fiscali.',icon:'▤',style:'caf',link:'/servizi-online.html#prenotazione-online'},
  '/patronato.html':{eyebrow:'PATRONATO / INPS',title:'I tuoi diritti, <em>il nostro supporto</em>',desc:'Assistenza su pensioni, NASpI, invalidità civile, maternità, assegno unico e permessi Legge 104.',icon:'♡',style:'patronato',link:'/servizi-online.html#prenotazione-online'},
  '/lavoro-sindacato.html':{eyebrow:'LAVORO / SINDACATO',title:'Lavoro e sindacato, <em>sempre al tuo fianco</em>',desc:'Contratti, buste paga, TFR, ferie, permessi, vertenze, dimissioni e consulenza del lavoro.',icon:'⚖',style:'lavoro',link:'/servizi-online.html#prenotazione-online'},
  '/area-aziende.html':{eyebrow:'AREA AZIENDE',title:'La tua impresa, <em>un partner affidabile</em>',desc:'Servizi dedicati alle imprese, consulenza organizzativa, paghe, contributi e gestione del personale.',icon:'▥',style:'aziende',link:'/servizi-online.html#prenotazione-online'},
  '/news-bonus.html':{eyebrow:'NEWS E BONUS',title:'Informazione oggi, <em>opportunità domani</em>',desc:'Notizie, guide e approfondimenti su fisco, famiglia, lavoro e previdenza.',icon:'✦',style:'news',link:'/servizi-online.html'},
  '/servizi-online.html':{eyebrow:'SERVIZI ONLINE',title:'Più servizi, <em>più tempo per te</em>',desc:'Prenota appuntamenti, accedi alle informazioni e utilizza i servizi digitali disponibili.',icon:'✉',style:'online',link:'#prenotazione-online'},
  '/lavora-con-noi.html':{eyebrow:'LAVORA CON NOI',title:'Costruiamo insieme <em>nuove opportunità</em>',desc:'Hai già una struttura oppure vuoi iniziare un percorso di collaborazione? Scopri come proporti.',icon:'♧',style:'lavora',link:'#form-candidatura'}
 };
 const cfg=pages[path];if(!cfg||document.querySelector('.cafpc-design-hero'))return;
 const main=document.querySelector('main');if(!main)return;
 const panel=document.createElement('section');panel.className='cafpc-design-hero cafpc-design-hero--'+cfg.style;
 const copy=document.createElement('div');
 const eyebrow=document.createElement('p');eyebrow.className='cafpc-design-eyebrow';eyebrow.textContent=cfg.eyebrow;
 const heading=document.createElement('h1');heading.innerHTML=cfg.title;
 const description=document.createElement('p');description.textContent=cfg.desc;
 const actions=document.createElement('div');actions.className='cafpc-hero-actions';
 const primary=document.createElement('a');primary.href=cfg.link;primary.textContent=cfg.style==='lavora'?'Invia candidatura':cfg.style==='news'?'Scopri i servizi':'Prenota un appuntamento';
 const secondary=document.createElement('a');secondary.href='#cafpc-servizi';secondary.textContent='Scopri i servizi ↓';
 actions.append(primary,secondary);copy.append(eyebrow,heading,description,actions);
 const graphic=document.createElement('div');graphic.className='cafpc-hero-mark';graphic.setAttribute('aria-hidden','true');graphic.textContent=cfg.icon;
 panel.append(copy,graphic);main.prepend(panel);
 // Anchor the original content after the new intro; existing forms and links are untouched.
 let next=panel.nextElementSibling;if(next&&!document.getElementById('cafpc-servizi'))next.id='cafpc-servizi';
}

function serviceCards(){
 const catalog={
 '/caf.html':[['730','Dichiarazione dei redditi'],['ISEE','Indicatore della situazione economica'],['IMU','Calcolo e assistenza'],['Successioni','Pratiche e volture catastali'],['F24','Modelli e tributi'],['Detrazioni','Agevolazioni fiscali']],
 '/patronato.html':[['Pensioni','Consulenza previdenziale'],['NASpI','Disoccupazione'],['Invalidità civile','Assistenza alla domanda'],['Assegno unico','Prestazioni per figli'],['Maternità','Congedi e prestazioni'],['Permessi 104','Assistenza ai familiari']],
 '/lavoro-sindacato.html':[['Contratti','Consulenza contrattuale'],['Buste paga','Lettura e verifica'],['TFR','Verifica competenze'],['Ferie e permessi','Controllo spettanze'],['Vertenze','Tutela del lavoro'],['Dimissioni','Assistenza alla procedura']],
 '/area-aziende.html':[['Consulenza aziende','Supporto organizzativo'],['Paghe e contributi','Elaborazioni e adempimenti'],['Assunzioni','Contratti e procedure'],['Pratiche INPS','Gestione previdenziale'],['Supporto HR','Gestione personale'],['Sportello imprese','Assistenza dedicata']]
 };
 const services=catalog[path];if(!services)return;
 const main=document.querySelector('main')||document.body,hero=main.querySelector('.cafpc-design-hero');if(!hero||main.querySelector('.cafpc-services-showcase'))return;
 const section=document.createElement('section');section.className='cafpc-services-showcase';section.id='cafpc-servizi';
 const h=document.createElement('h2');h.textContent='I nostri servizi';section.append(h);
 const grid=document.createElement('div');grid.className='cafpc-services-grid';
 services.forEach(([name,desc],i)=>{
  const article=document.createElement('article');article.className='cafpc-service-card';article.dataset.cafpcTheme=({'/caf.html':'fiscale','/patronato.html':'previdenza','/lavoro-sindacato.html':'lavoro','/area-aziende.html':'aziende'})[path];
  const badge=document.createElement('span');badge.className='cafpc-service-icon';badge.setAttribute('aria-hidden','true');const icon=document.createElement('i');icon.className='fa-solid fa-'+({'/caf.html':'calculator','/patronato.html':'landmark','/lavoro-sindacato.html':'users','/area-aziende.html':'building'})[path];badge.append(icon);
  const title=document.createElement('h3');title.textContent=name;
  const info=document.createElement('p');info.textContent=desc;
  const a=document.createElement('a');a.href='/servizi-online.html#prenotazione-online';a.textContent='Richiedi informazioni →';a.setAttribute('aria-label','Richiedi informazioni: '+name);
  article.append(badge,title,info,a);grid.append(article);
 });
 section.append(grid);hero.insertAdjacentElement('afterend',section);
}

function featureNavigation(){
 const catalog={
 '/news-bonus.html':[
  ['Fisco','Guide e aggiornamenti fiscali','/caf.html'],
  ['Famiglia','Prestazioni e agevolazioni familiari','/patronato.html'],
  ['Lavoro','Novità e informazioni sul lavoro','/lavoro-sindacato.html'],
  ['Previdenza','Pensioni e prestazioni INPS','/patronato.html']],
 '/servizi-online.html':[
  ['Prenota appuntamento','Scegli il servizio e consulta la disponibilità','#prenotazione-online'],
  ['Disdici appuntamento','Utilizza il tuo codice di disdetta','#disdetta-appuntamento'],
  ['CAF e Fiscale','Scopri le prestazioni fiscali','/caf.html'],
  ['Patronato / INPS','Informazioni sui servizi previdenziali','/patronato.html']],
 '/lavora-con-noi.html':[
  ['Hai già una struttura?','Proponi la tua struttura per una collaborazione','#form-candidatura'],
  ['Vuoi iniziare con noi?','Presenta la tua candidatura','#form-candidatura']]
 };
 const items=catalog[path];if(!items)return;
 const hero=document.querySelector('.cafpc-design-hero'),main=document.querySelector('main')||document.body;
 if(!hero||!main||main.querySelector('.cafpc-feature-nav'))return;
 const section=document.createElement('section');section.className='cafpc-feature-nav';section.id='cafpc-servizi';
 const title=document.createElement('h2');title.textContent=path.includes('news-')?'Esplora gli argomenti':path.includes('lavora')?'Scegli il tuo percorso':'Come possiamo aiutarti?';
 const grid=document.createElement('div');grid.className='cafpc-feature-grid';
 items.forEach(([label,desc,href],i)=>{
  const a=document.createElement('a');a.className='cafpc-feature-card';a.href=href;
  const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.className='cafpc-feature-symbol';icon.textContent=['✦','♡','▣','◈'][i%4];
  const heading=document.createElement('strong');heading.textContent=label;
  const copy=document.createElement('small');copy.textContent=desc;
  const arrow=document.createElement('span');arrow.className='cafpc-feature-arrow';arrow.textContent='→';
  a.append(icon,heading,copy,arrow);grid.append(a);
 });
 section.append(title,grid);hero.insertAdjacentElement('afterend',section);
 // Never manufacture working links to forms that are not available.
 for(const a of section.querySelectorAll('a[href^="#"]')){
  const target=document.getElementById(a.getAttribute('href').slice(1));
  if(!target){
   const targetFallback=a.href.endsWith('#form-candidatura')?document.querySelector('#cv-form'):null;
   if(targetFallback)a.href='#cv-form';
   else {a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.title='Funzione in preparazione';}
  }
 }
}

// Resolve on-page navigation against actual form controls, without claiming unsupported features.
function repairPageLinks(){
 const landing='/servizi-online.html';
 // The destination page always exists; its optional booking/disdetta anchors might not.
 // Never send visitors to a hash target that has not been found in the DOM.
 if(path!==landing)return;
 const links=[...document.querySelectorAll('.cafpc-design-hero a,.cafpc-feature-nav a,.cafpc-services-showcase a')];
 const forms=[...document.querySelectorAll('form')];
 const descriptor=f=>[f.id,f.getAttribute('name'),f.getAttribute('action'),
   ...[...f.querySelectorAll('input,select,button')].map(x=>[x.id,x.name,x.textContent].join(' '))].join(' ');
 const booking=forms.find(f=>/prenot|booking|calendar/i.test(descriptor(f)));
 const cancel=forms.find(f=>/disdett|annull|cancel|codice.disdetta/i.test(descriptor(f)));
 for(const a of links){
  const href=a.getAttribute('href');if(!href||!href.startsWith('#'))continue;
  const id=href.slice(1);if(document.getElementById(id))continue;
  const target=/prenot/i.test(id)?booking:/disdett/i.test(id)?cancel:null;
  if(target){
   if(!target.id)target.id='cafpc-target-'+(/prenot/i.test(id)?'booking':'cancel');
   a.href='#'+target.id;a.removeAttribute('aria-disabled');a.removeAttribute('title');
  }else{
   a.removeAttribute('href');a.setAttribute('aria-disabled','true');
   a.title='Funzione non disponibile in questa pagina';
  }
 }
}
function safeCrossPageBookingLinks(){
 // Preserve access to the services page if a form is temporarily unavailable.
 if(path==='/servizi-online.html')return;
 document.querySelectorAll('.cafpc-design-hero a[href="/servizi-online.html#prenotazione-online"],.cafpc-services-showcase a[href="/servizi-online.html#prenotazione-online"]').forEach(a=>{
  a.href='/servizi-online.html';
  a.title='Apri Servizi online e verifica le modalità disponibili';
 });
}
function init(){setupNav();setupFooter();careers();designPages();serviceCards();featureNavigation();repairPageLinks();safeCrossPageBookingLinks()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
