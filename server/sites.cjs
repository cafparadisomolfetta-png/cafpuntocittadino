'use strict';
const KNOWN_SITES=['molfetta','bari'];
// Launch with Molfetta only. Existing site data is retained for later activation.
function enabledSites(env=process.env){
 let sites;try{sites=JSON.parse(env.CAF_ENABLED_SITES_JSON||'["molfetta"]')}catch{throw Error('Invalid enabled sites configuration')}
 if(!Array.isArray(sites)||!sites.length||!sites.includes('molfetta')||sites.some(site=>!KNOWN_SITES.includes(site))||new Set(sites).size!==sites.length)throw Error('Invalid enabled sites configuration');
 return [...sites];
}
module.exports={enabledSites,KNOWN_SITES};
