'use strict';
require('./preflight.cjs');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(process.cwd(), 'dist');
fs.mkdirSync(out, {recursive:true});
const pages = fs.readdirSync('.').filter(file=>file.endsWith('.html'));
for (const page of pages) {
  let html=fs.readFileSync(page,'utf8');
  // Remove superseded consent block; the shared script owns the single dialog.
  html=html.replace(/<!-- COOKIE CONSENT -->[\s\S]*?<!-- \/COOKIE CONSENT -->/g,'');
  html=html.replace(/<script\b[^>]*id=["']cafpc-cookie-script["'][\s\S]*?<\/script>/gi,'');
  if(!html.includes('rel="manifest"')) html=html.replace(/<\/head>/i,'<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/app-icon.svg" type="image/svg+xml"><meta name="theme-color" content="#174a86">\n</head>');
  if(!html.includes('href="/site-enhancements.css"'))
    html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/site-enhancements.css">\n</head>');
  if(!html.includes('src="/cookie-consent.js"')) html=html.replace('</body>','<script src="/cookie-consent.js" defer></script>\n</body>');
  if(!html.includes('src="/site-enhancements.js"'))
    html=html.replace(/<\/body>/i,'<script src="/site-enhancements.js" defer></script>\n</body>');
  fs.writeFileSync(path.join(out,page),html);
}
for (const asset of ['site-enhancements.css','site-enhancements.js','manifest.webmanifest','app-icon.svg','public-sw.js','cookie-consent.js']) {
  fs.copyFileSync(asset,path.join(out,asset));
}
// Publish only the frontend of the management app, never its internal documentation.
const privateFrontend=path.join(out,'gestionale');
fs.mkdirSync(privateFrontend,{recursive:true});
for(const asset of ['index.html','app.css','app.js','manifest.webmanifest','icon.svg','service-worker.js'])
  fs.copyFileSync(path.join('gestionale',asset),path.join(privateFrontend,asset));
console.log('Ready: '+pages.length+' pages, shared assets. Server functions stay outside public dist/.');
