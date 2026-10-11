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
 links.innerHTML='<a href="/privacy.html">Privacy Policy</a><a href="/cookie-policy.html">Cookie Policy</a><button type="button" id="cafpc-reopen">Preferenze cookie</button>';
 foot.querySelectorAll('a').forEach(a=>{if(a.closest('#cafpc-legal-links'))return;if(/privacy|cookie/i.test(a.textContent))a.remove()});
 document.getElementById('cafpc-reopen').addEventListener('click',()=>showCookie(true));
}
const key='cafpc_cookie_consent_v3';
function read(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function save(optional){try{localStorage.setItem(key,JSON.stringify({necessary:true,functional:optional,date:new Date().toISOString()}))}catch(e){}document.querySelector('#cafpc-consent')?.remove();document.dispatchEvent(new CustomEvent('cafpc:cookie-preferences',{detail:{functional:optional}}))}
function showCookie(force=false){
 if(!force&&read())return;
 document.querySelector('#cafpc-consent')?.remove();
 const overlay=document.createElement('div');overlay.id='cafpc-consent';overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="cafpc-consent-title"><h2 id="cafpc-consent-title">La tua privacy è importante</h2><p>Utilizziamo cookie necessari al funzionamento del sito. Eventuali cookie facoltativi sono attivati solo con il tuo consenso. <a href="/privacy.html">Leggi la privacy</a></p><div class="cafpc-options" hidden><label><input type="checkbox" checked disabled> Cookie tecnici necessari</label><label><input id="cafpc-opt" type="checkbox"> Funzionalità facoltative</label><button id="cafpc-save" type="button">Salva preferenze</button></div><div class="cafpc-actions"><button id="cafpc-custom" type="button">Personalizza</button><button id="cafpc-decline" type="button">Continua senza accettare</button><button id="cafpc-accept" type="button">Accetta</button></div></section>';
 document.body.append(overlay);
 overlay.querySelector('#cafpc-custom').onclick=()=>{const p=overlay.querySelector('.cafpc-options');p.hidden=!p.hidden;p.querySelector('#cafpc-opt').checked=!!read()?.functional};
 overlay.querySelector('#cafpc-decline').onclick=()=>save(false);
 overlay.querySelector('#cafpc-accept').onclick=()=>save(true);
 overlay.querySelector('#cafpc-save').onclick=()=>save(overlay.querySelector('#cafpc-opt').checked);
 overlay.querySelector('#cafpc-custom').focus();
}
function careers(){
 if(!/lavora-con-noi\.html$/.test(path))return;
 if(document.querySelector('.lavora-choice-grid')){
  const links=document.querySelectorAll('.lavora-choice-grid a');
  const form=document.getElementById('cv-form');
  const select=form?.querySelector('select[name="tipo_candidatura"]');
  links.forEach((a,i)=>{
    a.setAttribute('href','#form-candidatura');
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
 const forms=[...document.querySelectorAll('form')];const form=forms.find(f=>f.querySelector('input[type=file]'))||forms[0];if(form){form.id='cafpc-career-form';section.querySelectorAll('[data-cafpc-choice]').forEach(a=>a.onclick=()=>{const sel=form.querySelector('select');if(sel){const choice=a.dataset.cafpcChoice;let option=[...sel.options].find(x=>/collabor|struttur/i.test(x.textContent));if(option)sel.value=option.value;}});
 }else{section.querySelectorAll('[data-cafpc-choice]').forEach(a=>a.href='mailto:molfetta@sindacatosilpa.it?subject=Collaborazione%20CAF%20Punto%20Cittadino')}
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
function init(){setupNav();setupFooter();careers();designPages();showCookie()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();