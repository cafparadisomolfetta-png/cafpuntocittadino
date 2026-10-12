'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Citizen and staff frontends contain every referenced static control and unique ID',()=>{
 const script=fs.readFileSync('assistiti/app.js','utf8');new vm.Script(script);
 const refs=[...script.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]).filter(x=>x!=='op-');
 for(const file of ['assistiti/index.html','gestionale/pratiche.html']){
 const html=fs.readFileSync(file,'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,file);for(const id of refs)assert.ok(ids.includes(id),file+': '+id);
 assert.match(html,/accept="\.pdf,application\/pdf"/);assert.match(html,/<input id="privacy" type="checkbox" required>/);
 }
});
test('Tokens and private documents are not persisted in browser storage or service worker caches',()=>{
 for(const file of ['assistiti/app.js','assistiti/service-worker.js','gestionale/service-worker.js']){
 const s=fs.readFileSync(file,'utf8');assert.ok(!/localStorage|sessionStorage|indexedDB|caches\.open/.test(s),file);
 }
});
test('All PWA manifests provide square PNG icons of the declared sizes',()=>{
 for(const file of ['manifest.webmanifest','assistiti/manifest.webmanifest','gestionale/manifest.webmanifest']){
 const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const size of [192,512]){
 const icon=manifest.icons.find(x=>x.type==='image/png'&&x.sizes===size+'x'+size);assert.ok(icon,file);
 const png=fs.readFileSync('.'+icon.src);assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
 }
 }
});
