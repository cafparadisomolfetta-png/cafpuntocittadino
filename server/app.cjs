'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {failure}=require('./practices.cjs');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
function createApp({practices,identity,publicDirectory,origin,providerHandlers={},retentionPolicy,booking}){
 const allowed=new URL(origin),limits=new Map();let uploads=0;
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
 function rate(req){const key=req.socket.remoteAddress||'unknown';const now=Date.now();for(const [k,v]of limits)if(now-v.start>60000)limits.delete(k);let row=limits.get(key);if(!row){if(limits.size>10000)failure(503,'RATE_LIMIT_CAPACITY');row={start:now,count:0};limits.set(key,row)}if(++row.count>120)failure(429,'RATE_LIMITED');}
 async function body(req,max=32768){const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>max)failure(413,'BODY_TOO_LARGE');chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{failure(400,'INVALID_JSON')}}
 const server=http.createServer(async(req,res)=>{
  function json(code,value){res.writeHead(code,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))}
  try{
   rate(req);const url=new URL(req.url,allowed);if(url.origin!==allowed.origin)failure(400,'INVALID_URL');
   if(req.headers.origin&&req.headers.origin!==allowed.origin)failure(403,'ORIGIN_FORBIDDEN');
   if(url.pathname==='/api/config'&&req.method==='GET')return json(200,{clientId:identity.clientId,privacyVersion:'2026-10-12',services:['730','isee'],sites:['molfetta','bari'],maxFileBytes:10*1024*1024});
   if(url.pathname.startsWith('/api/')){
    const actor=await identity.authenticate(req.headers,req.headers['x-caf-area']||'citizen');
    if(url.pathname==='/api/me'&&req.method==='GET')return json(200,{role:actor.role,sites:actor.sites,email:actor.email});
    if(url.pathname==='/api/booking-reservations'){
     if(!booking)failure(503,'BOOKING_NOT_CONFIGURED');
     if(req.method==='GET')return json(200,{reservations:booking.reservations(actor)});
     if(req.method==='POST'){const payload=await body(req);if(typeof payload.id!=='string'||payload.id.length>100)failure(400,'INVALID_RESERVATION');return json(200,await booking.reconcile(actor,payload.id))}
     failure(405,'METHOD_NOT_ALLOWED');
    }
    if(url.pathname==='/api/retention'){
     if(actor.role!=='admin')failure(403,'ADMIN_REQUIRED');
     if(!retentionPolicy)failure(503,'RETENTION_NOT_CONFIGURED');
     const {retentionPlan,purgeExpired}=require('./retention.cjs');
     if(req.method==='GET')return json(200,{policy:retentionPolicy,expired:retentionPlan(practices.vault,retentionPolicy)});
     if(req.method==='POST'){const payload=await body(req);if(payload.confirmPurge!==true)failure(400,'PURGE_CONFIRMATION_REQUIRED');return json(200,purgeExpired({vault:practices.vault,practices,actor,policy:retentionPolicy}))}
     failure(405,'METHOD_NOT_ALLOWED');
    }
    if(url.pathname==='/api/operators'){
     if(req.method==='GET')return json(200,{operators:identity.list(actor)});
     if(req.method==='POST')return json(200,identity.set(actor,await body(req)));
     failure(405,'METHOD_NOT_ALLOWED');
    }
    if(url.pathname==='/api/practices'){
     if(req.method==='GET')return json(200,{practices:practices.list(actor,url.searchParams.get('site')||undefined)});
     if(req.method==='POST')return json(201,await practices.create(actor,await body(req)));
     failure(405,'METHOD_NOT_ALLOWED');
    }
    const match=/^\/api\/practices\/([a-f0-9-]{36})(?:\/(documents|status)(?:\/([a-f0-9-]{36}))?)?$/.exec(url.pathname);
    if(!match)failure(404,'NOT_FOUND');
    const [,id,action,documentId]=match;
    if(!action&&req.method==='GET')return json(200,practices.detail(actor,id));
    if(!action&&req.method==='DELETE')return json(200,practices.erase(actor,id));
    if(action==='status'&&!documentId&&req.method==='POST')return json(200,practices.changeStatus(actor,id,await body(req)));
    if(action==='documents'&&!documentId&&req.method==='POST'){
     if(!req.headers['content-type']?.startsWith('application/json'))failure(415,'JSON_REQUIRED');
     if(uploads>=2)failure(429,'UPLOAD_CAPACITY');uploads++;try{
     const payload=await body(req,14*1024*1024);
     if(typeof payload.content!=='string'||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload.content))failure(400,'INVALID_ENCODING');
     return json(201,await practices.upload(actor,id,{name:payload.name,mime:payload.mime,bytes:payload.bytes},Buffer.from(payload.content,'base64')));
     }finally{uploads--;}
    }
    if(action==='documents'&&documentId&&req.method==='GET'){
     const doc=practices.download(actor,id,documentId);
     res.writeHead(200,{...headers,'Content-Type':'application/pdf','Content-Length':doc.bytes.length,'Content-Disposition':"attachment; filename=\"documento.pdf\"; filename*=UTF-8''"+encodeURIComponent(doc.name)});return res.end(doc.bytes);
    }
    failure(405,'METHOD_NOT_ALLOWED');
   }
   if(url.pathname.startsWith('/.netlify/functions/')){
    const name=url.pathname.slice('/.netlify/functions/'.length),handler=providerHandlers[name];
    if(!handler)failure(503,'PROVIDER_NOT_CONFIGURED');
    let payload='';if(req.method==='POST')payload=JSON.stringify(await body(req));
    const result=await handler({httpMethod:req.method,headers:req.headers,queryStringParameters:Object.fromEntries(url.searchParams),body:payload});
    res.writeHead(result.statusCode,{...headers,...result.headers});return res.end(result.body);
   }
   if(!['GET','HEAD'].includes(req.method))failure(405,'METHOD_NOT_ALLOWED');
   let name=decodeURIComponent(url.pathname);if(name.endsWith('/'))name+='index.html';
   const target=path.resolve(publicDirectory,'.'+name),root=path.resolve(publicDirectory)+path.sep;
   if(!target.startsWith(root)||!MIME[path.extname(target)]||!fs.existsSync(target)||!fs.statSync(target).isFile())failure(404,'NOT_FOUND');
   // Canonical containment protects against links into private storage.
   if(!fs.realpathSync(target).startsWith(fs.realpathSync(publicDirectory)+path.sep))failure(404,'NOT_FOUND');
   res.writeHead(200,{...headers,'Content-Type':MIME[path.extname(target)]});return req.method==='HEAD'?res.end():fs.createReadStream(target).pipe(res);
  }catch(e){if(!res.headersSent)json(e.status||503,{error:e.code||'SERVICE_UNAVAILABLE'});else res.destroy()}
 });
 server.requestTimeout=45000;server.headersTimeout=10000;
 return server;
}
module.exports={createApp};
