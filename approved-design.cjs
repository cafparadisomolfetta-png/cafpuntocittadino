'use strict';
// Static design layer: real forms, IDs and authentication scripts remain in place.
const pages={
 'index.html':['home','ASSISTENZA ONLINE IN TUTTA ITALIA','Un solo punto,<br><em>tante soluzioni.</em>','Assistenza fiscale, previdenziale e per il lavoro in tutta Italia. Prenota una consulenza telefonica o un contatto WhatsApp e segui le tue pratiche dall’area personale.'],
 'caf.html':['caf','CAF E FISCALE','Più semplici i tuoi<br><em>adempimenti fiscali</em>','Consulenza e assistenza per privati, famiglie e imprese.'],
 'patronato.html':['patronato','PATRONATO / INPS','I tuoi diritti,<br><em>il nostro supporto</em>','Assistenza su pensioni, prestazioni previdenziali e servizi di welfare.'],
 'lavoro-sindacato.html':['lavoro','LAVORO / SINDACATO','Più tutela.<br><em>Più chiarezza.</em>','Contratti, buste paga, TFR, ferie, permessi e consulenza del lavoro.'],
 'area-aziende.html':['aziende','AREA AZIENDE','La tua attività,<br><em>il nostro impegno.</em>','Servizi e opportunità per imprese e strutture del territorio.'],
 'news-bonus.html':['news','NEWS E BONUS','Informazioni chiare.<br><em>Opportunità da conoscere.</em>','Notizie, guide e approfondimenti su fisco, famiglia, lavoro e previdenza.'],
 'servizi-online.html':['online','SERVIZI ONLINE','Più semplici.<br><em>Più vicini a te.</em>','Prenota un appuntamento, consulta le tue pratiche e accedi allo sportello personale.'],
 'lavora-con-noi.html':['lavora','LAVORA CON NOI','Costruiamo insieme<br><em>nuove opportunità.</em>','Hai una struttura oppure vuoi iniziare un percorso di collaborazione?']
};
function themeLink(html){return html.replace(/<\/head>/i,'<link rel="stylesheet" href="/approved-design.css">\n</head>');}
function approvedPublic(html,file){
 // Historical source pages retain their original content; the artifact uses the current public brand.
 html=html.replace(/CAF Punto Cittadino(?: Italia)?/g,'Punto Cittadino Italia').replace(/CAF PUNTO CITTADINO(?: ITALIA)?/g,'PUNTO CITTADINO ITALIA');
 const escape=value=>value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const options='<option value="">Seleziona il servizio</option>'+require('./netlify/functions/booking-services.js').groups.map(group=>'<optgroup label="'+escape(group.label)+'">'+group.services.map(service=>'<option>'+escape(service)+'</option>').join('')+'</optgroup>').join('');
 html=html.replace(/(<select\b[^>]*\bid="bkServizio"[^>]*>)[\s\S]*?(<\/select>)/g,(_match,start,end)=>start+options+end);
 html=html.replace(/(<select\b[^>]*\bid="bkModalita"[^>]*>)[\s\S]*?(<\/select>)/g,(_match,start,end)=>start+'<option value="Telefonico">Telefonico — ti chiamiamo noi</option><option value="WhatsApp">WhatsApp — ti contatta un operatore</option><option value="In sede">In presenza — su appuntamento</option>'+end+'<p class="cafpc-remote-note">Assistenza a distanza in tutta Italia. Per telefono o WhatsApp ti contatta un operatore al numero indicato, che per WhatsApp deve essere attivo sul servizio. La modalità riguarda l’appuntamento; eventuali firme, identificazione o adempimenti in presenza saranno concordati con l’operatore. Non inviare documenti personali in chat: usa l’area assistiti quando disponibile.</p>');
 // Public positioning only: preserve legal notices and private office assignments.
 if(pages[file]){
  const serviceData=JSON.stringify(require('./netlify/functions/booking-services.js').groups).replace(/</g,'\\u003c');
  html=html.replace(/<section class="screening" id="scopri">[\s\S]*?<\/section>/,'<section id="scopri" class="cafpc-services-showcase"><div id="cafpc-explorer"><h2>Servizi e percorsi guidati</h2><p>Per usare i percorsi guidati abilita JavaScript. Puoi anche <a href="/servizi-online.html#prenotazione-online">prenotare una consulenza</a>.</p></div><script type="application/json" id="cafpc-service-data">'+serviceData+'</script></section>');
  html=html.replace('</body>','<script src="/service-explorer.js" defer></script>\n</body>');
  // Plain outbound links: no embedded social widgets or third-party tracking scripts.
  html=html.replace('</body>','<nav class="cafpc-social-links" aria-label="I nostri profili social"><strong>Seguici sui social</strong><a href="https://www.facebook.com/caf.paradiso.molfetta" target="_blank" rel="noopener noreferrer">Facebook · Caf Paradiso</a><a href="https://www.instagram.com/cafpuntocittadino/" target="_blank" rel="noopener noreferrer">Instagram · @cafpuntocittadino</a><a href="https://www.tiktok.com/@cafpuntocittadino" target="_blank" rel="noopener noreferrer">TikTok · @cafpuntocittadino</a></nav>\n</body>');
  html=html.replace(/(<nav class="pro-nav">[\s\S]*?)(<\/nav>)/,'$1<a href="#scopri">Servizi e percorsi guidati</a>$2');
  html=html.replace(/<div class="pro-info"><i class="fa-solid fa-location-dot"><\/i><div>[\s\S]*?<\/div><\/div>/g,'<div class="pro-info"><i class="fa-solid fa-globe"></i><div><strong>Online in tutta Italia</strong><br>Telefono · WhatsApp · Area personale</div></div>');
  html=html.replace(/<div><strong>📍 Sede<\/strong><p>Via Paradiso 34 · Molfetta<\/p><\/div>/g,'<div><strong>Assistenza online</strong><p>In tutta Italia</p></div>');
  html=html.replace(/Via Paradiso 34 · Molfetta<br>/g,'Assistenza online in tutta Italia<br>');
  html=html.replace(/<section class="tariffe" id="tariffe">[\s\S]*?<\/section>/g,'<section class="tariffe" id="tariffe"><div class="container"><h2>Assistenza su misura, anche a distanza</h2><p>Descrivi la tua richiesta: un operatore ti indicherà il percorso e le condizioni del servizio prima della conferma.</p><a href="/servizi-online.html#prenotazione-online">Prenota una consulenza online</a></div></section>');
 }
 html=themeLink(html).replace(/<body\b([^>]*)>/i,'<body$1 data-cafpc-design="public">');
 const cfg=pages[file];if(!cfg)return html;
 const [style,label,heading,description]=cfg;
 html=html.replace('data-cafpc-design="public"','data-cafpc-design="public" data-cafpc-page="'+style+'"');
 html=html.replace(/<div class="pro-brand">[\s\S]*?<\/div>\s*<div class="pro-brand__sub">[\s\S]*?<\/div>\s*<div class="pro-brand__tag">[\s\S]*?<\/div>\s*<\/div>/,'<a class="cafpc-brand" href="/" aria-label="Punto Cittadino Italia, Home"><img src="/assets/caf-brand.svg" width="280" height="80" alt="Punto Cittadino Italia — Un solo punto, tante soluzioni"></a>');
 const primary=style==='lavora'?'/candidature/':'/servizi-online.html#prenotazione-online';
 const secondary=style==='home'?'/caf.html':style==='lavora'?'/candidature/':'#cafpc-servizi';
 const hero='<section class="cafpc-design-hero cafpc-design-hero--'+style+'"><div class="cafpc-hero-copy"><p class="cafpc-design-eyebrow">'+label+'</p><h1>'+heading+'</h1><p>'+description+'</p><div class="cafpc-hero-actions"><a href="'+primary+'">'+(style==='lavora'?'Proponi la tua candidatura':'Prenota appuntamento')+'</a><a href="'+secondary+'">'+(style==='lavora'?'Presenta la tua struttura':'Scopri i servizi →')+'</a></div></div><img class="cafpc-hero-photo" src="/assets/'+(style==='patronato'?'caf-previdenza.svg':'caf-consulenza.svg')+'" width="420" height="270" alt="'+(style==='patronato'?'Una persona durante una consulenza previdenziale':'Una consulente accoglie una persona allo sportello')+'"></section>';
 const home=style==='home'?'<section id="cafpc-home-services" class="cafpc-services-showcase"><h2>Come possiamo aiutarti?</h2><div class="cafpc-home-grid">'+[['CAF e Fiscale','Dichiarazioni, ISEE, assistenza fiscale.','/caf.html','▤'],['Patronato / INPS','Pensioni, prestazioni e tutele.','/patronato.html','♡'],['Lavoro / Sindacato','Diritti, contratti e consulenza.','/lavoro-sindacato.html','♧'],['Area Aziende','Servizi dedicati alle imprese.','/area-aziende.html','▥']].map(([name,desc,url,icon])=>'<a class="cafpc-home-card" href="'+url+'"><span class="cafpc-service-icon" aria-hidden="true">'+icon+'</span><strong>'+name+'</strong><span>'+desc+'</span><span aria-hidden="true">→</span></a>').join('')+'</div><div class="cafpc-home-panels"><article><h2>Prenota un appuntamento</h2><p>Scegli servizio, modalità e orario nell’agenda online.</p><a class="btn btn--primary" href="/servizi-online.html#prenotazione-online">Apri le prenotazioni →</a><p>Assistenza in tutta Italia · <a href="tel:0806455509">080 6455509</a></p></article><article><h2>Il tuo sportello personale</h2><p>Documenti PDF, stato delle pratiche e richieste di integrazione della sede.</p><a class="btn btn--primary" href="/assistiti/">Accedi all’area assistiti →</a><p><a href="/news-bonus.html">Leggi News e Bonus</a></p></article></div></section>':'';
 const about=style==='home'?'<section class="cafpc-services-showcase" aria-labelledby="cafpc-about-title"><h2 id="cafpc-about-title">Il nostro impegno</h2><div class="cafpc-home-panels"><article><h3>La nostra missione</h3><p>Semplificare le pratiche di cittadini, famiglie, lavoratori e imprese, offrendo assistenza fiscale, previdenziale e digitale con un supporto personale, accessibile online in tutta Italia.</p></article><article><h3>La nostra visione</h3><p>Diventare un punto di riferimento nazionale per l’assistenza digitale al cittadino, riconosciuto per chiarezza, affidabilità e vicinanza alle persone.</p></article></div></section>':'';
 let inserted=false;
 html=html.replace(/<nav class="pro-nav">[\s\S]*?<\/nav>/,nav=>{inserted=true;return nav+hero+home+about});
 if(!inserted)throw new Error('Public design navigation target missing: '+file);
 return html;
}
module.exports={approvedPublic,themeLink};
