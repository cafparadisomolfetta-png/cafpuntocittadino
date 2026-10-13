> Decisione della direzione, 13 ottobre 2026: ripristinata la versione con deposito PDF nel portale, controllo antivirus obbligatorio, archivio privato cifrato e consultazione dello stato. La variante con invio documenti via email è stata annullata. Ricezione file automatica dopo scansione; verifica della completezza e aggiornamento dello stato restano operazioni della sede. Server esterno: obiettivo iniziale 8 GB, da collaudare; la proposta 4 GB non è approvata per questa versione. Limite autorizzato server + backup: 15 euro/mese. Nessun acquisto o deployment.

# CAF Punto Cittadino — verifica del 13 ottobre 2026

**Implementazione ampliata e collaudata localmente; rilascio operativo ancora bloccato dai collaudi e dalla configurazione dei servizi reali.** Nessuna spesa, chiamata AI a pagamento, nuova email a persone reali, pubblicazione o riattivazione Netlify.

## Funzionalità ora presenti nel codice

| Modulo | Implementazione | Verifica effettiva |
| --- | --- | --- |
| Sito pubblico | 10 pagine, navigazione per pagina, banner unico, collegamenti aree personali, CV senza invio a Netlify Forms | Build e controlli statici; browser/dispositivi ancora da provare |
| Area assistiti | Login Google, richieste 730/ISEE per Molfetta/Bari, stato, integrazioni, riferimento appuntamento, PDF e download | Ciclo completo API locale, identità/Google simulati |
| Gestionale | Ruoli/sedi, gestione pratiche, collaboratori, revoca, CV riservati, news e controlli amministratrice | Permessi, versioni, revoca, API locali e controlli frontend |
| Appuntamenti | Agenda, spostamenti e annullamenti operatori abilitati; ETag/If-Match; prenotazione persistente slot; esiti incerti conservati | Google simulato; concorrenza, conflitti e timeout verificati |
| Prenotazioni/disdette pubbliche | Funzioni Google originali con controlli e wrapper atomico nel runtime privato | Regressioni locali; Gmail/Google reali da collaudare |
| Richiamate | Richiesta personale, telefono/email visibili solo ai ruoli operativi della sede, gestione tramite workflow e retention | Accessi, rifiuto allegati, blocco senza abilitazione/policy testati |
| Candidature | `/candidature/`, account personale, CV solo PDF fino a 5 MiB, scansione, cifratura, stati e conservazione esplicita; CV visibili a candidato e admin | Invio/download/status/cancellazione via HTTP locale; antivirus simulato |
| Segretaria AI | Adattatore Responses del runtime, modello configurabile, timeout, input/output limitati, store=false, cap giornaliero persistente, blocco di alcuni dati personali riconoscibili | Provider simulato; nessuna chiave reale creata o usata, nessuna chiamata a pagamento |
| Promemoria/notifiche | Scheduler opt-in, promemoria 23–25 ore prima, coda deduplicata, email generiche per spostamenti/annullamenti, conservazione approvata | Provider e mail simulati; esiti incerti non reinviati automaticamente |
| News | Controllo automatico fonti istituzionali; variazioni segnalate per verifica; pubblicazione dei soli testi approvati dall'admin | Fonti simulate; nessuna sintesi normativa pubblicata automaticamente |
| Riservatezza | Database e documenti AES-GCM, isolamento, accessi server, audit, backup/ripristino, retention pratiche/CV/email/audit | Cifratura, alterazioni, rollback, ripristino e cancellazione verificati su dati sintetici |
| PWA | Pubblico/assistiti/gestionale con icone PNG, nessuna cache di credenziali o documenti, logout/pagehide | Asset e controlli statici; installazione iPhone/Android non eseguita |

Bari: agenda/cancellazione riservata supportate; spostamenti solo con orari privati approvati in configurazione. Le prenotazioni pubbliche Bari restano disabilitate fino a definizione e collaudo di orari, indirizzo e messaggi della sede. La richiamata storica è migrata nell’area assistiti autenticata: recapiti cifrati, accesso limitato alla sede e assenza di allegati; abilitazione solo con durata di conservazione approvata.

## Esito dei controlli

`npm test` / `node deploy-build.cjs`: **114 test automatici superati** (112 di comportamento e 2 del bundle). Nessun test saltato.

Le prove includono:

- tutti i controlli originali e le correzioni OAuth/cookie/prenotazioni;
- ciclo pratica, accesso per utente/sede, scadenza/audience Google, ruoli e revoca;
- caricamento/download, PDF non conformi, scanner guasto/infetto, duplicati e rollback;
- richiamate protette, recapiti nascosti ai viewer e nessun PDF ammesso per questo servizio;
- CV personali/admin, email derivata dall'identità verificata, stati/versioni, erasure/retention;
- spostamento/annullamento con permessi, eventi della sede, versioni concorrenti, destinazione occupata e esiti incerti;
- scheduler disattivato per default, deduplicazione promemoria, invio simulato, nessun reinvio dopo esito incerto;
- news solo con approvazione admin e URL HTTPS delle fonti ammesse;
- nessuna chiamata AI senza abilitazione **e autorizzazione separata alla spesa**; cap persistente, messaggio corrente, input/output limitati e assenza di chat nel database;
- cifratura, riavvio, chiave errata, alterazioni, backup/ripristino e scadenza del prefisso audit con catena verificabile;
- API HTTP locali, origini, download no-store e divieto di file privati nel bundle;
- risposta agenda tardiva dopo logout: non può riaprire la dashboard né mostrare dati;
- controlli statici DOM, sintassi e icone PWA; build e `git diff --check`.
- configurazione offline senza valori segreti, nessuna scrittura/chiamata esterna; avvio bloccato prima del vault con calendari uguali o durate invalide; rifiuto di origini con credenziali/path/query, porte/chiavi ambigue, provisioning non valido e percorsi in source anche tramite symlink.

