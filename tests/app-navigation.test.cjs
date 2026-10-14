'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Reserved navigation follows authentication, admin permissions and logout',()=>{
 const state={workspaceHidden:true,adminHidden:true},links=[{dataset:{section:'list-card'},hidden:true},{dataset:{section:'operators'},hidden:true},{dataset:{section:'missing'},hidden:false}];
 const targets={'list-card':{closest:()=>state.workspaceHidden?{}:null},operators:{closest:()=>state.workspaceHidden||state.adminHidden?{}:null}};
 let sync;
 const main={};
 const document={querySelector:s=>s==='.cafpc-app-nav'?{querySelectorAll:()=>links}:main,getElementById:id=>targets[id]};
 vm.runInNewContext(fs.readFileSync('app-navigation.js','utf8'),{document,MutationObserver:class{constructor(callback){sync=callback}observe(target,options){assert.equal(target,main);assert.equal(options.attributeFilter[0],'hidden')}}});
 assert.deepEqual(links.map(l=>l.hidden),[true,true,true]);
 state.workspaceHidden=false;sync();assert.deepEqual(links.map(l=>l.hidden),[false,true,true]);
 state.adminHidden=false;sync();assert.deepEqual(links.map(l=>l.hidden),[false,false,true]);
 state.workspaceHidden=true;sync();assert.deepEqual(links.map(l=>l.hidden),[true,true,true]);
});
