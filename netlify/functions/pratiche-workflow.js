'use strict';
// Practice lifecycle: pure validation helpers, no persistence or network calls.
const STATES=Object.freeze(['received','in_review','awaiting_documents','completed','rejected']);
const TRANSITIONS=Object.freeze({
 received:Object.freeze(['in_review','awaiting_documents','rejected']),
 in_review:Object.freeze(['awaiting_documents','completed','rejected']),
 awaiting_documents:Object.freeze(['in_review','rejected']),
 completed:Object.freeze([]),
 rejected:Object.freeze([])
});
function canTransition(from,to){return typeof from==='string'&&typeof to==='string'&&Array.isArray(TRANSITIONS[from])&&TRANSITIONS[from].includes(to);}
function canAccessPractice(actor,practice){
 if(!actor||!practice||!STATES.includes(practice.status)||!['molfetta','bari'].includes(practice.site))return false;
 if(actor.role==='admin')return actor.authenticated===true;
 if(actor.role==='operator')return actor.authenticated===true&&Array.isArray(actor.sites)&&actor.sites.includes(practice.site);
 if(actor.role==='citizen')return actor.authenticated===true&&typeof actor.subject==='string'&&actor.subject.length>0&&actor.subject===practice.ownerSubject;
 return false;
}
function publicStatus(status){
 const names={received:'Ricevuta',in_review:'In lavorazione',awaiting_documents:'In attesa di integrazione',completed:'Completata',rejected:'Non accolta'};
 return names[status]||null;
}
module.exports={STATES,TRANSITIONS,canTransition,canAccessPractice,publicStatus};
