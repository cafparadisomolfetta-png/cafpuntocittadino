'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {authorizePracticeQuery,authorizePracticeId}=require('../netlify/functions/pratiche-query');
const citizen={role:'citizen',authenticated:true,subject:'citizen-1'};
const operator={role:'operator',authenticated:true,sites:['bari']};
const record={id:'p-123',site:'bari',status:'received',ownerSubject:'citizen-1'};
test('citizen queries are bound to authenticated identity',()=>{
 assert.deepEqual(authorizePracticeQuery(citizen,{ownerSubject:'citizen-1'}),{allowed:true,filter:{ownerSubject:'citizen-1'}});
 assert.equal(authorizePracticeQuery(citizen,{ownerSubject:'citizen-2'}).allowed,false);
 assert.equal(authorizePracticeQuery(citizen,{}).allowed,false);
});
test('staff query must match authorized site',()=>{
 assert.deepEqual(authorizePracticeQuery(operator,{site:'bari'}),{allowed:true,filter:{site:'bari'}});
 assert.equal(authorizePracticeQuery(operator,{site:'molfetta'}).allowed,false);
 assert.equal(authorizePracticeQuery(operator,{}).allowed,false);
});
test('record lookup checks both ID and permissions',()=>{
 assert.equal(authorizePracticeId(citizen,record,'p-123'),true);
 assert.equal(authorizePracticeId(citizen,record,'p-456'),false);
 assert.equal(authorizePracticeId({role:'citizen',authenticated:true,subject:'citizen-2'},record,'p-123'),false);
 assert.equal(authorizePracticeId(operator,record,'p-123'),true);
});
