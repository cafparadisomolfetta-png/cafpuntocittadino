# Promemoria WhatsApp — stato di implementazione

14 ottobre 2026. Modulo opzionale `server/whatsapp.cjs`, con sei test sintetici. Nessun account aperto, spesa, messaggio reale, pubblicazione o modifica del numero della sede. Gli SMS restano esclusi.

## Cosa è implementato

L'adattatore Twilio usa esclusivamente un template approvato (ContentSid), un Messaging Service e due variabili: sede Molfetta e data/ora Europe/Rome. Il template effettivo deve contenere solo il promemoria concordato, senza dati sanitari, codici fiscali, documenti o codici di disdetta.

Prima di ogni chiamata rilegge il consenso tramite una funzione server `consentFor(subject)`. Richiede corrispondenza di assistito/numero, finalità promemoria, versione informativa, data consenso e verifica del numero; una revoca blocca l'invio. La funzione deve accedere a dati verificati sul server: non va sostituita con valori provenienti direttamente dal browser, flag di un evento Calendar o una checkbox senza verifica.

Gli errori restituiscono codici fissi, senza credenziali, testo provider o destinatario. Timeout, errori server e risposte ambigue sono incerti e non vengono ritentati internamente. L'accettazione API viene indicata come `accepted`: non significa consegna al destinatario.

## Cosa manca per renderlo operativo

- Raccolta e revoca del consenso nel portale, verifica effettiva del numero, archivio cifrato e retention approvata.
- Collegamento alle prenotazioni e coda persistente: deduplica, controlli su spostamenti/disdette, quote di consumo e riconciliazione senza reinvii dopo esiti incerti.
- Account/numero WhatsApp Business Platform, Messaging Service e template approvato. L'app WhatsApp Business esistente non dimostra questa configurazione o la compatibilità sullo stesso numero.
- Callback di consegna con verifica della firma, aggiornamento degli stati e minimizzazione dei log. Non esiste ancora un endpoint webhook.
- Revisione del fornitore e dei costi; prova reale esclusivamente con destinatario di collaudo autorizzato.

L'adattatore non è importato dal runtime `server/main.cjs`: non è una funzionalità già collegata alle prenotazioni. Nessun segreto Twilio è richiesto per eseguire i test.

## Configurazione futura, solo dopo collaudo

Le flag `CAF_WHATSAPP_ENABLED`, `CAF_WHATSAPP_SPEND_AUTHORIZED` e `CAF_WHATSAPP_REVIEWED` devono essere tutte esplicitamente true per permettere una chiamata. Non abilitarle per aggirare i prerequisiti. La configurazione privata richiederà `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` e `CAF_WHATSAPP_REMINDER_CONTENT_SID`; nessun valore va in chat, GitHub o nel frontend. Queste flag non costituiscono da sole un limite monetario.

La segretaria che risponde ai messaggi e quella telefonica sono sviluppi distinti dall'invio di un promemoria. Questo modulo non le implementa e non attiva chiamate OpenAI.

Fonti del contratto API: [Twilio Messages](https://www.twilio.com/docs/messaging/api/message-resource) e [template WhatsApp](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates).
