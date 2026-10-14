'use strict';
// Static design layer: real forms, IDs and authentication scripts remain in place.
const pages={
 'index.html':['home','ASSISTENZA, CONSULENZA, OPPORTUNITÀ','Al tuo fianco,<br><em>ogni giorno</em>','Servizi fiscali, previdenziali e per il lavoro. Più semplici, più vicini, per persone e imprese.'],
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
 html=themeLink(html).replace(/<body\b([^>]*)>/i,'<body$1 data-cafpc-design="public">');
 const cfg=pages[file];if(!cfg)return html;
 const [style,label,heading,description]=cfg;
 html=html.replace('data-cafpc-design="public"','data-cafpc-design="public" data-cafpc-page="'+style+'"');
 html=html.replace(/<div class="pro-brand">[\s\S]*?<\/div>\s*<div class="pro-brand__sub">[\s\S]*?<\/div>\s*<div class="pro-brand__tag">[\s\S]*?<\/div>\s*<\/div>/,'<a class="cafpc-brand" href="/" aria-label="CAF Punto Cittadino, Home"><img src="/assets/caf-brand.svg" width="280" height="80" alt="CAF Punto Cittadino — Le persone al centro"></a>');
 const primary=style==='lavora'?'/candidature/':'/servizi-online.html#prenotazione-online';
 const secondary=style==='home'?'/caf.html':style==='lavora'?'/candidature/':'#cafpc-servizi';
 const hero='<section class="cafpc-design-hero cafpc-design-hero--'+style+'"><div class="cafpc-hero-copy"><p class="cafpc-design-eyebrow">'+label+'</p><h1>'+heading+'</h1><p>'+description+'</p><div class="cafpc-hero-actions"><a href="'+primary+'">'+(style==='lavora'?'Proponi la tua candidatura':'Prenota appuntamento')+'</a><a href="'+secondary+'">'+(style==='lavora'?'Presenta la tua struttura':'Scopri i servizi →')+'</a></div></div><img class="cafpc-hero-photo" src="/assets/'+(style==='patronato'?'caf-previdenza.svg':'caf-consulenza.svg')+'" width="420" height="270" alt="'+(style==='patronato'?'Una persona durante una consulenza previdenziale':'Una consulente accoglie una persona allo sportello')+'"></section>';
 const home=style==='home'?'<section id="cafpc-home-services" class="cafpc-services-showcase"><h2>Come possiamo aiutarti?</h2><div class="cafpc-home-grid">'+[['CAF e Fiscale','Dichiarazioni, ISEE, assistenza fiscale.','/caf.html','▤'],['Patronato / INPS','Pensioni, prestazioni e tutele.','/patronato.html','♡'],['Lavoro / Sindacato','Diritti, contratti e consulenza.','/lavoro-sindacato.html','♧'],['Area Aziende','Servizi dedicati alle imprese.','/area-aziende.html','▥']].map(([name,desc,url,icon])=>'<a class="cafpc-home-card" href="'+url+'"><span class="cafpc-service-icon" aria-hidden="true">'+icon+'</span><strong>'+name+'</strong><span>'+desc+'</span><span aria-hidden="true">→</span></a>').join('')+'</div><div class="cafpc-home-panels"><article><h2>Prenota un appuntamento</h2><p>Scegli servizio, sede e orario nell’agenda online.</p><a class="btn btn--primary" href="/servizi-online.html#prenotazione-online">Apri le prenotazioni →</a><p>Molfetta · <a href="tel:0806455509">080 6455509</a></p></article><article><h2>Il tuo sportello personale</h2><p>Documenti PDF, stato delle pratiche e richieste di integrazione della sede.</p><a class="btn btn--primary" href="/assistiti/">Accedi all’area assistiti →</a><p><a href="/news-bonus.html">Leggi News e Bonus</a></p></article></div></section>':'';
 let inserted=false;
 html=html.replace(/<nav class="pro-nav">[\s\S]*?<\/nav>/,nav=>{inserted=true;return nav+hero+home});
 if(!inserted)throw new Error('Public design navigation target missing: '+file);
 return html;
}
module.exports={approvedPublic,themeLink};
