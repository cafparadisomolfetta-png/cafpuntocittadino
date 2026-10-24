# Punto Cittadino Italia

Identità: **Punto Cittadino Italia — Un solo punto, tante soluzioni.** Nome commerciale scelto; disponibilità e registrazione del marchio non ancora verificate. Dominio e profili social non rinominati.

Sito pubblico con assistenza online in tutta Italia, prenotazioni Google Calendar, area assistiti e gestionale riservato. Grafica approvata blu/turchese. Dominio principale previsto: `puntocittadinoitalia.it`, da registrare e collegare dopo verifica. Il dominio esistente `cafpuntocittadino.it` sarà conservato per il successivo reindirizzamento.

**Codice in collaudo; nessuna nuova pubblicazione. Destinazione scelta: VPS Linux Aruba con backup separato. Netlify rimane sospeso.**

Urgenze e contatti: collegamenti diretti a WhatsApp Business **080 6455509** e a `cafparadiso.molfetta@gmail.com`, con richiesta scritta e ricontatto su iniziativa della struttura. Nessun invito alla chiamata in entrata nelle pagine promozionali. Numeri e destinatario sono pubblici e configurabili durante la build; nessun messaggio viene inviato automaticamente.

Filtro approvazione, importi e notifiche: [APPROVAZIONE-QUOTE-NOTIFICHE.md](APPROVAZIONE-QUOTE-NOTIFICHE.md). Nuove richieste senza PDF fino ad approvazione dell’operatore e conferma dell’importo da parte dell’assistito. Per pratiche a pagamento, la lavorazione rimane bloccata fino alla verifica manuale dell’incasso sul conto da parte dell’amministratrice o di un responsabile autorizzato.

Ripresa e verifiche del 24 ottobre: [RIPRESA-2026-10-24.md](RIPRESA-2026-10-24.md). Verifica precedente: [VERIFICA-CHIUSURA-2026-10-17.md](VERIFICA-CHIUSURA-2026-10-17.md). Ordine del rilascio: [CHECKLIST-RILASCIO.md](CHECKLIST-RILASCIO.md). Installazione: [deployment/README.md](deployment/README.md).

- `node tools/collaudo-locale.cjs`: suite e build con dati sintetici, senza chiamate ai provider reali.
- `npm run build`: prepara `dist/`, escludendo codice server e documentazione privata.
- `npm run check:private`: verifica offline della configurazione privata; non avvia il servizio e non certifica il funzionamento dei provider.
- `npm run start:private`: avvio bloccato finché non esiste una configurazione valida. Leggere [server/README.md](server/README.md).

I 30 servizi del catalogo sono prenotabili e supportati dall'intake documentale privato: PDF, integrazioni e stati della pratica. L'abilitazione effettiva richiede una durata di conservazione approvata per ogni servizio in `CAF_ENABLED_SERVICES_JSON`. Senza tale configurazione esplicita resta il precedente avvio limitato a 730 e ISEE. La richiamata è opzionale; raccolta e monitoraggio non equivalgono all'invio ufficiale agli enti. Segretaria vocale e WhatsApp AI non sono operativi; i promemoria WhatsApp sono un adattatore sperimentale non collegato alla coda delle prenotazioni. SMS esclusi.

Un'unica sede interna attiva all'avvio, ulteriori sedi dopo configurazione e collaudo. Documenti reali e credenziali non devono essere aggiunti al repository. L'endpoint Netlify storico `pratiche` resta disabilitato: il backend privato richiede il proprio server persistente.
