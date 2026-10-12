# CAF Punto Cittadino — verifica dello sviluppo in Work

**Codice ampliato e collaudato localmente; progetto complessivo ancora non pronto al rilascio.** Netlify resta sospeso. Nessuna pubblicazione, acquisto o chiamata AI a pagamento.

## Revisione iniziale

Base del repository esaminata: `bc1a840`. Il commit remoto `6157f3a` corregge OAuth state, intestazioni email, disdette ambigue/date invalide, banner cookie concorrenti e build pulita. Quei controlli rimangono attivi.

## Sviluppo successivo autorizzato

È stato aggiunto un runtime privato Node, separato dalle funzioni Netlify, con database e file cifrati fuori dal repository, senza acquistare o attivare hosting. Non usa filesystem effimero serverless per conservare documenti.

| Funzione | Stato effettivo |
| --- | --- |
| Sito pubblico | Build locale delle 10 pagine; navigazione verso area assistiti; markup storico ricondotto dentro body; niente deploy |
| Area assistiti | Frontend PWA e API private per richieste 730/ISEE, pratiche personali, stato, integrazioni, PDF, download e riferimento appuntamento |
| Gestionale Molfetta/Bari | Frontend pratiche, ruoli e sedi; admin entrambe; operatori/manager/viewer solo sedi assegnate; aggiornamento stati e gestione collaboratori; agenda Google in lettura |
| PDF | Filtri server, dimensioni, signature/EOF e blocco azioni attive visibili; ClamAV obbligatorio prima dell'archiviazione; nessun salvataggio se scanner non disponibile; scanner reale ancora non provato |
| Riservatezza | AES-256-GCM per record/documenti; autorizzazione server; token browser solo in memoria; download no-store; audit cifrato/concatenato; backup cifrato e ripristino testato |
| Google Calendar | Adattatore per agenda con revoca operatori coerente; confronto email/calendario per riferimento appuntamento; prova reale Google/Gmail non eseguita |
| Prenotazioni concorrenti | Prenotazione persistente di slot nel nuovo runtime; esiti incerti bloccati; riconciliazione admin solo dopo controllo Google e almeno 10 minuti; codice storico Netlify non acquisisce questo blocco |
| Conservazione | Policy esplicita senza durate inventate; preview/purge admin per pratiche concluse/non accolte; conservazione audit/backup da definire operativamente |
| PWA | Manifest assistiti/gestionale/pubblico, PNG 192/512, nessuna cache di documenti; installazione iPhone/Android non verificata |
| Segretaria AI | Codice storico presente, non modificato/attivato in questa revisione; nessuna chiave locale e nessuna chiamata reale; servizio AI del runtime non attivo |
| News/promemoria | Funzioni storiche Netlify conservate; scheduler non migrati o attivati nel nuovo runtime |
| Candidature CV | Selettore PDF nel frontend; raccolta privata end-to-end ancora da implementare/collaudare; POST ai moduli statici rifiutati dal runtime |

## Verifiche eseguite

`npm test` / `node deploy-build.cjs`: **75 test automatici superati**, inclusi:

- suite originali di permessi, workflow, query, cookie e prenotazioni;
- HTTP locale autenticato: creazione, upload e download, rifiuto utenti diversi, origini e accessi a file privati;
- ciclo pratica completo: ricevuta → integrazione → lavorazione → completamento;
- isolamento tra sedi, permessi sola lettura, revoca operatori, scadenza/audience Google;
- rifiuto PDF non conformi, file infetti, scanner guasto e duplicati;
- rollback atomico in caso di errore audit, versione concorrente e riesame dello stato dopo scansione;
- database cifrato, persistenza al riavvio, chiave errata e alterazione dei dati;
- backup cifrato, ripristino e rifiuto di backup alterati/sovrascritture;
- retention senza valori predefiniti e cancellazione solo di pratiche terminali scadute;
- prenotazioni contemporanee con un'unica chiamata al provider e blocco esiti incerti;
- controlli statici frontend, ID dei moduli, credenziali non persistite, icone PWA e bundle senza codice server/documentazione;
- avvio privato negato senza abilitazione/revisione privacy e divieto di dati dentro sorgenti/dist.

In aggiunta: controllo sintattico di ogni funzione JS/ESM, modulo server e frontend; `git diff --check`. Google, Gmail, antivirus e identità sono **simulati nei test**. Non sono stati eseguiti collaudi reali, browser visuale, accessibilità su dispositivi, carico operativo o penetration test. Il superamento delle prove locali non certifica conformità GDPR né sicurezza di produzione.

## Necessario intervento della responsabile

1. Rendere disponibile un ambiente esistente senza nuovi costi, con HTTPS, filesystem privato persistente, antivirus aggiornato e backup separati; oppure indicare il fornitore già disponibile cui adattare il codice. Non sono state attivate risorse.
2. Autorizzare Google con l'account scelto e configurare in modo privato account admin/operatori, client, segreti, calendari distinti e scope Gmail/Calendar. Confermare dati operativi e orari Bari. Non inviare password/token in chat o GitHub.
3. Validare titolare, fornitori e accordi, informative, basi giuridiche e tempi di conservazione di pratiche, audit e backup. Le informazioni obbligatorie non possono essere eliminate dall'informativa. Le flag di abilitazione non sostituiscono questi controlli.
4. Per attivare l'AI, decidere sulla chiave tramite canale sicuro e sul budget; il vincolo attuale di nessuna spesa ha escluso il collaudo reale a pagamento.

## Sviluppo e collaudo ancora necessari

Migrazione/attivazione della segretaria AI, news e promemoria sul runtime scelto; raccolta CV privata; modifica/spostamento appuntamenti da gestionale; collaudo Google/Gmail/ClamAV; collaudo grafico e installazione PWA; monitoraggio/incidenti e policy operative backup/audit. Le prenotazioni pubbliche Bari restano disabilitate finché non definite e collaudate. L'area assistiti non è pubblicata sul dominio.

Guida tecnica e variabili: [server/README.md](server/README.md). Il branch di sviluppo rimane separato da `main`; non rimuovere `ignore = "exit 0"` in Netlify.
