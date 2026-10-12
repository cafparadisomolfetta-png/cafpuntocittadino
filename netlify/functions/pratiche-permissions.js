'use strict';
// Fail-closed access checks for a future practices API. This module does not
// authenticate users, fetch records, or return documents by itself.
const {canAccessPractice,canTransition}=require('./pratiche-workflow');
const OPERATIONS=Object.freeze(['view','upload','request_integration','change_status','download']);
function authorizeOperation(actor,practice,operation,options={}){
 if(!OPERATIONS.includes(operation)||!canAccessPractice(actor,practice))return {allowed:false,reason:'FORBIDDEN'};
 if(operation==='view')return {allowed:true};
 if(operation==='download')return {allowed:!!options.verifiedCleanFile,reason:options.verifiedCleanFile?undefined:'FILE_NOT_VERIFIED'};
 if(operation==='upload'){
   if(actor.role!=='citizen'||practice.ownerSubject!==actor.subject)return {allowed:false,reason:'FORBIDDEN'};
   return {allowed:practice.status==='received'||practice.status==='awaiting_documents',reason:'UPLOAD_NOT_ALLOWED'};
 }
 if(operation==='request_integration'){
   return {allowed:['admin','manager','operator'].includes(actor.role),reason:'STAFF_ONLY'};
 }
 if(operation==='change_status'){
   if(!['admin','manager','operator'].includes(actor.role))return {allowed:false,reason:'STAFF_ONLY'};
   return {allowed:canTransition(practice.status,options.nextStatus),reason:'INVALID_TRANSITION'};
 }
 return {allowed:false,reason:'FORBIDDEN'};
}
module.exports={OPERATIONS,authorizeOperation};
