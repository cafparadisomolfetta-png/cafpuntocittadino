'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {validateRequest,validateFileMetadata,hasPdfSignature,MAX_FILE_BYTES}=require('../netlify/functions/pratiche-validation');
test('direct 730 and ISEE requests are supported for both sites',()=>{
 for(const site of ['molfetta','bari'])for(const service of ['730','isee'])
  assert.equal(validateRequest({site,service,mode:'direct'}).ok,true);
});
test('appointment request requires a nontrivial reference',()=>{
 assert.equal(validateRequest({site:'molfetta',service:'730',mode:'appointment',appointmentId:'ref_1234567890123456'}).ok,true);
 assert.equal(validateRequest({site:'molfetta',service:'730',mode:'appointment',appointmentId:'123'}).ok,false);
});
test('reject unknown sites, services, and extra appointment refs',()=>{
 assert.equal(validateRequest({site:'other',service:'730',mode:'direct'}).ok,false);
 assert.equal(validateRequest({site:'bari',service:'unknown',mode:'direct'}).ok,false);
 assert.equal(validateRequest({site:'bari',service:'isee',mode:'direct',appointmentId:'ref_1234567890123456'}).ok,false);
});
test('allow bounded PDF metadata only',()=>{
 assert.equal(validateFileMetadata({name:'730.pdf',mime:'application/pdf',bytes:12345}).ok,true);
 assert.equal(validateFileMetadata({name:'isee.pdf',mime:'application/pdf',bytes:MAX_FILE_BYTES}).ok,true);
 assert.equal(validateFileMetadata({name:'isee.jpg',mime:'image/jpeg',bytes:1234}).ok,false);
 assert.equal(validateFileMetadata({name:'isee.png',mime:'image/png',bytes:1234}).ok,false);
 assert.equal(validateFileMetadata({name:'a.pdf',mime:'application/pdf',bytes:MAX_FILE_BYTES+1}).ok,false);
 assert.equal(validateFileMetadata({name:'malware.exe',mime:'application/octet-stream',bytes:200}).ok,false);
 assert.equal(validateFileMetadata({name:'../other.pdf',mime:'application/pdf',bytes:100}).ok,false);
});

test('reject non-PDF extensions even with PDF MIME metadata',()=>{
 assert.equal(validateFileMetadata({name:'scan.jpg',mime:'application/pdf',bytes:123}).ok,false);
 assert.equal(validateFileMetadata({name:'scan.PDF',mime:'application/pdf',bytes:123}).ok,true);
});
test('recognize PDF header bytes and reject disguised content',()=>{
 assert.equal(hasPdfSignature(Buffer.from('%PDF-1.7\n')),true);
 assert.equal(hasPdfSignature(Buffer.from('NOT A PDF')),false);
 assert.equal(hasPdfSignature(Buffer.alloc(0)),false);
});
