'use strict';
// First portable Node.js runtime for staging. This is NOT a production-ready replacement
// for Netlify Functions. All state-changing and personal-data endpoints fail closed.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json'};
function respond(res,status,body,headers={}){
 res.writeHead(status,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});
 res.end(body);
}
function app(req,res){
 const pathname=new URL(req.url||'/', 'http://localhost').pathname;
 if(pathname.startsWith('/.netlify/functions/')||pathname.startsWith('/api/')){
  return respond(res,503,JSON.stringify({ok:false,code:'MIGRATION_NOT_READY',message:'Servizio temporaneamente non disponibile'}),{'Content-Type':'application/json; charset=utf-8'});
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return respond(res,405,'Metodo non consentito',{'Allow':'GET, HEAD'});
 let name;
 try {name=decodeURIComponent(pathname);}catch{return respond(res,400,'URL non valido');}
 if(name.includes('\\')||name.includes('\0')||name.split('/').includes('..'))return respond(res,400,'Percorso non valido');
 if(name==='/')name='/index.html';
 const full=path.resolve(root,'.'+name);
 if(!full.startsWith(root+path.sep))return respond(res,403,'Non autorizzato');
 let stat;
 try{stat=fs.statSync(full);}catch{return respond(res,404,'Risorsa non trovata');}
 if(!stat.isFile())return respond(res,404,'Risorsa non trovata');
 const extension=path.extname(full).toLowerCase();
 if(!Object.hasOwn(types,extension))return respond(res,403,'Tipo file non consentito');
 res.writeHead(200,{'Content-Type':types[extension],'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=60'});
 if(req.method==='HEAD')return res.end();
 fs.createReadStream(full).pipe(res);
}
if(require.main===module){
 const port=Number(process.env.PORT||8080);
 http.createServer(app).listen(port,'127.0.0.1',()=>console.log('Frontend staging on localhost:'+port));
}
module.exports={app};
