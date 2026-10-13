'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createApp}=require('../server/app.cjs');
async function serverFor(t,trustProxy){
 const server=createApp({practices:{},identity:{},publicDirectory:'.',origin:'http://127.0.0.1',trustProxy});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 return ip=>fetch('http://127.0.0.1:'+server.address().port+'/api/config',{headers:{'X-Forwarded-For':ip}});
}
test('Explicitly trusted loopback proxy keeps independent client quotas and rejects ambiguous address headers',async t=>{
 const request=await serverFor(t,true);
 for(let i=0;i<120;i++){const r=await request('192.0.2.1');assert.equal(r.status,200);await r.arrayBuffer();}
 assert.equal((await request('192.0.2.1')).status,429);
 assert.equal((await request('192.0.2.2')).status,200);
 // Invalid/comma-separated headers share the peer quota, never create arbitrary buckets.
 for(let i=0;i<120;i++){const r=await request('192.0.2.3, 192.0.2.4');assert.equal(r.status,200);await r.arrayBuffer();}
 assert.equal((await request('different-invalid-value')).status,429);
});
test('Untrusted proxy headers cannot evade the actual peer quota',async t=>{
 const request=await serverFor(t,false);
 for(let i=0;i<120;i++){const r=await request('192.0.2.'+(i%200+1));assert.equal(r.status,200);await r.arrayBuffer();}
 assert.equal((await request('198.51.100.1')).status,429);
});
