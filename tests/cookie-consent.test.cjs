'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const script = fs.readFileSync('cookie-consent.js','utf8');
const build = fs.readFileSync('deploy-build.cjs','utf8');
const policy = fs.readFileSync('cookie-policy.html','utf8');
test('consent controls include equal reject, accept and preference choices', () => {
  for (const label of ['Continua senza accettare','Accetta','Personalizza','Salva preferenze']) assert.ok(script.includes(label),label);
});
test('necessary cookies cannot be disabled', () => {
  assert.match(script,/necessary:\s*true/);
  assert.match(script,/checked disabled/);
});
test('consent is not preset for optional categories', () => {
  assert.match(script,/type="checkbox"> Statistiche facoltative/);
  assert.match(script,/type="checkbox"> Marketing facoltativo/);
});
test('cookie and privacy information link to actual pages', () => {
  assert.ok(script.includes('/cookie-policy.html'));
  assert.ok(script.includes('/privacy.html'));
  assert.ok(policy.includes('Continua senza accettare'));
});
test('initial modal, rejection, reopening and saved consent preserve the visitors choice',()=>{
 const vm=require('node:vm'),storage=new Map();
 function boot(){
  const byId=new Map(),children=[],events=[];
  function element(tag){return {tag,hidden:false,open:false,isConnected:true,checked:false,listeners:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(k,f){this.listeners[k]=f},focus(){document.activeElement=this},showModal(){this.open=true},close(){this.open=false},click(){this.listeners.click?.({target:this})},querySelector(selector){return this.controls[selector]}}}
  const previous=element('button');
  const document={readyState:'complete',activeElement:previous,head:{appendChild(){}},body:{appendChild(e){children.push(e);if(e.id)byId.set(e.id,e)}},getElementById:id=>byId.get(id),dispatchEvent:e=>events.push(e),querySelector:()=>children.find(e=>e.className==='cafpc-cookie-reopen'),createElement:tag=>{const e=element(tag);if(tag==='dialog'){e.controls={};for(const sel of ['.cafpc-cookie-settings','[data-action="save"]','[data-action="settings"]','#cafpc-analytics','#cafpc-marketing'])e.controls[sel]=element('control');}return e}};
  const window={},context={window,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}};
  vm.runInNewContext(script,context);
  const panel=byId.get('cafpc-cookie-panel');
  return {panel,window,events,previous,document,action:name=>panel.listeners.click({target:{getAttribute:()=>name}}),reopen:()=>children.find(e=>e.className==='cafpc-cookie-reopen').click()};
 }
 let first=boot();assert.equal(first.panel.tag,'dialog');assert.equal(first.panel.open,true);assert.equal(first.window.CAFPCConsent.read(),null);assert.equal(storage.size,0);
 first.action('settings');assert.equal(first.panel.controls['.cafpc-cookie-settings'].hidden,false);
 first.action('reject');assert.equal(first.panel.open,false);assert.equal(first.window.CAFPCConsent.read().analytics,false);assert.equal(first.window.CAFPCConsent.read().marketing,false);assert.equal(first.document.activeElement,first.previous);
 let next=boot();assert.equal(next.panel.open,false);next.reopen();assert.equal(next.panel.open,true);assert.equal(next.panel.controls['#cafpc-analytics'].checked,false);next.panel.controls['#cafpc-analytics'].checked=true;next.action('save');assert.equal(next.window.CAFPCConsent.read().analytics,true);assert.equal(next.window.CAFPCConsent.read().marketing,false);
 next.reopen();const before=storage.get('cafpc_cookie_preferences_v1');next.panel.listeners.cancel({preventDefault(){}});assert.equal(next.panel.open,false);assert.equal(storage.get('cafpc_cookie_preferences_v1'),before);
});
test('build includes consent script on generated pages', () => {
  assert.ok(build.includes('src="/cookie-consent.js"'));
  assert.ok(build.includes("'cookie-consent.js'"));
});
