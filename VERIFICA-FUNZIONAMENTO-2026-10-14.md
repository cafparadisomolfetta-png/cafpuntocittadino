# Verifica di funzionamento — 14 ottobre 2026

Verifica eseguita sul ramo corrente con grafica approvata e avvio con sola Molfetta. Nessuna funzionalità eliminata o aggiunta durante il collaudo; nessuna spesa, pubblicazione, modifica DNS o chiamata ai provider reali.

## Esiti verificati

- `node tools/collaudo-locale.cjs`: 138 test di comportamento e 4 test della build, tutti superati. Il controllo della build verifica collegamenti HTML statici, risorse locali e destinazioni PWA; esclude il contenuto degli script inline, che richiede prove JavaScript/browser distinte. I sei test WhatsApp verificano un adattatore opzionale con provider simulato, non la consegna reale o il collegamento alle prenotazioni. Quattro prove aggiuntive verificano la soppressione degli avvisi email superati, la sospensione durante indisponibilità Calendar e l'avviso di cancellazione dopo eliminazione dell'evento; vedi PROMEMORIA-COERENZA.md.
- Analisi dei collegamenti locali della build: 14 pagine HTML, nessun file locale mancante e nessun frammento interno non risolto; il riferimento `cafpc-servizi` è riconosciuto come sezione generata dalla navigazione condivisa.
- Prova HTTP sul server locale reale `createApp`, con identità e configurazione sintetiche: 22 pagine/risorse servite con risposta 200, contenuto presente, `nosniff` e `Cache-Control: no-store`.
- Configurazione HTTP: sola Molfetta esposta alle applicazioni.
- Endpoint pratiche, identità, operatori e candidature: accessi anonimi respinti con 401.
- Moduli server, file `.env` e documentazione interna non esposti dal server pubblico: 404.
- Richiesta con origine esterna respinta con 403; HEAD del logo SVG senza body e con MIME corretto.

## Copertura dei test automatici

Accessi e permessi, revoca e logout, isolamento assistiti/sedi, richiesta e avanzamento pratiche, PDF e casi di scanner simulato, documenti riservati, candidature, calendario e gestione appuntamenti con provider simulati, doppie prenotazioni, disdette e risultati incerti, notifiche e news, archivio cifrato e backup/ripristino su dati sintetici, avvio bloccato per configurazioni incomplete, PWA e build. Le prove aggiunte per l'avvio con Molfetta verificano anche l'esclusione delle sedi inattive senza cancellarne i dati.

## Controllo ambiente

Il controllo offline `node server/environment.cjs` restituisce configurazione incompleta, come previsto: il runtime di produzione non è configurato e non viene considerato operativo. I valori segreti non sono stampati o acquisiti nel rapporto. La prova HTTP temporanea usa dati sintetici e non aggira il controllo di avvio del server di produzione.

## Non verificato con questa prova

- Aspetto e interazioni delle pagine effettive in browser desktop/mobile, tastiera e assistive technology.
- Login Google reale, OAuth del sito, creazione/disdetta degli eventi sui calendari reali e consegna email.
- ClamAV reale con firme aggiornate e file di prova sicuro/infetto.
- Server finale, HTTPS, carico, monitoraggio e recupero dal servizio di backup esterno.
- Installazione e aggiornamento PWA su iPhone/Android/Windows.
- Conferme legali e informative definitive sull'ambiente scelto.
- Qualità e costi della segretaria AI: rimane disattivata.
- Integrazione telefonica e risposte AI WhatsApp: non implementate. Adattatore promemoria WhatsApp testato solo con provider simulato; coda, consenso nel portale, verifica del numero, callback e collegamento prenotazioni non implementati. SMS esclusi.

Conclusione: verifiche automatiche e prova HTTP locale superate. Il progetto resta non pubblicato e richiede i collaudi operativi prima di essere usato dagli assistiti. Netlify rimane disattivato.

## Raccolta automatica di titoli ufficiali

Aggiunti parser RSS limitato, raccolta INPS/INAIL e sezione pubblica dedicata, senza API AI. Cinque nuove prove coprono deduplica, date e link, input non validi, errori/redirect e integrazione job-catalogo con fonti simulate. La build verifica che il nuovo script pubblico sia incluso. L’attivazione nel server finale e la resa browser restano da verificare; vedere AGGIORNAMENTI-AUTONOMI.md.

Prova di lettura pubblica del 14 ottobre: entrambi i feed hanno risposto HTTP 200 application/xml; le copie lette dal parser producono 20 titoli recenti INPS e 20 INAIL. Gestita la variante ufficiale pubdate in minuscolo con data gg/mm/aaaa. Questa prova non ha pubblicato dati sul dominio né modificato calendari.

Due prove aggiuntive del provider prenotazioni verificano le tre modalità (in sede, telefonico, WhatsApp), categoria INAIL, istruzioni email coerenti e rifiuto delle modalità non previste prima di contattare i provider. Solo provider simulati, nessun appuntamento reale creato.
