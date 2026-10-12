'use strict';
const crypto=require('node:crypto');
const {validateRequest,validateFileMetadata,hasPdfSignature,MAX_FILES}=require('../netlify/functions/pratiche-validation');
const {authorizeOperation}=require('../netlify/functions/pratiche-permissions');
const {authorizePracticeQuery}=require('../netlify/functions/pratiche-query');
const {projectPractice,projectDocument}=require('../netlify/functions/pratiche-projection');
function failure(status,code){const error=Error(code);error.status=status;error.code=code;throw error;}
class Practices {
 constructor({vault,scan,verifyAppointment,clock=()=>new Date().toISOString()}){
  if(typeof scan!=='function')throw Error('Malware scanner is required');
  this.vault=vault;this.scan=scan;this.verifyAppointment=verifyAppointment;this.clock=clock;
 }
 requireActor(actor){if(!actor?.authenticated||!actor.subject)failure(401,'UNAUTHORIZED');}
 record(actor,id,operation='view',options={}){this.requireActor(actor);const record=this.vault.get('practice',id);if(!record||!authorizeOperation(actor,record,operation,options).allowed)failure(404,'PRACTICE_NOT_FOUND');return record;}
 async create(actor,input){
  this.requireActor(actor);if(actor.role!=='citizen')failure(403,'CITIZEN_REQUIRED');
  const valid=validateRequest(input);if(!valid.ok)failure(400,valid.error);
  if(input.privacyVersion!=='2026-10-12'||input.privacyAcknowledged!==true)failure(400,'PRIVACY_ACKNOWLEDGEMENT_REQUIRED');
  if(input.mode==='appointment'&&(!this.verifyAppointment||!(await this.verifyAppointment(actor,input))))failure(400,'APPOINTMENT_NOT_VERIFIED');
  const now=this.clock(),id=crypto.randomUUID();
  const record={id,ownerSubject:actor.subject,site:valid.site,service:valid.service,mode:valid.mode,status:'received',createdAt:now,updatedAt:now,version:1,documentCount:0,privacyVersion:input.privacyVersion,privacyAcknowledgedAt:now,...(input.mode==='appointment'?{appointmentId:input.appointmentId}:{})};
  this.vault.transaction(()=>{this.vault.put('practice',id,record);this.vault.audit(actor,'practice.create',id)});
  return {...projectPractice(actor,record),version:record.version};
 }
 list(actor,site){
  this.requireActor(actor);const query={...(site?{site}:{}),...(actor.role==='citizen'?{ownerSubject:actor.subject}:{})};
  const access=authorizePracticeQuery(actor,query);if(!access.allowed)failure(403,'SITE_FORBIDDEN');
  this.vault.transaction(()=>this.vault.audit(actor,'practice.list',site||'own'));
  return this.vault.list('practice').filter(record=>Object.entries(access.filter).every(([key,value])=>record[key]===value)).map(record=>({...projectPractice(actor,record),version:record.version}));
 }
 detail(actor,id){const record=this.record(actor,id);this.vault.transaction(()=>this.vault.audit(actor,'practice.view',id));return {...projectPractice(actor,record),version:record.version,integrationMessage:record.integrationMessage||'',documents:this.vault.list('document').filter(d=>d.practiceId===id).map(d=>projectDocument(actor,record,d))};}
 async upload(actor,id,metadata,bytes){
  const record=this.record(actor,id,'upload'),valid=validateFileMetadata(metadata);
  if(!valid.ok)failure(400,valid.error);
  if(!Buffer.isBuffer(bytes)||bytes.length!==metadata.bytes||!hasPdfSignature(bytes)||!bytes.subarray(-1024).includes(Buffer.from('%%EOF')))failure(400,'INVALID_PDF_CONTENT');
  if(/\/(?:JavaScript|JS|Launch|EmbeddedFile)\b/.test(bytes.toString('latin1')))failure(400,'ACTIVE_PDF_NOT_ALLOWED');
  if(record.documentCount>=MAX_FILES)failure(409,'DOCUMENT_LIMIT');
  let result;try{result=await this.scan(bytes)}catch{failure(503,'SCANNER_UNAVAILABLE')}
  if(result!=='clean')failure(result==='infected'?400:503,result==='infected'?'UNSAFE_DOCUMENT':'SCANNER_UNAVAILABLE');
  const documentId=crypto.randomUUID(),now=this.clock(),digest=crypto.createHash('sha256').update(bytes).digest('hex');
  const doc={id:documentId,practiceId:id,site:record.site,name:metadata.name,size:bytes.length,uploadedAt:now,scanStatus:'clean',sha256:digest};
  this.vault.transaction(()=>{
   const current=this.record(actor,id,'upload');
   if(current.documentCount>=MAX_FILES)failure(409,'DOCUMENT_LIMIT');
   if(this.vault.list('document').some(d=>d.practiceId===id&&d.sha256===digest))failure(409,'DUPLICATE_DOCUMENT');
   this.vault.put('content',documentId,{content:bytes.toString('base64')});this.vault.put('document',documentId,doc);this.vault.put('practice',id,{...current,documentCount:current.documentCount+1,updatedAt:now,version:current.version+1});this.vault.audit(actor,'document.upload',id);
  });
  return projectDocument(actor,record,doc);
 }
 download(actor,id,documentId){
  const record=this.record(actor,id),doc=this.vault.get('document',documentId);
  if(!doc||doc.practiceId!==id||doc.site!==record.site||!authorizeOperation(actor,record,'download',{verifiedCleanFile:doc.scanStatus==='clean'}).allowed)failure(404,'DOCUMENT_NOT_FOUND');
  const bytes=Buffer.from(this.vault.get('content',documentId)?.content||'','base64');
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==doc.sha256)failure(503,'DOCUMENT_INTEGRITY_ERROR');
  this.vault.transaction(()=>this.vault.audit(actor,'document.download',id));
  return {bytes,name:doc.name};
 }
 changeStatus(actor,id,input){
  if(!input||!Number.isSafeInteger(input.version))failure(400,'VERSION_REQUIRED');
  const message=input.integrationMessage||'';
  if(typeof message!=='string'||message.length>1000||/[\x00-\x08]/.test(message))failure(400,'INVALID_INTEGRATION_MESSAGE');
  if(input.status==='awaiting_documents'&&!message.trim())failure(400,'INTEGRATION_MESSAGE_REQUIRED');
  return this.vault.transaction(()=>{
   const record=this.record(actor,id,'change_status',{nextStatus:input.status});
   if(record.version!==input.version)failure(409,'VERSION_CONFLICT');
   const updated={...record,status:input.status,integrationMessage:input.status==='awaiting_documents'?message.trim():'',updatedAt:this.clock(),version:record.version+1};
   this.vault.put('practice',id,updated);this.vault.audit(actor,'practice.status.'+input.status,id);return {...projectPractice(actor,updated),version:updated.version};
  });
 }
 erase(actor,id){
  const record=this.record(actor,id);if(actor.role!=='admin')failure(403,'ADMIN_REQUIRED');
  this.vault.transaction(()=>{for(const doc of this.vault.list('document').filter(d=>d.practiceId===id)){this.vault.remove('document',doc.id);this.vault.remove('content',doc.id);}this.vault.remove('practice',id);this.vault.audit(actor,'practice.erase',record.id)});
  return {erased:true};
 }
}
module.exports={Practices,failure};
