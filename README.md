# CAF Punto Cittadino Italia

Sito pubblico con assistenza online in tutta Italia, prenotazioni Google Calendar, area assistiti e gestionale riservato. Grafica approvata blu/turchese. Dominio mantenuto: `cafpuntocittadino.it`.

**Codice in collaudo; nessuna nuova pubblicazione. Destinazione scelta: VPS Linux Aruba con backup separato. Netlify rimane sospeso.**

Filtro approvazione, importi e notifiche: [APPROVAZIONE-QUOTE-NOTIFICHE.md](APPROVAZIONE-QUOTE-NOTIFICHE.md). Nuove richieste senza PDF fino ad approvazione dell’operatore e conferma dell’importo da parte dell’assistito.

Stato corrente: [VERIFICA-CHIUSURA-2026-10-17.md](VERIFICA-CHIUSURA-2026-10-17.md). Ordine del rilascio: [CHECKLIST-RILASCIO.md](CHECKLIST-RILASCIO.md). Installazione: [deployment/README.md](deployment/README.md).

- `node tools/collaudo-locale.cjs`: suite e build con dati sintetici, senza chiamate ai provider reali.
- `npm run build`: prepara `dist/`, escludendo codice server e documentazione privata.
- `npm run check:private`: verifica offline della configurazione privata; non avvia il servizio e non certifica il funzionamento dei provider.
- `npm run start:private`: avvio bloccato finché non esiste una configurazione valida. Leggere [server/README.md](server/README.md).

I 30 servizi del catalogo sono prenotabili e supportati dall'intake documentale privato: PDF, integrazioni e stati della pratica. L'abilitazione effettiva richiede una durata di conservazione approvata per ogni servizio in `CAF_ENABLED_SERVICES_JSON`. Senza tale configurazione esplicita resta il precedente avvio limitato a 730 e ISEE. La richiamata è opzionale; raccolta e monitoraggio non equivalgono all'invio ufficiale agli enti. Segretaria vocale e WhatsApp AI non sono operativi; i promemoria WhatsApp sono un adattatore sperimentale non collegato alla coda delle prenotazioni. SMS esclusi.

Un'unica sede interna attiva all'avvio, ulteriori sedi dopo configurazione e collaudo. Documenti reali e credenziali non devono essere aggiunti al repository. L'endpoint Netlify storico `pratiche` resta disabilitato: il backend privato richiede il proprio server persistente.
