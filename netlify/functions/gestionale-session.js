'use strict';
const reply=(status,body)=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(body)});
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 const client=process.env.GESTIONALE_GOOGLE_CLIENT_ID;
 if(!client||!process.env.GESTIONALE_OPERATORS_JSON)return reply(503,{authenticated:false,error:'AUTH_NOT_CONFIGURED'});
 return reply(200,{configured:true,clientId:client,authenticated:false});
};