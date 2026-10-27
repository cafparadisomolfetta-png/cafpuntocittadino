'use strict';
// Public contact launch. Does not start the private runtime or open its vault.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');process.chdir(root);
require('../deploy-build.cjs');
const {contactLinks}=require('../public-contact.cjs'),contact=contactLinks();
const actions='<p><a class="btn btn--primary" href="'+contact.emailUrl.replace(/&/g,'&amp;')+'">Scrivi via email</a> '+(contact.whatsappUrl?'<a class="btn btn--primary" href="'+contact.whatsappUrl+'" target="_blank" rel="noopener noreferrer">Scrivi su WhatsApp</a>':'')+'</p>';
const notice='<div class="cafpc-launch-notice" role="note"><strong>Contatti e consulenze disponibili.</strong> Per fissare un appuntamento scrivici via email o WhatsApp. Agenda automatica e area documenti sono in preparazione. Non inviare documenti personali in chat.</div>';
const style='<style>.cafpc-launch-notice{padding:16px 24px;background:#eaf6fa;color:#12395a;text-align:center;border-bottom:1px solid #c9e1eb;font:16px/1.6 Arial,sans-serif}#bookingForm,#bookingConfirmation,#aiSecretaryLauncher,#aiSecretaryPanel{display:none!important}.cafpc-launch-contact{padding:24px;background:#fff;border:1px solid #dbe6ef;border-radius:14px;margin:20px auto;max-width:900px}</style>';
const publicPages=[...fs.readdirSync('dist').filter(name=>name.endsWith('.html')),...fs.readdirSync('dist/schede').filter(name=>name.endsWith('.html')).map(name=>'schede/'+name)];
for(const file of publicPages){
 const target=path.join('dist',file);let html=fs.readFileSync(target,'utf8');
 html=html.replace('</head>',style+'</head>').replace(/(<body\b[^>]*>)/i,'$1'+notice);
 html=html.replace(/(<div\b[^>]*id="bookingForm"[^>]*>)/,'<div class="cafpc-launch-contact"><h3 id="disdetta-appuntamento">Fissa o modifica un appuntamento con un operatore</h3><p>Scrivici indicando il servizio e quando preferisci essere ricontattato. La prenotazione sarà concordata direttamente con la sede.</p>'+actions+'</div>$1');
 // The historical consultation demo must not collect names or imply an enabled workflow.
 if(file==='schede/consulenza-20.html'){
  html=html.replace(/<div id="scelta-consulenza"[\s\S]*?(?=<\/section>)/,'<div class="cafpc-launch-contact"><p>Contattaci per concordare la consulenza e ricevere le condizioni prima della conferma.</p>'+actions+'</div>');
  html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(all,attrs,code)=>/function apriTesseramento/.test(code)?'':all);
 }
 html=html.replace(/<div class="cafpc-private-cv">[\s\S]*?<\/div>/g,'<div class="cafpc-private-cv"><p>La raccolta dei curriculum tramite il portale è in preparazione. Contattaci per informazioni, senza allegare documenti.</p>'+actions+'</div>');
 html=html.replace(/Scegli servizio e data: vedrai soltanto gli orari realmente disponibili nel calendario della sede\./g,'Concorda il servizio e l’orario direttamente con un operatore.')
  .replace(/Scegli servizio, modalità e orario nell’agenda online\./g,'Scrivici per concordare servizio, modalità e orario con un operatore.')
  .replace(/Prenota un appuntamento, consulta le tue pratiche e accedi allo sportello personale\./g,'Scopri i servizi e scrivici per concordare un appuntamento.')
  .replace(/Documenti PDF, stato delle pratiche e richieste di integrazione della sede\./g,'L’area documenti e la consultazione delle pratiche saranno disponibili dopo l’attivazione.')
  .replace(/Usa la Segretaria AI oppure contattaci:/g,'Contattaci:')
  .replace(/chiedi alla Segretaria AI o alla sede/g,'chiedi alla sede')
  .replace(/href="(?:\/servizi-online\.html)?#aiSecretaryLauncher"/g,'href="/servizi-online.html#contatti"')
  .replace(/Chiedi alla Segretaria AI/g,'Contatta un operatore')
  .replace(/(<section\b[^>]*id="privacy-policy"[^>]*>)[\s\S]*?<\/section>/g,'$1<div style="max-width:900px;margin:auto"><h2>Privacy Policy</h2><p>Consulta l’<a href="/privacy.html">informativa completa sul trattamento dei dati personali</a>.</p></div></section>')
  .replace(/(<section\b[^>]*id="cookie-policy"[^>]*>)[\s\S]*?<\/section>/g,'$1<div style="max-width:900px;margin:auto"><h2>Cookie Policy</h2><p>Consulta la <a href="/cookie-policy.html">cookie policy</a>. Puoi modificare le scelte dal pulsante Preferenze cookie.</p></div></section>');
 fs.writeFileSync(target,html);
 assert.ok(html.includes('cafpc-launch-notice'));
}
const status='<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Area in preparazione — Punto Cittadino Italia</title><link rel="stylesheet" href="/approved-design.css">'+style+'</head><body><main style="max-width:800px;margin:50px auto;padding:24px;font:18px/1.7 Arial,sans-serif;color:#12395a"><a href="/"><img src="/assets/punto-cittadino-brand.png" width="280" height="80" alt="Punto Cittadino Italia"></a><h1>Area in preparazione</h1><p>Il sito e i contatti sono disponibili. L’area riservata, il caricamento documenti e le candidature saranno aperti dopo il completamento dell’attivazione e dei collaudi.</p><p>Per informazioni o per concordare un appuntamento scrivici, senza allegare documenti personali.</p>'+actions+'<p><a href="/">Torna alla home</a> · <a href="/privacy.html">Privacy</a></p></main></body></html>';
for(const directory of ['assistiti','gestionale','candidature']){
 for(const file of fs.readdirSync(path.join('dist',directory)).filter(name=>name.endsWith('.html')))fs.writeFileSync(path.join('dist',directory,file),status);
}
fs.writeFileSync('dist/launch-mode.json',JSON.stringify({mode:'public-contact',privateEnabled:false,automaticBookingEnabled:false,cvEnabled:false,aiEnabled:false})+'\n');
console.log('PUBLIC_CONTACT_BUILD_OK: private runtime, automatic bookings, CV uploads and AI remain disabled.');
