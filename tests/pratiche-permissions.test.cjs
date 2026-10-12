'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {authorizeOperation}=require('../netlify/functions/pratiche-permissions');
const p={site:'molfetta',status:'received',ownerSubject:'owner'};
const citizen={role:'citizen',authenticated:true,subject:'owner'};
const other={role:'citizen',authenticated:true,subject:'other'};
const operator={role:'operator',authenticated:true,sites:['molfetta']};
test('unrelated citizen and other site staff are denied all operations',()=>{
 for(const action of ['view','upload','download','change_status','request_integration']){
  assert.equal(authorizeOperation(other,p,action).allowed,false);
  assert.equal(authorizeOperation({role:'operator',authenticated:true,sites:['bari']},p,action).allowed,false);
 }
});
test('download requires explicit clean-file verification',()=>{
 assert.equal(authorizeOperation(citizen,p,'download').allowed,false);
 assert.equal(authorizeOperation(citizen,p,'download',{verifiedCleanFile:true}).allowed,true);
});
test('citizen may upload only to own open or integration-requested case',()=>{
 assert.equal(authorizeOperation(citizen,p,'upload').allowed,true);
 assert.equal(authorizeOperation(operator,p,'upload').allowed,false);
 assert.equal(authorizeOperation(citizen,{...p,status:'completed'},'upload').allowed,false);
 assert.equal(authorizeOperation(citizen,{...p,status:'awaiting_documents'},'upload').allowed,true);
});
test('staff transitions follow lifecycle rules',()=>{
 assert.equal(authorizeOperation(operator,p,'change_status',{nextStatus:'in_review'}).allowed,true);
 assert.equal(authorizeOperation(operator,p,'change_status',{nextStatus:'completed'}).allowed,false);
 assert.equal(authorizeOperation(citizen,p,'change_status',{nextStatus:'in_review'}).allowed,false);
});
