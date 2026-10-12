'use strict';
// Shared input validation for future document-intake endpoints.
// No upload, storage, or external transmission is implemented here.
const SITES=Object.freeze(['molfetta','bari']);
const SERVICES=Object.freeze(['730','isee']);
const MODES=Object.freeze(['appointment','direct']);
const MAX_FILE_BYTES=10*1024*1024;
const MAX_FILES=20;
const ALLOWED_MIME=Object.freeze(['application/pdf','image/jpeg','image/png']);
function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
function validateRequest(input){
 if(!isPlainObject(input))return {ok:false,error:'INVALID_REQUEST'};
 if(!SITES.includes(input.site))return {ok:false,error:'INVALID_SITE'};
 if(!SERVICES.includes(input.service))return {ok:false,error:'INVALID_SERVICE'};
 if(!MODES.includes(input.mode))return {ok:false,error:'INVALID_MODE'};
 if(input.mode==='appointment'&&(!Number.isSafeInteger(input.appointmentId?.length)||typeof input.appointmentId!=='string'||input.appointmentId.length<16||input.appointmentId.length>160||!/^[A-Za-z0-9_-]+$/.test(input.appointmentId)))return {ok:false,error:'INVALID_APPOINTMENT_REFERENCE'};
 if(input.mode==='direct'&&input.appointmentId!==undefined)return {ok:false,error:'UNEXPECTED_APPOINTMENT_REFERENCE'};
 return {ok:true,site:input.site,service:input.service,mode:input.mode};
}
function validateFileMetadata(input){
 if(!isPlainObject(input))return {ok:false,error:'INVALID_FILE'};
 if(!ALLOWED_MIME.includes(input.mime))return {ok:false,error:'INVALID_FILE_TYPE'};
 if(!Number.isSafeInteger(input.bytes)||input.bytes<=0||input.bytes>MAX_FILE_BYTES)return {ok:false,error:'INVALID_FILE_SIZE'};
 if(typeof input.name!=='string'||input.name.length<1||input.name.length>180||/[\\/\x00-\x1f\x7f]/.test(input.name)||input.name==='.'||input.name==='..')return {ok:false,error:'INVALID_FILE_NAME'};
 return {ok:true,mime:input.mime,bytes:input.bytes};
}
module.exports={SITES,SERVICES,MODES,MAX_FILE_BYTES,MAX_FILES,ALLOWED_MIME,validateRequest,validateFileMetadata};
