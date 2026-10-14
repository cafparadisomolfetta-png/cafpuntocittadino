# Verifica di funzionamento — 14 ottobre 2026

Verifica eseguita sul ramo corrente con grafica approvata e avvio con sola Molfetta. Nessuna funzionalità eliminata o aggiunta durante il collaudo; nessuna spesa, pubblicazione, modifica DNS o chiamata ai provider reali.

## Esiti verificati

- `node tools/collaudo-locale.cjs`: 119 test di comportamento e 3 test della build, tutti superati.
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

Conclusione: verifiche automatiche e prova HTTP locale superate. Il progetto resta non pubblicato e richiede i collaudi operativi prima di essere usato dagli assistiti. Netlify rimane disattivato.
