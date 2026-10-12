# CAF Punto Cittadino

Sito pubblico e gestionale SILPA per Molfetta e Bari, prenotazioni Google Calendar e area assistiti.

**Sviluppo in collaudo; nessuna nuova pubblicazione.** Netlify rimane sospeso. Stato dettagliato: [VERIFICA-WORK-2026-10-12.md](VERIFICA-WORK-2026-10-12.md).

- `npm test`: suite automatica e build, senza servizi reali o spese AI.
- `npm run build`: prepara `dist/`, escludendo codice server e documentazione privata.
- `npm run start:private`: runtime disabilitato per default; richiede configurazione privata e infrastruttura approvata. Leggere [server/README.md](server/README.md).

I documenti reali e le credenziali non devono essere aggiunti al repository. L'area assistiti del nuovo runtime è distinta dall'endpoint Netlify `pratiche`, che resta disabilitato.
