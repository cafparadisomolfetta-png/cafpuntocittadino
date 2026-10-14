# CAF Punto Cittadino — preparazione al collaudo

Aggiornamento: 14 ottobre 2026. Il progetto non è pronto per l'uso reale finché non sono completate le prove sull'ambiente finale.

## Versione da verificare

Il codice corrente è nel branch `codex/verifica-sicurezza-2026-10-12`, con grafica approvata, sito pubblico, area assistiti, PDF riservati, gestione pratiche, agenda e PWA. L'avvio è configurato con sola Molfetta; ulteriori sedi sono descritte in [SEDI-ATTIVE.md](SEDI-ATTIVE.md).

Il server Linux finale ospiterà sito e gestionale. Netlify rimane disattivato: non occorrono crediti Netlify per questa architettura e non va rimosso il blocco di deploy. Il trasferimento del dominio non è stato eseguito.

## Controlli ripetibili senza pubblicazione

Eseguire `node tools/collaudo-locale.cjs` dalla radice del repository con Node >=22.13. Il comando compila il sito ed esegue i test con dati sintetici, credenziali rimosse e traffico ai provider bloccato. Non avvia il servizio operativo né pubblica la build.

Il controllo comprende collegamenti HTML locali, frammenti interni statici, risorse e destinazioni dei manifest PWA. Non sostituisce una prova delle interazioni JavaScript in browser o l'installazione su smartphone. Il workflow GitHub storico si attiva su main o manualmente: non presumere che ogni commit del branch di sviluppo abbia un esito CI.

## Preparazione dell'ambiente finale

Seguire [deployment/README.md](deployment/README.md) per server, HTTPS, archivio privato cifrato, ClamAV, credenziali Google, ruoli, backup separato e ripristino. I modelli non sono ancora installati sul server finale. Segreti e chiavi vanno esclusivamente nella configurazione privata, mai in chat o GitHub.

L'organizzazione OpenAI “CAF Punto Cittadino” e il progetto “Segretaria AI” sono visibili nella schermata fornita dall'amministratrice. Il connettore continua a rifiutare l'accesso ai progetti: nessuna chiave è stata acquisita o salvata. AI, telefono e WhatsApp non sono operativi; non acquistare crediti o abilitare spese per superare questa condizione.

## Prove necessarie prima del rilascio

La checklist corrente è [COLLAUDO-OPERATIVO.md](COLLAUDO-OPERATIVO.md). Richiede login reale, isolamento degli assistiti e ruoli, antivirus reale, calendario e consegna email, PDF, workflow, backup/ripristino, carico, browser mobile/desktop, PWA e informative definitive. Gli esiti sintetici sono riportati in [VERIFICA-FUNZIONAMENTO-2026-10-14.md](VERIFICA-FUNZIONAMENTO-2026-10-14.md).

I promemoria email hanno un modulo server collaudato con provider simulato. Per WhatsApp esiste ora un adattatore di invio testato con provider simulato, descritto in [WHATSAPP-PROMEMORIA.md](WHATSAPP-PROMEMORIA.md): non è ancora collegato alle prenotazioni. Consenso effettivo, verifica del numero, coda, callback, template e prove reali restano da completare/configurare. La segretaria telefonica e le risposte AI WhatsApp hanno soltanto simulazioni grafiche. Gli SMS sono esclusi dal progetto.

## Rilascio

Solo dopo esiti positivi sull'ambiente finale: configurare DNS e HTTPS per il server verificato, conservare i record precedenti e un rollback, poi ripetere i controlli sul dominio. Non pubblicare moduli opzionali non collaudati. Il PC Windows serve per il collaudo locale descritto in [COLLAUDO-WINDOWS.md](COLLAUDO-WINDOWS.md), non come server operativo.
