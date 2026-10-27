'use strict';
// Public contact destinations only. Never reuse private account/contact numbers.
const message='Buongiorno, ho una richiesta urgente.\nServizio richiesto:\nBreve descrizione:\nScadenza:\nRecapito per la risposta:\n\nDescrivo qui l’esigenza senza allegare documenti. I PDF saranno caricati nell’area riservata quando richiesti.';
function contactLinks(env=process.env){
 const email=(env.CAF_PUBLIC_CONTACT_EMAIL||'info@puntocittadinoitalia.it').trim();
 if(!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))throw new Error('CAF_PUBLIC_CONTACT_EMAIL non valida');
 // Business number explicitly confirmed by the owner on 17 October 2026.
 const raw=(env.CAF_PUBLIC_WHATSAPP_NUMBER===undefined?'+390806455509':env.CAF_PUBLIC_WHATSAPP_NUMBER).trim();
 const number=raw.replace(/^\+/,'');
 if(raw&&!/^[1-9]\d{6,14}$/.test(number))throw new Error('CAF_PUBLIC_WHATSAPP_NUMBER: usare numero internazionale, senza spazi');
 return {email,emailUrl:'mailto:'+email+'?subject='+encodeURIComponent('Richiesta urgente — Punto Cittadino Italia')+'&body='+encodeURIComponent(message),whatsappUrl:number?'https://wa.me/'+number+'?text='+encodeURIComponent(message):null};
}
function contactSection(links){
 return '<section id="richiesta-urgente" class="cafpc-services-showcase cafpc-urgent-contact" aria-labelledby="cafpc-urgent-title"><p class="cafpc-design-eyebrow">Risposte rapide, assistenza concreta</p><h2 id="cafpc-urgent-title">Hai una pratica urgente? Scrivici.</h2><p>Raccontaci di cosa hai bisogno e indica la scadenza. Ti rispondiamo per iscritto e, se necessario, ti ricontattiamo noi.</p><div class="cafpc-contact-actions">'+(links.whatsappUrl?'<a class="cafpc-contact-whatsapp" href="'+links.whatsappUrl+'" target="_blank" rel="noopener noreferrer">Scrivi su WhatsApp</a>':'')+'<a href="'+links.emailUrl.replace(/&/g,'&amp;')+'">Scrivi via email</a></div><p class="cafpc-explorer-note">Il pulsante apre WhatsApp o una bozza nella tua app email: decidi tu cosa scrivere e quando inviare. Per il primo contatto basta una descrizione; i documenti PDF vanno nell’area riservata. La lavorazione segue l’approvazione delle condizioni e la verifica dell’eventuale versamento.</p></section>';
}
module.exports={contactLinks,contactSection};
