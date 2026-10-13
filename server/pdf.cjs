'use strict';
const {validateFileMetadata,hasPdfSignature,MAX_FILE_BYTES}=require('../netlify/functions/pratiche-validation');
function invalid(status,code){throw Object.assign(Error(code),{status,code})}
async function scanPdf(scan,metadata,bytes,maxBytes=MAX_FILE_BYTES){
 const valid=validateFileMetadata(metadata);if(!valid.ok)invalid(400,valid.error);
 if(!Buffer.isBuffer(bytes))invalid(400,'INVALID_PDF_CONTENT');
 if(bytes.length>maxBytes)invalid(400,'INVALID_FILE_SIZE');
 if(!Buffer.isBuffer(bytes)||bytes.length!==metadata.bytes||!hasPdfSignature(bytes)||!bytes.subarray(-1024).includes(Buffer.from('%%EOF')))invalid(400,'INVALID_PDF_CONTENT');
 if(/\/(?:JavaScript|JS|Launch|EmbeddedFile)\b/.test(bytes.toString('latin1')))invalid(400,'ACTIVE_PDF_NOT_ALLOWED');
 let result;try{result=await scan(bytes)}catch{invalid(503,'SCANNER_UNAVAILABLE')}
 if(result!=='clean')invalid(result==='infected'?400:503,result==='infected'?'UNSAFE_DOCUMENT':'SCANNER_UNAVAILABLE');
}
module.exports={scanPdf};
