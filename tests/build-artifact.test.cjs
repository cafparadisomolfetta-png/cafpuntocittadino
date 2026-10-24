'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('Built navigation, local assets and PWA destinations resolve inside the artifact',()=>{
 const root=path.resolve('dist');
 const anchors=new Map();
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 const resolve=(value,file)=>{
  const url=new URL(value,'https://artifact.test/'+path.relative(root,file).split(path.sep).join('/'));
  if(url.origin!=='https://artifact.test')return null;
  let target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  assert.ok(target===root||target.startsWith(root+path.sep),value);
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  assert.ok(fs.existsSync(target),path.relative(root,file)+' -> '+value);
  return {target,hash:decodeURIComponent(url.hash.slice(1))};
 };
 for(const file of walk(root)){
  if(file.endsWith('.html')){
   const html=fs.readFileSync(file,'utf8').replace(/<!--[\s\S]*?-->/g,'');
   const markup=html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>');
   for(const tag of markup.matchAll(/<(?:a|link|script|img|iframe|source)\b[^>]*>/gi)){
    for(const attr of tag[0].matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)){
     const result=resolve(attr[2].replace(/&amp;/g,'&'),file);
     if(!result||!result.hash||!result.target.endsWith('.html'))continue;
     // This shared section is created after load by site-enhancements.js.
     if(result.hash==='cafpc-servizi'&&html.includes('/site-enhancements.js'))continue;
     if(!anchors.has(result.target))anchors.set(result.target,new Set([...fs.readFileSync(result.target,'utf8').matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map(x=>x[2])));
     assert.ok(anchors.get(result.target).has(result.hash),path.relative(root,file)+' -> '+attr[2]);
    }
   }
  }else if(file.endsWith('.webmanifest')){
   const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
   for(const value of [manifest.start_url,...(manifest.icons||[]).map(icon=>icon.src)])if(value)resolve(value,file);
  }
 }
});
test('Generated pages have one consent controller and PDF-only CV selection',()=>{
 for(const file of fs.readdirSync('dist').filter(x=>x.endsWith('.html'))){
 const text=fs.readFileSync(path.join('dist',file),'utf8');
 assert.equal((text.match(/src="\/cookie-consent.js"/g)||[]).length,1,file);
 assert.ok(!/id="(?:cookieConsentOverlay|cafpcCookieBackdrop)"/.test(text),file);
 assert.ok(!text.includes('accept=".pdf,.doc,.docx"'),file);
 assert.ok(!text.includes('<form id="cv-form"'),file);
 assert.ok(!/<form\b[^>]*name="(?:candidatura-cv|richiamami)"[^>]*data-netlify/i.test(text),file);
 assert.ok(!text.includes('href="/servizi-online.html#richiamami"'),file);
 assert.match(text,/<\/body>\s*<\/html>\s*$/i,file);
 assert.equal((text.match(/<\/html>/gi)||[]).length,1,file);
 }
 assert.ok(!fs.readFileSync('site-enhancements.js','utf8').includes('cafpc_cookie_consent_v3'));
});
test('Public artifact excludes server code, credentials and internal documentation',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 for(const file of walk('dist')){
 assert.ok(!/\.(md|cjs|mjs)$/.test(file),file);
 assert.ok(!/[/\\](?:netlify|node_modules|\.git|\.env)(?:[/\\]|$)/.test(file),file);
 }
});

test('Approved identity is packaged across public and reserved pages',()=>{
 for(const file of ['index.html','caf.html','patronato.html','lavoro-sindacato.html','area-aziende.html','news-bonus.html','servizi-online.html','lavora-con-noi.html']){
  const text=fs.readFileSync(path.join('dist',file),'utf8');
  assert.equal((text.match(/class="cafpc-design-hero cafpc-design-hero--/g)||[]).length,1,file);
  assert.match(text,/src="\/assets\/punto-cittadino-brand.png"/,file);
  assert.match(text,/src="\/assets\/caf-(?:consulenza|previdenza).svg"/,file);
  assert.match(text,/href="\/approved-design.css"/,file);
  assert.match(text,/<option value="WhatsApp">WhatsApp — ti contatta un operatore<\/option>/,file);
  assert.match(text,/Assistenza a distanza in tutta Italia/,file);
  assert.match(text,/id="cafpc-explorer"/,file);
  assert.match(text,/src="\/service-explorer.js"/,file);
  assert.ok(!/href=["']tel:/.test(text),file);
  assert.match(text,/id="richiesta-urgente"/,file);
  assert.match(text,/https:\/\/wa\.me\/390806455509\?text=/,file);
  assert.match(text,/mailto:cafparadiso.molfetta@gmail.com\?subject=/,file);
  assert.ok(!text.includes('oppure contatta la sede al numero'),file);
  assert.ok(!text.includes('id="screeningCard"'),file);
  assert.ok(!text.includes('info@cafpuntocittadino.it'),file);
  assert.match(text,/href="\/servizi-online.html#scopri"/,file);
  assert.match(text,/id="disdetta-appuntamento"/,file);
  assert.ok(!text.includes('Via Paradiso'),file);
  assert.ok(!text.includes('Sede di Molfetta'),file);
  assert.ok(!text.includes('In presenza — sede di Molfetta'),file);
  assert.match(text,/<option value="Telefonico">Telefonico — ti chiamiamo noi<\/option><option value="WhatsApp">/,file);
  assert.ok(!text.includes('Servizi gratuiti e servizi su tessera'),file);
 }
 for(const file of ['assistiti/index.html','gestionale/index.html','gestionale/pratiche.html','candidature/index.html']){
  const text=fs.readFileSync(path.join('dist',file),'utf8');
  assert.match(text,/class="cafpc-app-layout"/,file);
  assert.match(text,/src="\/app-navigation.js"/,file);
  assert.match(text,/href="\/approved-design.css"/,file);
 }
 assert.match(fs.readFileSync('dist/news-bonus.html','utf8'),/src="\/official-headlines.js"/);
 assert.ok(fs.existsSync('dist/official-headlines.js'));
 assert.ok(fs.existsSync('dist/assets/punto-cittadino-brand.png'));
 for(const name of ['caf-consulenza','caf-previdenza'])assert.ok(fs.existsSync(path.join('dist','assets',name+'.svg')),name);
});
