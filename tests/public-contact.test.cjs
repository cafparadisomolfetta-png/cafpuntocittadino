'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {contactLinks,contactSection}=require('../public-contact.cjs');
test('Written urgent contact opens a user-controlled email draft and only the configured WhatsApp destination',()=>{
 const links=contactLinks({CAF_PUBLIC_CONTACT_EMAIL:'sportello@example.invalid',CAF_PUBLIC_WHATSAPP_NUMBER:'+390000000000'});
 const mail=new URL(links.emailUrl),wa=new URL(links.whatsappUrl);
 assert.equal(mail.protocol,'mailto:');assert.equal(mail.pathname,'sportello@example.invalid');assert.match(mail.searchParams.get('subject'),/Richiesta urgente/);assert.match(mail.searchParams.get('body'),/Scadenza:/);
 assert.equal(wa.hostname,'wa.me');assert.equal(wa.pathname,'/390000000000');assert.match(wa.searchParams.get('text'),/senza allegare documenti/);
 const html=contactSection(links);assert.match(html,/Scrivi su WhatsApp/);assert.match(html,/Scrivi via email/);assert.ok(!html.includes('tel:'));assert.match(html,/ti ricontattiamo noi/);
});
test('Missing WhatsApp configuration does not send urgent requests to a guessed or private number',()=>{
 assert.equal(new URL(contactLinks({}).whatsappUrl).pathname,'/390806455509');
 const links=contactLinks({CAF_PUBLIC_WHATSAPP_NUMBER:''});assert.equal(links.whatsappUrl,null);assert.ok(!contactSection(links).includes('wa.me/'));assert.match(contactSection(links),/mailto:info@puntocittadinoitalia.it/);
 for(const number of ['javascript:alert(1)','+39 123 456','39000?text=other','0000000'])assert.throws(()=>contactLinks({CAF_PUBLIC_WHATSAPP_NUMBER:number}));
 assert.throws(()=>contactLinks({CAF_PUBLIC_CONTACT_EMAIL:'a@example.invalid\nBcc:b@example.invalid'}));
});
