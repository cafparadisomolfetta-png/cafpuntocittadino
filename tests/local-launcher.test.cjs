'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {testEnvironment}=require('../tools/collaudo-locale.cjs');
test('Local test launch removes provider secrets and inherited Node preloads',()=>{
 const original={PATH:'system-path',GOOGLE_CLIENT_SECRET:'private',google_refresh_token:'private',OPENAI_API_KEY:'private',CAF_VAULT_KEY:'private',GESTIONALE_ADMIN_EMAIL:'private',NETLIFY_AUTH_TOKEN:'private',NODE_OPTIONS:'--require unsafe',NODE_PATH:'unsafe'};
 const env=testEnvironment(original);assert.equal(env.PATH,'system-path');for(const key of ['GOOGLE_CLIENT_SECRET','google_refresh_token','OPENAI_API_KEY','CAF_VAULT_KEY','GESTIONALE_ADMIN_EMAIL','NETLIFY_AUTH_TOKEN','NODE_PATH'])assert.equal(Object.hasOwn(env,key),false);
 for(const key of ['CAF_PRIVATE_ENABLED','CAF_AI_ENABLED','CAF_AI_SPEND_AUTHORIZED','CAF_MAIL_ENABLED','CAF_JOBS_ENABLED'])assert.equal(env[key],'false');assert.match(env.NODE_OPTIONS,/test-network-guard.cjs/);assert.equal(original.GOOGLE_CLIENT_SECRET,'private');
});
test('Test preload refuses external providers and delegates only local HTTP',async()=>{
 const calls=[],context={URL,global:{fetch:async(input)=>{calls.push(String(input));return 'local-response'}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/test-network-guard.cjs'),'utf8'),context);
 for(const url of ['https://api.openai.com/v1/responses','https://www.googleapis.com/calendar/v3','http://example.test','file:///private'])await assert.rejects(context.global.fetch(url),/External network blocked/);
 assert.equal(calls.length,0);assert.equal(await context.global.fetch('http://127.0.0.1:8080/api/me'),'local-response');assert.equal(calls.length,1);
});
