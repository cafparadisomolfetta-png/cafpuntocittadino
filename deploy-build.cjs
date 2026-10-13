'use strict';
require('./preflight.cjs');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(process.cwd(), 'dist');
// A previous build must not leave obsolete public files or private data behind.
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out, {recursive:true});
const pages = fs.readdirSync('.').filter(file=>file.endsWith('.html'));
for (const page of pages) {
  let html=fs.readFileSync(page,'utf8');
  // Historical service sections were appended after </html>; keep all content inside body.
  html=html.replace(/<\/body>\s*<\/html>/i,'').trim()+'\n</body>\n</html>\n';
  html=html.replace(/accept="\.pdf,\.doc,\.docx"/g,'accept=".pdf,application/pdf"')
    .replace(/Formati accettati: PDF, DOC, DOCX\./g,'Formato accettato: solo PDF.');
  // CVs are accepted only by the authenticated, scanned private endpoint.
  html=html.replace(/<form\b[^>]*id="cv-form"[\s\S]*?<\/form>/gi,'<div class="cafpc-private-cv"><p>Invia il curriculum PDF tramite la tua area personale. Il file viene verificato e conservato nell’archivio riservato.</p><a class="btn btn--primary" href="/candidature/">Accedi e invia candidatura</a></div>');
  html=html.replace(/<form\b[^>]*name="richiamami"[\s\S]*?<\/form>/gi,'<p>Richiedi una richiamata tramite l’area personale oppure contatta la sede al numero 080 6455509.</p><a class="btn btn--primary" href="/assistiti/?richiamata=1">Accedi e richiedi richiamata</a>');
  html=html.replace(/href="(?:\/servizi-online\.html)?#richiamami"/g,'href="/assistiti/?richiamata=1"');
  // Remove superseded consent block; the shared script owns the single dialog.
  html=html.replace(/<!-- COOKIE CONSENT -->[\s\S]*?<!-- \/COOKIE CONSENT -->/g,'');
  html=html.replace(/<script\b[^>]*id=["']cafpc-cookie-script["'][\s\S]*?<\/script>/gi,'');
  // Remove the second historical banner and its inline controller as one block.
  html=html.replace(/<div\b[^>]*id=["']cookieConsentOverlay["'][\s\S]*?<script\b[^>]*id=["']cookie-consent-script["'][\s\S]*?<\/script>/gi,'');
  if(!html.includes('rel="manifest"')) html=html.replace(/<\/head>/i,'<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/app-icon.svg" type="image/svg+xml"><meta name="theme-color" content="#174a86">\n</head>');
  if(!html.includes('href="/site-enhancements.css"'))
    html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/site-enhancements.css">\n</head>');
  if(!html.includes('src="/cookie-consent.js"')) html=html.replace('</body>','<script src="/cookie-consent.js" defer></script>\n</body>');
  if(!html.includes('src="/site-enhancements.js"'))
    html=html.replace(/<\/body>/i,'<script src="/site-enhancements.js" defer></script>\n</body>');
  fs.writeFileSync(path.join(out,page),html);
}
for (const asset of ['site-enhancements.css','site-enhancements.js','manifest.webmanifest','app-icon.svg','public-sw.js','cookie-consent.js','icon-192.png','icon-512.png']) {
  fs.copyFileSync(asset,path.join(out,asset));
}
// Publish only the frontend of the management app, never its internal documentation.
const privateFrontend=path.join(out,'gestionale');
fs.mkdirSync(privateFrontend,{recursive:true});
for(const asset of ['index.html','pratiche.html','app.css','app.js','manifest.webmanifest','icon.svg','service-worker.js'])
  fs.copyFileSync(path.join('gestionale',asset),path.join(privateFrontend,asset));
const citizenFrontend=path.join(out,'assistiti');
fs.mkdirSync(citizenFrontend,{recursive:true});
for(const asset of ['index.html','app.css','app.js','manifest.webmanifest','service-worker.js'])
 fs.copyFileSync(path.join('assistiti',asset),path.join(citizenFrontend,asset));
const candidatureFrontend=path.join(out,'candidature');fs.mkdirSync(candidatureFrontend,{recursive:true});
for(const asset of ['index.html','app.js'])fs.copyFileSync(path.join('candidature',asset),path.join(candidatureFrontend,asset));
console.log('Ready: '+pages.length+' pages, shared assets. Server functions stay outside public dist/.');

require('node:child_process').execFileSync(process.execPath,['--test','tests/build-artifact.test.cjs'],{stdio:'inherit',timeout:15000});
