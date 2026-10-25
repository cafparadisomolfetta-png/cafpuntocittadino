'use strict';
// Temporary, root-operated provisioning service. Never mount in the public app.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const ORIGIN='https://puntocittadinoitalia.it';
const CALLBACK='/.netlify/functions/google-calendar-callback';
const SCOPES=['https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/gmail.send'];
const COOKIE='__Host-punto_google_setup';
const safeToken=value=>typeof value==='string'&&value.length>=20&&value.length<=8192&&/^[A-Za-z0-9._~+/=-]+$/.test(value);
const same=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&crypto.timingSafeEqual(left,right);};

function storeRefreshToken(file,{clientId,clientSecret,refreshToken}){
 if(!safeToken(refreshToken))throw Error('invalid_token');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 let source,info;
 try{info=fs.fstatSync(fd);if(!info.isFile()||info.uid!==0||(info.mode&0o777)!==0o600)throw Error('private_file_required');source=fs.readFileSync(fd,'utf8');}finally{fs.closeSync(fd);}
 const lines=source.split(/\r?\n/);
 const read=key=>{const rows=lines.filter(line=>line.startsWith(key+'='));if(rows.length!==1)throw Error('invalid_configuration');return rows[0].slice(key.length+1);};
 if(!same(read('GOOGLE_CLIENT_ID'),clientId)||!same(read('GOOGLE_CLIENT_SECRET'),clientSecret))throw Error('configuration_changed');
 read('GOOGLE_REFRESH_TOKEN');
 const next=lines.map(line=>line.startsWith('GOOGLE_REFRESH_TOKEN=')?'GOOGLE_REFRESH_TOKEN='+refreshToken:line).join('\n');
 const temporary=path.join(path.dirname(file),'.google-token-'+crypto.randomBytes(16).toString('hex'));
 let out;
 try{
  out=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  fs.fchownSync(out,info.uid,info.gid);fs.writeFileSync(out,next,'utf8');fs.fsyncSync(out);fs.closeSync(out);out=undefined;
  fs.renameSync(temporary,file);
  const directory=fs.openSync(path.dirname(file),fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(directory);}finally{fs.closeSync(directory);}
 }finally{if(out!==undefined)fs.closeSync(out);if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}

class SetupSession{
 constructor({key,clientId,clientSecret,administrator,envFile,providerFetch=fetch,now=Date.now,save=storeRefreshToken}){
  if(!/^[a-f0-9]{48}$/.test(key||'')||!/^167971566129-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(clientId||'')||!safeToken(clientSecret)||administrator!=='cafparadiso.molfetta@gmail.com')throw Error('invalid_setup_configuration');
  Object.assign(this,{key,clientId,clientSecret,administrator,envFile,providerFetch,now,save});
  this.expires=now()+15*60*1000;this.started=false;this.used=false;
  this.state=crypto.randomBytes(32).toString('base64url');this.cookie=crypto.randomBytes(32).toString('base64url');this.verifier=crypto.randomBytes(32).toString('base64url');
 }
 result(status,text,extra={}){return {status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'",'X-Content-Type-Options':'nosniff',...extra},body:'<!doctype html><html lang="it"><meta charset="utf-8"><title>Collegamento Google</title><h1>'+text+'</h1></html>'};}
 async json(url,options){const response=await this.providerFetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('provider_failed');const text=await response.text();if(text.length>32768)throw Error('provider_response_invalid');return JSON.parse(text);}
 async handle({method,url,host,cookie=''}){
  if(host!=='puntocittadinoitalia.it')return this.result(400,'Richiesta non valida');
  if(method!=='GET')return this.result(405,'Metodo non consentito',{Allow:'GET'});
  if(this.now()>this.expires||this.used)return this.result(410,'Procedura terminata o scaduta');
  if(typeof url!=='string'||url.length>12288||!url.startsWith('/')||url.startsWith('//'))return this.result(400,'Richiesta non valida');
  const parsed=new URL(url,ORIGIN);
  if(parsed.pathname==='/__google_setup/'+this.key&&parsed.search===''){
   if(this.started)return this.result(409,'Procedura gia avviata');
   this.started=true;
   const params=new URLSearchParams({client_id:this.clientId,redirect_uri:ORIGIN+CALLBACK,response_type:'code',scope:SCOPES.join(' '),access_type:'offline',prompt:'consent',login_hint:this.administrator,state:this.state,code_challenge:crypto.createHash('sha256').update(this.verifier).digest('base64url'),code_challenge_method:'S256'});
   return this.result(302,'Apertura Google',{Location:'https://accounts.google.com/o/oauth2/v2/auth?'+params,'Set-Cookie':`${COOKIE}=${this.cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900`});
  }
  if(parsed.pathname!==CALLBACK)return this.result(404,'Pagina non disponibile');
  const pairs=String(cookie).split(';').map(item=>item.trim()).filter(item=>item.startsWith(COOKIE+'='));
  const values=parsed.searchParams;
  if(!this.started||values.getAll('state').length!==1||!same(values.get('state'),this.state)||pairs.length!==1||!same(pairs[0].slice(COOKIE.length+1),this.cookie))return this.result(400,'Sessione non valida');
  if(values.getAll('code').length>1||values.getAll('error').length>1)return this.result(400,'Richiesta non valida');
  this.used=true;
  const clear={'Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`};
  const code=values.get('code');
  if(values.has('error')||!code||code.length>4096||/[\x00-\x20\x7f]/.test(code))return this.result(400,'Autorizzazione non completata',clear);
  try{
   const tokens=await this.json('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,client_id:this.clientId,client_secret:this.clientSecret,redirect_uri:ORIGIN+CALLBACK,code_verifier:this.verifier}).toString()});
   const scopes=new Set(String(tokens.scope||'').split(' '));
   if(!safeToken(tokens.refresh_token)||!safeToken(tokens.access_token)||String(tokens.token_type).toLowerCase()!=='bearer'||!SCOPES.every(scope=>scopes.has(scope)))throw Error('incomplete_authorization');
   const account=await this.json('https://www.googleapis.com/calendar/v3/calendars/primary',{headers:{Authorization:'Bearer '+tokens.access_token}});
   if(account.id!==this.administrator)throw Error('wrong_account');
   this.save(this.envFile,{clientId:this.clientId,clientSecret:this.clientSecret,refreshToken:tokens.refresh_token});
   this.completed=true;
   return this.result(200,'Google collegato. Puoi tornare alla configurazione del sito.',clear);
  }catch{return this.result(400,'Collegamento non completato. Configurazione privata non aggiornata.',clear);}
 }
}

function createServer(session){
 const server=http.createServer(async(req,res)=>{
  try{const result=await session.handle({method:req.method,url:req.url,host:req.headers.host,cookie:req.headers.cookie});res.writeHead(result.status,result.headers);res.end(result.body);if(session.completed&&!session.notified){session.notified=true;console.log('GOOGLE_SETUP_TOKEN_SAVED');}}
  catch{res.writeHead(500,{'Cache-Control':'no-store','Content-Type':'text/plain'});res.end('Procedura non disponibile');}
 });
 server.headersTimeout=10000;server.requestTimeout=15000;server.maxHeadersCount=30;
 server.on('clientError',(_error,socket)=>socket.destroy());
 return server;
}

if(require.main===module){
 try{
  if(process.getuid()!==0||process.env.CAF_ORIGIN!==ORIGIN)throw Error('private_setup_required');
  const session=new SetupSession({key:process.argv[2],clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,administrator:process.env.GESTIONALE_ADMIN_EMAIL,envFile:'/etc/cafpuntocittadino/runtime.env'});
  const server=createServer(session);server.listen(8090,'127.0.0.1',()=>console.log('GOOGLE_SETUP_READY: loopback 8090; durata 15 minuti; nessun dato segreto nei log.'));
  server.on('error',()=>{console.error('GOOGLE_SETUP_UNAVAILABLE');process.exitCode=1;});
  setTimeout(()=>{server.close();console.log(session.completed?'GOOGLE_SETUP_SAVED':'GOOGLE_SETUP_CLOSED_WITHOUT_TOKEN');},15*60*1000).unref();
 }catch{console.error('GOOGLE_SETUP_CONFIGURATION_INVALID');process.exitCode=1;}
}
module.exports={SetupSession,createServer,storeRefreshToken,SCOPES,COOKIE,CALLBACK};
