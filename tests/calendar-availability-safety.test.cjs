'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {handler}=require('../netlify/functions/calendar-availability.js');

test('availability rejects invalid input without contacting Google',async()=>{
 const oldFetch=global.fetch;
 try{
  global.fetch=async()=>{throw Error('Google must not be called for invalid input')};
  for(const date of [undefined,'2026/10/27','bad']){
   const response=await handler({httpMethod:'GET',queryStringParameters:{date}});
   assert.equal(response.statusCode,400);
  }
 }finally{global.fetch=oldFetch}
});

test('availability rejects another site before contacting Google',async()=>{
 const oldFetch=global.fetch;
 try{
  global.fetch=async()=>{throw Error('Google must not be called for unsupported site')};
  const response=await handler({httpMethod:'GET',queryStringParameters:{date:'2026-10-27',site:'bari'}});
  assert.equal(response.statusCode,400);
 }finally{global.fetch=oldFetch}
});
