'use strict';
// Reference-only access control for a future authenticated practice API.
// This module does not authenticate users or read/write records.
const {canAccessPractice}=require('./pratiche-workflow');
function authorizePracticeQuery(actor,query){
 if(!actor||actor.authenticated!==true||!query||typeof query!=='object')return {allowed:false};
 if(actor.role==='citizen'){
  if(typeof actor.subject!=='string'||actor.subject.length<1)return {allowed:false};
  if(query.ownerSubject!==actor.subject)return {allowed:false};
  if(query.site!==undefined&&!['molfetta','bari'].includes(query.site))return {allowed:false};
  return {allowed:true,filter:{ownerSubject:actor.subject,...(query.site?{site:query.site}:{})}};
 }
 if(actor.role==='operator'){
  if(!Array.isArray(actor.sites)||!actor.sites.includes(query.site)||!['molfetta','bari'].includes(query.site))return {allowed:false};
  return {allowed:true,filter:{site:query.site}};
 }
 if(actor.role==='admin'){
  if(query.site!==undefined&&!['molfetta','bari'].includes(query.site))return {allowed:false};
  return {allowed:true,filter:query.site?{site:query.site}:{}};
 }
 return {allowed:false};
}
function authorizePracticeId(actor,record,requestedId){
 return typeof requestedId==='string'&&requestedId.length>0&&record&&record.id===requestedId&&canAccessPractice(actor,record);
}
module.exports={authorizePracticeQuery,authorizePracticeId};