**Limiti:** identità Google, Calendar, Gmail, antivirus, fonti e AI sono simulati. Non sono stati eseguiti browser visuale, installazione reale PWA, carico operativo, penetration test o revisione privacy professionale. I controlli locali non certificano il rilascio.

`npm run check:private` è stato eseguito sul workspace reale: esito **configurazione incompleta**, senza creare dati o usare provider. Node/build sono presenti; mancano configurazione privata, antivirus, policy approvate e credenziali del runtime. I nomi di variabili presenti nella dashboard Netlify non vengono esportati al workspace. Questo blocco è atteso e impedisce un avvio apparentemente riuscito ma non operativo.

## Operazioni necessarie sull'ambiente reale

Stima dei servizi, fonti dei listini e costi esclusi: [COSTI-PROGETTO-2026-10-13.md](COSTI-PROGETTO-2026-10-13.md). Nessun contratto, risorsa o pagamento attivato durante questa verifica economica. La stima non certifica il dimensionamento o il prezzo effettivo nel riepilogo ordine.

Successivamente autorizzato dall'utente un tetto di 15 €/mese per server e backup, con AI e Netlify ancora disattivati. Il configuratore OVH ha chiarito pagamento annuale anticipato dell'offerta iniziale e indisponibilità UE del piano da 8 GB. Preparato solo il riepilogo dell'alternativa da 4 GB in Germania a 5,48 €/mese IVA inclusa, senza impegno annuale; nessun pagamento effettuato. Conferma della variante, accesso/contratto del fornitore e collaudo reale restano da completare. Dettagli nel documento costi.

La sequenza aggiornata è in [COLLAUDO-OPERATIVO.md](COLLAUDO-OPERATIVO.md); la prova Windows viene lasciata all'ultimo passaggio locale. Sono state corrette e testate le operazioni di manutenzione: nessuna creazione implicita di archivi mancanti, verifica/anteprima in sola lettura, backup/restore protetti anche contro link nel repository, umask POSIX privato per lo snapshot temporaneo. Suite completa con launcher isolato: 114 test superati, nessuno saltato. Nessuna prova reale ulteriore dei provider o sul PC dell'utente.

### Preparazione collaudo Windows

L'utente dispone di un PC Windows. Sono disponibili [istruzioni](COLLAUDO-WINDOWS.md), `COLLAUDO-WINDOWS.cmd` e launcher locale con rimozione delle variabili private dei provider, moduli disattivati e blocco delle chiamate fetch reali esterne; HTTP loopback resta ammesso per i test locali. Non scaricano pacchetti, non avviano il runtime operativo, non modificano firewall o Netlify. Suite e build tramite il launcher sono passate anche da una copia pulita senza `dist` e senza `node_modules`, nell'ambiente Linux di questa sessione. Il controllo dei percorsi di test usa junction su Windows; non sono saltati test. **Esecuzione del file CMD su Windows e risultato sul PC dell'utente ancora da raccogliere.** Il solo possesso di un PC non certifica l'idoneità all'hosting pubblico o ai dati reali.

### Configurazione operativa

1. Accesso a un ambiente già disponibile senza nuovi costi: Node compatibile, HTTPS, filesystem privato persistente, ClamAV aggiornato e backup separati. Non sono state acquistate o attivate risorse. Questo runtime non conserva documenti su disco effimero di funzioni serverless.
2. Autorizzazione Google dell'account scelto e configurazione privata di admin/operatori, client, calendari distinti e credenziali Calendar/Gmail. Configurazione del mittente email e degli orari Bari. Non inviare password/token in chat o GitHub.
3. Revisione di titolare, informative, fornitori/accordi, basi giuridiche e durate di conservazione di pratiche, CV, notifiche, audit e backup. I controlli tecnici e le flag di abilitazione non sostituiscono questa revisione.
4. AI: il vincolo attuale di nessuna spesa mantiene le chiamate disattivate. Per un collaudo reale occorrono chiave privata, modello autorizzato e decisione esplicita sul budget; il limite richieste non è un limite monetario. Nessuna chiave nuova è stata creata.
5. Dopo configurazione: prove reali OAuth/login/revoca, Google/Gmail/antivirus, accessibilità/grafica desktop e mobile, installazione PWA, backup/ripristino sul sistema scelto e gestione degli incidenti. Pubblicare solo dopo esito positivo.

Guida: [server/README.md](server/README.md). Netlify resta bloccato con `ignore = "exit 0"`; `main` non è stato modificato né distribuito. Il nuovo runtime è distinto dall'endpoint Netlify `pratiche`, che resta disabilitato.

## Verifica successiva dei collegamenti reali

Gmail e Google Calendar risultano già collegati a Work; profili e lettura disponibilità sono stati verificati realmente, in sola lettura. Dopo l'accesso manuale dell'utente, anche la dashboard Netlify è stata verificata: progetto disabilitato, limite crediti superato, dominio/HTTPS configurati e nomi delle variabili Google/gestionale/AI presenti. Nessun valore segreto letto e nessuna configurazione modificata. Questi controlli non sostituiscono il collaudo OAuth degli endpoint o l'ambiente persistente richiesto dal nuovo runtime. Dettagli: [VERIFICA-SERVIZI-2026-10-13.md](VERIFICA-SERVIZI-2026-10-13.md).
