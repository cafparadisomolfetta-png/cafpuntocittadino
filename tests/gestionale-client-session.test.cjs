'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const code=fs.readFileSync('gestionale/app.js','utf8');
test('management client invalidates pending requests on logout',()=>{
 assert.match(code,/function clear\(\)\{sessionEpoch\+\+;credential=null;/);
 assert.match(code,/if\(epoch!==sessionEpoch\|\|!credential\)return;/);
});
test('management client checks session before processing a delayed authorization response',()=>{
 const request=code.indexOf("const r=await fetch(url,");
 const guard=code.indexOf('if(epoch!==sessionEpoch||!credential)return;',request);
 const denied=code.indexOf('if(r.status===401||r.status===403)',request);
 assert.ok(request>=0&&guard>request&&denied>guard);
});
test('management client does not show stale cancellation errors',()=>{
 assert.match(code,/catch\{\s*if\(epoch!==sessionEpoch\|\|!credential\)return;\s*const warning=/);
});
