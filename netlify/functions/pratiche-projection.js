'use strict';
// Pure response projections for the future authenticated practices API.
// Never return storage paths, access tokens, internal audit data or another citizen's records.
const {canAccessPractice}=require('./pratiche-workflow');
const {authorizeOperation}=require('./pratiche-permissions');
function projectPractice(actor,record){
 if(!canAccessPractice(actor,record))return null;
 const result={
   id:record.id,
   site:record.site,
   service:record.service,
   status:record.status,
   createdAt:record.createdAt,
   updatedAt:record.updatedAt
 };
 if(actor.role==='citizen'){
   result.needsIntegration=record.status==='awaiting_documents';
 } else {
   result.hasDocuments=Number.isSafeInteger(record.documentCount)&&record.documentCount>0;
 }
 return result;
}
function listVisiblePractices(actor,records){
 if(!Array.isArray(records))return [];
 return records.map(record=>projectPractice(actor,record)).filter(Boolean);
}
function projectDocument(actor,practice,document){
 if(!document||!authorizeOperation(actor,practice,'view').allowed)return null;
 return {
   id:document.id,
   name:document.name,
   size:document.size,
   uploadedAt:document.uploadedAt,
   downloadable:authorizeOperation(actor,practice,'download',{verifiedCleanFile:document.scanStatus==='clean'}).allowed
 };
}
module.exports={projectPractice,listVisiblePractices,projectDocument};
