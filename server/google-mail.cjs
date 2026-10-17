'use strict';
function googleMail({env,fetcher=fetch}){
 return async({to,subject,text})=>{
  if(env.CAF_MAIL_ENABLED!=='true')throw Object.assign(Error('Mail disabled'),{definitive:true});
  const sender=env.CAF_SENDER_EMAIL;
  for(const email of [sender,to])if(typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Object.assign(Error('Invalid address'),{definitive:true});
  const credentials=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID||'',client_secret:env.GOOGLE_CLIENT_SECRET||'',refresh_token:env.GOOGLE_REFRESH_TOKEN||'',grant_type:'refresh_token'});
  let access;try{const token=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:credentials,signal:AbortSignal.timeout(6500)});const data=await token.json();if(!token.ok||!data.access_token)throw Error('Token unavailable');access=data.access_token}catch{throw Object.assign(Error('Mail authorization unavailable'),{definitive:true})}
  const message=[`From: Punto Cittadino Italia <${sender}>`,`To: ${to}`,'Subject: =?UTF-8?B?'+Buffer.from(subject).toString('base64')+'?=','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',Buffer.from(text).toString('base64')].join('\r\n');
  const r=await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({raw:Buffer.from(message).toString('base64url')}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Object.assign(Error('Mail delivery rejected'),{definitive:[400,401,403,404,429].includes(r.status)});
  const result=await r.json();if(typeof result.id!=='string'||!result.id)throw Error('Mail delivery outcome uncertain');return {id:result.id};
 };
}
module.exports={googleMail};
