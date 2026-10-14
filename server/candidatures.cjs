'use strict';
const crypto=require('node:crypto');
const {failure}=require('./practices.cjs'),{scanPdf}=require('./pdf.cjs');
const TYPES=['Tirocinio curriculare','Tirocinio extracurriculare','Collaborazione','Ho già una struttura e voglio collaborare','Voglio iniziare un percorso con voi'];
const TRANSITIONS={received:['in_review','archived'],in_review:['contacted','archived'],contacted:['archived'],archived:[]};
class Candidatures{
 constructor({vault,scan,retentionDays,activeSites=['molfetta','bari'],clock=()=>new Date().toISOString()}){
  if(typeof scan!=='function'||!Number.isInteger(retentionDays)||retentionDays<1||retentionDays>36500)throw Error('Scanner and approved CV retention duration required');
  this.activeSites=[...activeSites];this.vault=vault;this.scan=scan;this.retentionDays=retentionDays;this.clock=clock;
 }
 actor(actor){if(!actor?.authenticated||!actor.subject)failure(401,'UNAUTHORIZED');}
 allowed(actor,row){return this.activeSites.includes(row.site)&&actor?.authenticated&&(actor.role==='admin'||(actor.role==='citizen'&&actor.subject===row.ownerSubject));}
 projection(actor,row){const result={id:row.id,site:row.site,type:row.type,status:row.status,createdAt:row.createdAt,updatedAt:row.updatedAt,version:row.version,fileName:row.fileName};if(actor.role==='admin')Object.assign(result,{name:row.name,surname:row.surname,email:row.email,phone:row.phone,presentation:row.presentation});return result;}
 get(actor,id){this.actor(actor);const row=this.vault.get('candidature',id);if(!row||!this.allowed(actor,row))failure(404,'CANDIDATURE_NOT_FOUND');return row;}
 list(actor){this.actor(actor);if(!['admin','citizen'].includes(actor.role))failure(403,'ADMIN_REQUIRED');this.vault.transaction(()=>this.vault.audit(actor,'candidature.list','list'));return this.vault.list('candidature').filter(row=>this.allowed(actor,row)).map(row=>this.projection(actor,row));}
 async submit(actor,input,bytes){
  this.actor(actor);if(actor.role!=='citizen')failure(403,'CITIZEN_REQUIRED');
  if(!input||!this.activeSites.includes(input.site)||!TYPES.includes(input.type))failure(400,'INVALID_CANDIDATURE');
  for(const [field,max] of [['name',100],['surname',100],['phone',30],['presentation',2000]])if(typeof input[field]!=='string'||input[field].length>max||/[\x00-\x08\x0b-\x1f\x7f]/.test(input[field]))failure(400,'INVALID_CANDIDATURE');
  if(!input.name.trim()||!input.surname.trim()||(!/^[+0-9 ().-]{5,30}$/.test(input.phone)||input.phone.replace(/\D/g,'').length<5)||typeof actor.email!=='string')failure(400,'INVALID_CANDIDATURE');
  if(input.privacyVersion!=='2026-10-12'||input.privacyAcknowledged!==true)failure(400,'PRIVACY_ACKNOWLEDGEMENT_REQUIRED');
  await scanPdf(this.scan,{name:input.fileName,mime:input.mime,bytes:input.bytes},bytes,5*1024*1024);
  const digest=crypto.createHash('sha256').update(bytes).digest('hex'),id=crypto.randomUUID(),now=this.clock();
  const row={id,ownerSubject:actor.subject,email:actor.email,site:input.site,type:input.type,name:input.name.trim(),surname:input.surname.trim(),phone:input.phone.trim(),presentation:input.presentation.trim(),fileName:input.fileName,size:bytes.length,sha256:digest,status:'received',version:1,createdAt:now,updatedAt:now,privacyVersion:input.privacyVersion,privacyAcknowledgedAt:now};
  this.vault.transaction(()=>{const existing=this.vault.list('candidature').filter(x=>x.ownerSubject===actor.subject);if(existing.length>=20)failure(409,'CANDIDATURE_LIMIT');if(existing.some(x=>x.sha256===digest&&x.type===input.type&&x.site===input.site))failure(409,'DUPLICATE_CANDIDATURE');this.vault.put('candidature',id,row);this.vault.put('cv-content',id,{content:bytes.toString('base64')});this.vault.audit(actor,'candidature.submit',id)});
  return this.projection(actor,row);
 }
 download(actor,id){const row=this.get(actor,id),bytes=Buffer.from(this.vault.get('cv-content',id)?.content||'','base64');if(crypto.createHash('sha256').update(bytes).digest('hex')!==row.sha256)failure(503,'DOCUMENT_INTEGRITY_ERROR');this.vault.transaction(()=>this.vault.audit(actor,'candidature.download',id));return {bytes,name:row.fileName};}
 status(actor,id,input){this.actor(actor);if(actor.role!=='admin')failure(403,'ADMIN_REQUIRED');if(!input||!Number.isSafeInteger(input.version))failure(400,'VERSION_REQUIRED');return this.vault.transaction(()=>{const row=this.get(actor,id);if(row.version!==input.version)failure(409,'VERSION_CONFLICT');if(!TRANSITIONS[row.status]?.includes(input.status))failure(400,'INVALID_TRANSITION');const next={...row,status:input.status,version:row.version+1,updatedAt:this.clock()};this.vault.put('candidature',id,next);this.vault.audit(actor,'candidature.status',id);return this.projection(actor,next)});}
 erase(actor,id){this.get(actor,id);if(actor.role!=='admin')failure(403,'ADMIN_REQUIRED');this.vault.transaction(()=>{this.vault.remove('candidature',id);this.vault.remove('cv-content',id);this.vault.audit(actor,'candidature.erase',id)});return {erased:true};}
 expired(now=Date.now()){return this.vault.list('candidature').filter(row=>now-Date.parse(row.createdAt)>=this.retentionDays*86400000).map(({id,createdAt})=>({id,createdAt}));}
 purge(actor){this.actor(actor);if(actor.role!=='admin')failure(403,'ADMIN_REQUIRED');const plan=this.expired();this.vault.transaction(()=>{for(const row of plan){this.vault.remove('candidature',row.id);this.vault.remove('cv-content',row.id);this.vault.audit(actor,'candidature.retention_purge',row.id)}});return {erased:plan.length};}
}
module.exports={Candidatures,TYPES,TRANSITIONS};
