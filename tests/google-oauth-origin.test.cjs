'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {googleRedirectUri}=require('../netlify/functions/google-oauth-config');
const auth=require('../netlify/functions/google-calendar-auth').handler;
const callback=require('../netlify/functions/google-calendar-callback').handler;
const origin='https://puntocittadinoitalia.it';
function configure(t,patch){const saved={};for(const [name,value] of Object.entries(patch)){saved[name]=process.env[name];process.env[name]=value;}t.after(()=>{for(const [name,value] of Object.entries(saved)){if(value===undefined)delete process.env[name];else process.env[name]=value;}});}
test('Historical OAuth retains the legacy origin only when no origin is configured',()=>{
 assert.equal(googleRedirectUri({}),'https://cafpuntocittadino.it/.netlify/functions/google-calendar-callback');
 assert.equal(googleRedirectUri({CAF_ORIGIN:origin}),origin+'/.netlify/functions/google-calendar-callback');
 for(const value of ['',origin+'/',origin+'/path',origin+'?x=1',origin+'#fragment','https://name:secret@puntocittadinoitalia.it','http://puntocittadinoitalia.it',' '+origin])assert.throws(()=>googleRedirectUri({CAF_ORIGIN:value}));
});
test('Authorization and token exchange use exactly the same configured callback without returning credentials',async t=>{
 configure(t,{CAF_ORIGIN:origin,GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-secret'});
 const oldFetch=global.fetch;const calls=[];t.after(()=>{global.fetch=oldFetch});
 global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({refresh_token:'synthetic-refresh'})}};
 const start=await auth();assert.equal(start.statusCode,302);
 const query=new URL(start.headers.Location).searchParams,state=query.get('state');
 assert.equal(query.get('redirect_uri'),googleRedirectUri({CAF_ORIGIN:origin}));
 assert.match(start.headers['Set-Cookie'],new RegExp('oauth_state='+state+';'));
 const result=await callback({httpMethod:'GET',headers:{cookie:'oauth_state='+state},queryStringParameters:{state,code:'synthetic-code'}});
 assert.equal(result.statusCode,200);assert.equal(calls.length,1);
 assert.equal(calls[0].options.body.get('redirect_uri'),query.get('redirect_uri'));
 assert.match(result.body,/non salva il nuovo token/);
 for(const value of ['synthetic-secret','synthetic-refresh','synthetic-code'])assert.equal(JSON.stringify(result).includes(value),false);
});
test('Invalid configured origin blocks both flow stages before contacting Google',async t=>{
 configure(t,{CAF_ORIGIN:origin+'/wrong',GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-secret'});
 const oldFetch=global.fetch;t.after(()=>{global.fetch=oldFetch});global.fetch=()=>{throw Error('Unexpected provider call')};
 assert.equal((await auth()).statusCode,500);const state='a'.repeat(48);
 assert.equal((await callback({httpMethod:'GET',headers:{cookie:'oauth_state='+state},queryStringParameters:{state,code:'synthetic-code'}})).statusCode,500);
});
