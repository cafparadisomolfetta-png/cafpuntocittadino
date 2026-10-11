const fs=require('node:fs');const path=require('node:path');
const files=fs.readdirSync('.').filter(x=>x.endsWith('.html'));
for(const file of files){let html=fs.readFileSync(file,'utf8');
html=html.replace(/<!-- COOKIE CONSENT -->[\s\S]*?<!-- \/COOKIE CONSENT -->/g,'');
html=html.replace(/<script\b[^>]*id=["']cafpc-cookie-script["'][\s\S]*?<\/script>/gi,'');
html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/site-enhancements.css">\n</head>');
html=html.replace(/<\/body>/i,'<script src="/site-enhancements.js" defer></script>\n</body>');
fs.writeFileSync(file,html);}
console.log('Enhanced '+files.length+' HTML pages while preserving existing booking and Netlify code.');