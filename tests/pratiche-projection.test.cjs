'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {projectPractice,listVisiblePractices,projectDocument}=require('../netlify/functions/pratiche-projection');
const mine={id:'p1',site:'molfetta',service:'isee',status:'awaiting_documents',ownerSubject:'u1',createdAt:'2026-10-12',updatedAt:'2026-10-12',documentCount:2,storageKey:'SECRET',taxCode:'SECRET'};
const theirs={...mine,id:'p2',ownerSubject:'u2',site:'bari'};
const actor={role:'citizen',authenticated:true,subject:'u1'};
test('citizen receives only own practices and no internal identifiers',()=>{
 const result=listVisiblePractices(actor,[mine,theirs]);
 assert.equal(result.length,1);
 assert.equal(result[0].id,'p1');
 assert.equal(result[0].needsIntegration,true);
 assert.equal(JSON.stringify(result).includes('SECRET'),false);
 assert.equal('documentCount' in result[0],false);
});
test('operator projection stays inside site',()=>{
 const result=listVisiblePractices({role:'operator',authenticated:true,sites:['molfetta']},[mine,theirs]);
 assert.equal(result.length,1);
 assert.equal(result[0].hasDocuments,true);
});
test('document projection excludes storage secrets and checks scan status',()=>{
 const doc={id:'d1',name:'isee.pdf',size:123,uploadedAt:'2026-10-12',scanStatus:'pending',storageKey:'SECRET'};
 const result=projectDocument(actor,mine,doc);
 assert.equal(result.downloadable,false);
 assert.equal(JSON.stringify(result).includes('SECRET'),false);
 assert.equal(projectDocument({role:'citizen',authenticated:true,subject:'u2'},mine,doc),null);
});
