# Recupero della segretaria esistente — 24 ottobre 2026

L'utente conferma che la segretaria rispondeva nel sito pubblico. Il file HTML allegato il 24 ottobre contiene la stessa integrazione chat dell'index del repository: POST a `/.netlify/functions/segretaria-ai`, cronologia limitata e risposta `{answer}`. Non è una semplice simulazione e non è stata sostituita con una nuova chat. Il file allegato non contiene una chiave API apparente e non è stato modificato.

La funzione Netlify esistente usa OpenAI Responses con `OPENAI_API_KEY` configurata lato hosting. Il backend Linux conserva il medesimo percorso tramite il relativo adattatore: non è necessario mantenere Netlify per la sola compatibilità dell'indirizzo. La presenza del codice non verifica disponibilità della chiave, credito, autorizzazioni o qualità delle risposte reali.

## Modifiche effettuate

- Istruzioni condivise in `assistant-guidance.cjs` tra funzione storica e backend Linux: orientamento nazionale, CAF/INPS/INAIL/lavoro, nessun indirizzo pubblico o invito a telefonare alla struttura.
- Passaggio all'operatore tramite WhatsApp Business o email; eventuale ricontatto da parte dello sportello.
- Nessuna conferma inventata di appuntamenti, requisiti, pagamenti o stato delle pratiche; quota e verifica incasso rimangono nel workflow privato.
- Nella chat pubblica sono disponibili agenda, WhatsApp ed email anche quando l'assistente non risponde. Grafica e integrazione esistenti conservate.
- Backend Linux ancora disattivato senza configurazione e autorizzazione alla spesa; nessuna flag abilitata, nessuna credenziale creata o copiata, nessuna richiesta reale al provider.

## Verifiche

Suite locale: **156 test di comportamento + 4 di build = 160 superati**, con provider sintetici e blocco rete del collaudo. Import della funzione ESM storica e risposta non configurata verificati senza inviare richieste al provider. Nel browser locale verificata l'apertura del pannello e la presenza dei tre collegamenti; nessuna domanda inviata a un'AI reale. L'anteprima è solo locale, non una pubblicazione.

## Blocco residuo

Il pannello Netlify richiede il login. Non sono disponibili qui né una sessione autenticata né un plugin Netlify utilizzabile nella ricerca eseguita. La configurazione privata del vecchio progetto resta da verificare tramite accesso autorizzato: individuare presenza e ambito delle variabili, senza esporre segreti in chat o nel repository. Non riattivare deploy, sito o fatturazione come effetto del recupero.

Prima dell'uso operativo sul VPS: trasferire la configurazione mediante un percorso sicuro, scegliere il modello effettivamente disponibile, verificare saldo/limiti e autorizzazione ai consumi, completare informativa e prova reale concordata. Un limite di richieste non è un tetto di spesa in euro. Non si dichiara la chat attualmente attiva.
