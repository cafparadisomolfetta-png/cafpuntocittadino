'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
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
  assert.match(text,/src="\/assets\/caf-brand.svg"/,file);
  assert.match(text,/src="\/assets\/caf-(?:consulenza|previdenza).svg"/,file);
  assert.match(text,/href="\/approved-design.css"/,file);
 }
 for(const file of ['assistiti/index.html','gestionale/index.html','gestionale/pratiche.html','candidature/index.html']){
  const text=fs.readFileSync(path.join('dist',file),'utf8');
  assert.match(text,/class="cafpc-app-layout"/,file);
  assert.match(text,/src="\/app-navigation.js"/,file);
  assert.match(text,/href="\/approved-design.css"/,file);
 }
 for(const name of ['caf-brand','caf-consulenza','caf-previdenza'])assert.ok(fs.existsSync(path.join('dist','assets',name+'.svg')),name);
});
