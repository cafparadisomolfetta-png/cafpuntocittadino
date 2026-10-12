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
