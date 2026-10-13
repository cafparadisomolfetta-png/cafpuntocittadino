# Verifica accessi ai servizi — 13 ottobre 2026

## Esito reale, in sola lettura

- Gmail e Google Calendar sono già collegati a ChatGPT Work. I profili restituiti corrispondono allo stesso account CAF.
- La lettura dei calendari è riuscita. Sono presenti un calendario principale di proprietà dell'account e un calendario separato denominato **CAF Punto Cittadino – Bari**, anch'esso di proprietà dell'account. IDs/email privati non sono riportati nel repository.
- La verifica delle disponibilità su entrambi i calendari è riuscita, senza errori del provider, nella finestra 13/10/2026 09:00–11:20 Europe/Rome. Non sono stati letti nomi o dettagli delle pratiche, né creati/modificati/cancellati eventi.
- Il profilo Gmail è leggibile. Nessuna email inviata e nessuna prova di consegna eseguita.

Queste verifiche attestano i collegamenti di Work e la lettura dei servizi. **Non attestano** l'autenticazione OAuth del sito, gli scope Gmail/Calendar del suo runtime, il login dei collaboratori o il collaudo dei suoi endpoint: le credenziali dei collegamenti non sono esportate al codice del sito.

## Configurazione non disponibile nel workspace

Assenti le variabili OAuth Google, login gestionale, chiave/directory del vault e chiave AI. ClamAV non è presente. Nessuna chiave generata o richiesta in chat, nessuna risorsa attivata o acquistata.

La ricerca delle integrazioni non ha restituito un connettore Netlify disponibile. Dopo l'errore iniziale **Invalid state key**, l'utente ha completato manualmente l'accesso. La dashboard autenticata è stata verificata e la configurazione è stata letta senza modificarla. Nessuna riattivazione effettuata.

## Configurazione Netlify verificata dopo l'accesso

- Il progetto corrisponde al repository richiesto ed è **disabilitato**. Il team ha superato il limite crediti; progetti e deploy risultano sospesi. Nessun acquisto o cambio piano effettuato.
- Il deploy indicato dalla dashboard come attualmente pubblicato è `main@901bb799c254a3a4e6f83cbf012a2919dba7da2a`, del giorno 11 ottobre. Non contiene il lavoro sul branch `codex/verifica-sicurezza-2026-10-12`.
- Il branch produzione è `main`; la pubblicazione automatica è attiva, i branch deploy sono limitati a `test-pagamento` e i Deploy Preview sono configurati per le pull request verso tali branch. Nessuna pull request aperta e nessun deploy avviato durante questa verifica.
- La UI mostra base `/`, comando build e directory pubblicazione non impostati, funzioni `netlify/functions`, stato build attivo e log pubblici. Sono valori mostrati dalla UI: non sono una verifica della configurazione effettiva risultante da `netlify.toml` in un futuro deploy. Il blocco `ignore = "exit 0"` resta nel branch di lavoro.
- Risultano presenti i nomi `GESTIONALE_ADMIN_EMAIL`, `GESTIONALE_GOOGLE_CLIENT_ID`, `GESTIONALE_OPERATORS_JSON`, `GESTIONALE_SITE_CALENDARS_JSON`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` e `OPENAI_API_KEY`. I valori non sono stati aperti, copiati o esportati. La presenza non certifica validità, scope, ruoli o uso sicuro; la chiave AI non è stata utilizzata.
- `cafpuntocittadino.it` è il dominio principale; `www.cafpuntocittadino.it` è configurato per il redirect. La dashboard indica Netlify DNS e HTTPS abilitato con Let's Encrypt per entrambi i domini. Non è stata eseguita una prova end-to-end del sito sospeso e nessun DNS/certificato è stato modificato.

## Passaggio necessario

L'accesso Netlify è ora risolto. Il blocco operativo resta l'assenza di un ambiente privato configurato per Node, disco persistente, antivirus e backup. Le variabili presenti su Netlify non sono disponibili nel workspace e non sono state trasferite al nuovo runtime; le funzioni serverless non sostituiscono tale ambiente. Serve indicare un sistema già disponibile senza nuovi costi e configurarne privatamente gli accessi. Restano necessari orari/recapiti Bari, decisioni del titolare sulle informative e sulle durate di conservazione, quindi collaudi dei provider reali e dei dispositivi. L'AI resta disattivata per il divieto di spesa. Non occorre ripetere l'autorizzazione generale al lavoro.

Il codice verificato rimane sul branch `codex/verifica-sicurezza-2026-10-12`, con 111 test locali superati. Stato tecnico: [VERIFICA-WORK-2026-10-13.md](VERIFICA-WORK-2026-10-13.md).
