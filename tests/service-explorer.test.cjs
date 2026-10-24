'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {guideQuestions,guidedRoutes}=require('../service-explorer.js');
const {groups}=require('../netlify/functions/booking-services.js');
const names=new Set(groups.flatMap(g=>g.services));
test('Guided routes always point to catalog services, with no automatic eligibility decision',()=>{
 for(const kind of ['bonus','pensioni']){
  const base={0:0,1:0,2:0,3:0,4:kind==='bonus'?[6]:3};
  for(let q=0;q<5;q++)for(let i=0;i<guideQuestions[kind][q][1].length;i++){
   const answers={...base,[q]:kind==='bonus'&&q===4?[i]:i};
   const routes=guidedRoutes(kind,answers);assert.ok(routes.length);
   assert.equal(new Set(routes.map(x=>x.name)).size,routes.length);
   for(const route of routes){assert.ok(names.has(route.name),route.name);assert.ok(route.why.length>20);}
  }
 }
 const family=guidedRoutes('bonus',{0:2,1:0,2:1,3:1,4:[1,4]});
 for(const name of ['Assegno unico','Bonus nido e contributi per la famiglia','INAIL: infortunio sul lavoro','Libri di testo, scuola e agevolazioni comunali'])assert.ok(family.some(x=>x.name===name));
 const survivor=guidedRoutes('pensioni',{0:3,1:2,2:0,3:2,4:3});assert.ok(survivor.some(x=>x.name==='Pensione di reversibilità'));
});
test('Public explorer: all detail links, guided steps, backtracking and booking prefilling run without persistence',()=>{
 let click;const root={innerHTML:'',contains:()=>true,addEventListener:(name,fn)=>{if(name==='click')click=fn}};
 let changed=false,ready;const select={value:'',dispatchEvent:()=>{changed=true}};
 const document={readyState:'loading',addEventListener:(name,fn)=>{assert.equal(name,'DOMContentLoaded');ready=fn},getElementById:id=>({'cafpc-explorer':root,'cafpc-service-data':{textContent:JSON.stringify(groups)},bkServizio:select}[id])};
 const source=fs.readFileSync('service-explorer.js','utf8');
 assert.ok(!/localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/.test(source));
 vm.runInNewContext(source,{document,URLSearchParams,CAFPCServiceVisuals:require('../service-visuals.js'),location:{search:'?servizio='+encodeURIComponent('INAIL: malattia professionale')},Event:function(){}});
 assert.equal((root.innerHTML.match(/class="cafpc-reference-photo"/g)||[]).length,names.size);
 assert.equal(changed,false);ready();assert.equal(select.value,'INAIL: malattia professionale');assert.equal(changed,true);
 const tap=dataset=>click({target:{closest:()=>({dataset})}});
 for(const name of names){tap({service:name});assert.match(root.innerHTML,/Come ti aiutiamo/);assert.match(root.innerHTML,/cafpc-reference-folder/);assert.match(root.innerHTML,/Torna a tutti i servizi/);assert.ok(root.innerHTML.includes(encodeURIComponent(name)));assert.ok(!root.innerHTML.includes('undefined'));}
 for(const kind of ['bonus','pensioni']){
  tap({explore:kind});tap({next:'yes'});assert.match(root.innerHTML,/Domanda 1 di 5/);
  for(let i=0;i<5;i++){tap({answer:String(kind==='bonus'&&i===4?6:0)});tap({next:'yes'});}
  assert.match(root.innerHTML,/servizi da approfondire/);assert.match(root.innerHTML,/Non attesta il diritto/);
  tap({back:'yes'});assert.match(root.innerHTML,/Domanda 5 di 5/);
 }
 tap({explore:'bonus'});for(let i=0;i<4;i++){tap({answer:'0'});tap({next:'yes'});}
 tap({answer:'1'});tap({answer:'6'});tap({next:'yes'});assert.ok(!root.innerHTML.includes('Hai indicato un’esigenza INAIL'));
});
