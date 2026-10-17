# Verifica di chiusura tecnica — 17 ottobre 2026

**Preparazione locale verificata; progetto non ancora online e collaudo di produzione non eseguito.** Nessun acquisto, invio email, chiamata AI, modifica DNS o riattivazione Netlify.

## Modifiche correnti

- Nome concordato aggiornato a **CAF Punto Cittadino Italia**, mantenendo dominio e nomi utente social attuali.
- Grafica blu/turchese e logo approvato conservati; aggiunta testuale “Italia” a fianco del logo, senza ridisegnarne l'immagine.
- Titoli, intestazioni, aree riservate, manifest PWA e testi email aggiornati.
- Collegamenti semplici ai profili Facebook Caf Paradiso, Instagram e TikTok `@cafpuntocittadino`; nessun widget social o script di tracciamento aggiunto. I link non realizzano una connessione amministrativa né pubblicano post.
- Portale documentale esteso dai soli 730/ISEE ai 30 servizi del catalogo prenotazioni. Ogni tipo usa il workflow privato: richiesta, PDF, integrazioni, lavorazione e conclusione. Non vengono implementate decisioni di spettanza né invii automatici a INPS, INAIL o Agenzia delle Entrate.
- Catalogo con ID stabili, etichette e categorie; l'interfaccia propone solo i servizi abilitati dal server. Richiamate separate e senza documenti, come prima.
- `CAF_ENABLED_SERVICES_JSON` seleziona i tipi attivi; senza configurazione conserva i precedenti 730/ISEE. Il modello di deployment propone tutti i 30 tipi ma non contiene tempi inventati: l'avvio viene impedito se manca una durata approvata per qualsiasi tipo selezionato.
- Checklist e documentazione riallineate ad Aruba; eliminata l'indicazione corrente di riattivare Netlify e il vecchio tetto economico come condizione del rilascio.

## Prove eseguite

1. Suite iniziale: **140 test di comportamento + 4 test della build**, tutti superati.
2. Suite dopo branding e link social: stesso esito; **32 controlli HTTP locali** superati, inclusi pagine/risorse reali, intestazioni `no-store`/`nosniff`, accessi anonimi respinti, file privati non pubblicati, origine esterna rifiutata e HEAD senza body.
3. Suite finale dopo estensione dell'intake: **144 test di comportamento + 4 test della build = 148**, tutti superati. La nuova copertura verifica:
   - corrispondenza esatta tra i 30 servizi pubblici e il catalogo privato;
   - creazione, scansione simulata, caricamento/download PDF, isolamento fra assistiti e passaggi di stato per ciascun servizio;
   - selezione esplicita, ID non validi/duplicati, servizio disabilitato senza scritture e conservazione obbligatoria per ogni tipo attivo;
   - API di configurazione con sole etichette dei servizi attivi, senza policy o credenziali.
4. Controllo offline della configurazione: **incompleta**, esito atteso senza configurazione di produzione. Questo impedisce l'avvio operativo; non è un superamento dei prerequisiti.
5. Controllo di integrità della patch Git: nessun errore di whitespace.

Le prove usano identità, chiavi, PDF e dati sintetici. L'antivirus è simulato nei test: non equivale alla scansione reale sul server. Le prove HTTP locali non verificano l'aspetto grafico nel browser o il funzionamento di Google.

## Operazioni necessarie prima del live

| Passaggio | Stato e risultato richiesto |
| --- | --- |
| Account/server Aruba e backup separato | Risorse attive e accesso amministrativo autorizzato ancora da verificare; acquisto e fatturazione al titolare |
| Configurazione Google | Origine, account, calendari e permessi del sito; prove reali login/prenotazione/disdetta/consegna email |
| Archivio e antivirus | ClamAV aggiornato, firme, permessi e chiave privata fuori dal repository; prove pulito/infetto/scanner guasto |
| Privacy e conservazione | Informative e ruoli effettivi, raccolte per ciascun servizio abilitato, durate di tutte le copie/backup; revisione non dichiarata eseguita |
| Backup e ripristino | Copia fuori dal VPS e restore verificato sul sistema effettivo |
| Browser e dispositivi | Aspetto approvato desktop/mobile, moduli, tastiera, installazione e aggiornamento PWA |
| Rilascio | HTTPS, firewall, unit/proxy validati, DNS e prova finale sul dominio dopo gli altri passaggi |

## Moduli rinviati e social

Segretaria AI telefonica e WhatsApp AI non sono operativi. Il promemoria WhatsApp resta un adattatore verificato con provider simulato, non collegato alle prenotazioni. SMS esclusi. AI e autorizzazione alla spesa restano false; nessun provider a pagamento è stato attivato.

Facebook conserva il nome Caf Paradiso. Nell'ultima verifica il controllo completo risultava a Dora de Robertis: l'utente ha scelto di contattarla. Instagram e TikTok non sono stati rinominati né collegati amministrativamente. Il loro accesso non blocca l'installazione del sito e i link pubblici possono essere mantenuti.

Per proseguire: [CHECKLIST-RILASCIO.md](CHECKLIST-RILASCIO.md), quindi [deployment/README.md](deployment/README.md). Non scambiare questo rapporto per una certificazione GDPR, di sicurezza o di operatività del dominio.
