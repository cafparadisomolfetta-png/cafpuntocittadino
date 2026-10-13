'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element{constructor(){this.hidden=false;this.value='';this.textContent='';this.children=[];this.listeners={};}addEventListener(name,fn){this.listeners[name]=fn}append(...nodes){this.children.push(...nodes)}replaceChildren(){this.children=[]}setAttribute(){} }
test('Late agenda response cannot restore an authenticated dashboard after logout',async()=>{
 const ids=['status','agenda-panel','results','login-button','profile','site','day','retry','load','logout'];const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));let callback,resolveAgenda;const events={};
 const google={accounts:{id:{initialize:config=>callback=config.callback,renderButton:()=>{},disableAutoSelect:()=>{}}}};
 const fetcher=async url=>{if(url.includes('gestionale-session'))return {ok:true,json:async()=>({clientId:'synthetic'})};if(url.includes('gestionale-agenda'))return new Promise(resolve=>resolveAgenda=resolve);throw Error('Unexpected request')};
 const context={document:{getElementById:id=>elements[id],createElement:()=>new Element(),hidden:false,addEventListener:()=>{}},window:{google,addEventListener:(name,fn)=>events[name]=fn},google,fetch:fetcher,setInterval:()=>{},Intl,Date,URLSearchParams};vm.createContext(context);vm.runInContext(fs.readFileSync('gestionale/app.js','utf8'),context);
 await events.load();const pending=callback({credential:'synthetic-token'});await new Promise(resolve=>setImmediate(resolve));elements.logout.listeners.click();resolveAgenda({ok:true,json:async()=>({email:'private@example.invalid',role:'admin',sites:['molfetta','bari'],site:'molfetta',appointments:[{id:'event',summary:'Private client',start:'2027-01-11T09:00:00+01:00'}]})});await pending;
 assert.equal(elements['agenda-panel'].hidden,true);assert.equal(elements.profile.textContent,'');assert.equal(elements.results.children.length,0);
});
