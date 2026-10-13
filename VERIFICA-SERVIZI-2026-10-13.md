# Verifica accessi ai servizi — 13 ottobre 2026

## Esito reale, in sola lettura

- Gmail e Google Calendar sono già collegati a ChatGPT Work. I profili restituiti corrispondono allo stesso account CAF.
- La lettura dei calendari è riuscita. Sono presenti un calendario principale di proprietà dell'account e un calendario separato denominato **CAF Punto Cittadino – Bari**, anch'esso di proprietà dell'account. IDs/email privati non sono riportati nel repository.
- La verifica delle disponibilità su entrambi i calendari è riuscita, senza errori del provider, nella finestra 13/10/2026 09:00–11:20 Europe/Rome. Non sono stati letti nomi o dettagli delle pratiche, né creati/modificati/cancellati eventi.
- Il profilo Gmail è leggibile. Nessuna email inviata e nessuna prova di consegna eseguita.

Queste verifiche attestano i collegamenti di Work e la lettura dei servizi. **Non attestano** l'autenticazione OAuth del sito, gli scope Gmail/Calendar del suo runtime, il login dei collaboratori o il collaudo dei suoi endpoint: le credenziali dei collegamenti non sono esportate al codice del sito.

## Configurazione non disponibile nel workspace

Assenti le variabili OAuth Google, login gestionale, chiave/directory del vault e chiave AI. ClamAV non è presente. Nessuna chiave generata o richiesta in chat, nessuna risorsa attivata o acquistata.

La ricerca delle integrazioni non ha restituito un connettore Netlify disponibile. È stato quindi aperto l'accesso alla dashboard tramite il browser, usando la procedura sicura di autenticazione. Il flusso Google è proseguito tramite autenticazione sicura, ma Netlify ha restituito **Authentication Error — Invalid state key**. Una nuova pagina Netlify ha confermato che la sessione non è autenticata. Non è stata ripetuta automaticamente l’autenticazione. È stato aperto il controllo manuale della scheda per l’utente. Nessuna configurazione Netlify letta o modificata e nessuna riattivazione effettuata.

## Passaggio necessario

Completare manualmente l’accesso Netlify nella scheda condivisa permette di proseguire con la lettura della configurazione. Una nuova autorizzazione generale al lavoro non sostituisce l’autenticazione del servizio. Restano fermi il divieto di spesa, il blocco deploy e il requisito di collaudo prima del rilascio.

Il codice verificato rimane sul branch `codex/verifica-sicurezza-2026-10-12`, con 103 test locali superati. Stato tecnico: [VERIFICA-WORK-2026-10-13.md](VERIFICA-WORK-2026-10-13.md).
