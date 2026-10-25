'use strict';
// Read-only provider check. Outputs booleans only, never tokens or calendar data.
const {SCOPES}=require('./google-setup.cjs');
async function checkGoogle(env=process.env,fetcher=fetch){
 const result={refresh:false,scopes:false,calendarAccount:false};
 try{
  if(!['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','GESTIONALE_ADMIN_EMAIL'].every(key=>typeof env[key]==='string'&&env[key].length))return result;
  const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:env.GOOGLE_REFRESH_TOKEN}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)return result;
  const token=await response.json();result.refresh=typeof token.access_token==='string'&&token.access_token.length>20;
  if(!result.refresh)return result;
  const scopes=new Set(String(token.scope||'').split(' '));result.scopes=SCOPES.every(scope=>scopes.has(scope));
  if(!result.scopes)return result;
  const calendar=await fetcher('https://www.googleapis.com/calendar/v3/calendars/primary',{redirect:'error',headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(10000)});
  if(!calendar.ok)return result;
  const data=await calendar.json();result.calendarAccount=data.id===env.GESTIONALE_ADMIN_EMAIL;
 }catch{}
 return result;
}
if(require.main===module)checkGoogle().then(result=>{console.log(JSON.stringify(result));process.exitCode=Object.values(result).every(value=>value===true)?0:1;});
module.exports={checkGoogle};
