'use strict';
// Test-only preload. Mocks may replace fetch; the real fetch cannot contact a provider.
const original=global.fetch;
global.fetch=async function(input,options){
 let url;try{url=new URL(typeof input==='string'||input instanceof URL?input:input.url)}catch{throw Error('Test request URL invalid')}
 if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('External network blocked during local tests');
 return original(input,options);
};
