'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {canTransition,canAccessPractice,publicStatus}=require('../netlify/functions/pratiche-workflow');
const practice={site:'molfetta',status:'received',ownerSubject:'citizen-123'};
test('workflow only permits declared status transitions',()=>{
 assert.equal(canTransition('received','in_review'),true);
 assert.equal(canTransition('received','completed'),false);
 assert.equal(canTransition('completed','in_review'),false);
 assert.equal(publicStatus('awaiting_documents'),'In attesa di integrazione');
});
test('operators see only their authorized site',()=>{
 assert.equal(canAccessPractice({role:'operator',authenticated:true,sites:['molfetta']},practice),true);
 assert.equal(canAccessPractice({role:'operator',authenticated:true,sites:['bari']},practice),false);
 assert.equal(canAccessPractice({role:'operator',authenticated:false,sites:['molfetta']},practice),false);
});
test('citizens can only access own practice',()=>{
 assert.equal(canAccessPractice({role:'citizen',authenticated:true,subject:'citizen-123'},practice),true);
 assert.equal(canAccessPractice({role:'citizen',authenticated:true,subject:'other'},practice),false);
 assert.equal(canAccessPractice({role:'citizen',authenticated:false,subject:'citizen-123'},practice),false);
});
test('admin access requires authentication',()=>{
 assert.equal(canAccessPractice({role:'admin',authenticated:true},practice),true);
 assert.equal(canAccessPractice({role:'admin',authenticated:false},practice),false);
});
