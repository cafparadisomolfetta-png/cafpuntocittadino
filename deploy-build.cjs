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
  if(!html.includes('href="/site-enhancements.css"'))
    html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/site-enhancements.css">\n</head>');
  if(!html.includes('src="/site-enhancements.js"'))
    html=html.replace(/<\/body>/i,'<script src="/site-enhancements.js" defer></script>\n</body>');
  fs.writeFileSync(path.join(out,page),html);
}
for (const asset of ['site-enhancements.css','site-enhancements.js']) {
  fs.copyFileSync(asset,path.join(out,asset));
}
console.log('Ready: '+pages.length+' pages, shared assets. Server functions stay outside public dist/.');
