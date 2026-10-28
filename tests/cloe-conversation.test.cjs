'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
test('Cloe includes the current question after previous conversation turns',async()=>{
 const {default:handler}=await import('../netlify/functions/segretaria-ai.mjs');
 const previousKey=process.env.OPENAI_API_KEY;
 const previousModel=process.env.OPENAI_MODEL;
 const previousFetch=global.fetch;
 try{
  process.env.OPENAI_API_KEY='test-not-real';
  process.env.OPENAI_MODEL='test-model';
  let payload;
  global.fetch=async (_url,opts)=>{
   payload=JSON.parse(opts.body);
   return {ok:true,json:async()=>({output_text:'Risposta dimostrativa'})};
  };
  const req=new Request('https://example.org/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Domanda nuova',history:[{role:'user',content:'Domanda precedente'},{role:'assistant',content:'Risposta precedente'}]})});
  const res=await handler(req);
  assert.equal(res.status,200);
  assert.equal(payload.model,'test-model');
  assert.deepEqual(payload.input.at(-1),{role:'user',content:'Domanda nuova'});
  assert.equal(payload.store,false);
 }finally{
  global.fetch=previousFetch;
  if(previousKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previousKey;
  if(previousModel===undefined)delete process.env.OPENAI_MODEL;else process.env.OPENAI_MODEL=previousModel;
 }
});
