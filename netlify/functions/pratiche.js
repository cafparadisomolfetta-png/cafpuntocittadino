'use strict';
// Explicitly disabled until authenticated intake, private storage, malware scanning,
// audit logging, retention and a reviewed privacy notice are in place.
// Do not enable by changing an environment flag alone.
exports.handler=async function handler(event){
 const method=(event&&event.httpMethod)||'GET';
 if(method==='OPTIONS')return {statusCode:405,headers:{'Allow':'GET, POST','Cache-Control':'no-store'},body:''};
 return {
  statusCode:503,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
  body:JSON.stringify({ok:false,code:'PRACTICES_NOT_ACTIVE',message:'Il servizio di invio documenti non è ancora attivo. Non inviare dati personali tramite questo indirizzo.'})
 };
};
