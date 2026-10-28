'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {googleEventId}=require('../server/google-event-id.cjs');
const secret='a'.repeat(40);
test('event IDs are stable, distinct, and compatible with Google ID alphabet',()=>{
 const a=googleEventId({claimId:21,secret});
 assert.equal(a,googleEventId({claimId:21,secret}));
 assert.notEqual(a,googleEventId({claimId:22,secret}));
 assert.notEqual(a,googleEventId({claimId:21,secret:'b'.repeat(40)}));
 assert.match(a,/^[a-v0-9]{5,1024}$/);
});
test('event IDs reject invalid claims and weak secrets',()=>{
 assert.throws(()=>googleEventId({claimId:0,secret}),/Invalid booking claim/);
 assert.throws(()=>googleEventId({claimId:1,site:'bari',secret}),/Invalid booking claim/);
 assert.throws(()=>googleEventId({claimId:1,secret:'short'}),/32/);
});
