# Verifica CAF Punto Cittadino — 12 ottobre 2026

**Progetto non completato e non autorizzato al rilascio.** Questa revisione corregge problemi verificati nel codice; non certifica servizi esterni o conformità GDPR. Base esaminata: `bc1a840`.

## Risultati riproducibili

Eseguire `node deploy-build.cjs`: 49 test funzionali e di autorizzazione più 2 test del bundle pubblico, tutti superati. Controllo sintattico di ogni modulo server, comprese funzioni ESM e callback OAuth. Ricompilazione con file sintetico obsoleto: rimosso correttamente. `git diff --check`: superato. Nessuna chiamata reale a OpenAI o Google durante i test: i nuovi test dei provider usano risposte simulate.

Correzioni:
- Callback Google: verifica dello state contro il cookie HttpOnly, rifiuto di cookie duplicati e metodi diversi da GET, scadenza del cookie dopo la risposta, timeout del provider. La pagina non dichiara più operativo un collegamento il cui nuovo refresh token non è stato salvato.
- Prenotazioni: rifiuto di caratteri di controllo e campi eccessivamente lunghi prima di qualsiasi chiamata a Google, anche per prevenire inserimento di intestazioni email.
- Disdette: codice nel formato previsto; rifiuto di risultati ambigui/paginati e date invalide prima della cancellazione; errori interni non restituiti agli utenti; email non valida non usata per intestazioni Gmail.
- Cookie: un unico controller nel bundle; eliminazione del secondo banner storico e del controller concorrente negli enhancement; footer collegato alle preferenze condivise.
- Build pulita: eliminazione dei file del precedente dist prima della generazione; controllo che codice server e documentazione interna non siano distribuiti.
- Selettori CV impostati a PDF in tutte le pagine. **Il filtro del browser non costituisce validazione server**: Netlify Forms non è un archivio documentale privato collaudato e non soddisfa da solo i requisiti di upload PDF sicuro.
- File generati, dipendenze e file ambiente esclusi da Git.

## Stato delle funzioni concordate

| Funzione | Stato reale |
| --- | --- |
| Sito pubblico | Build locale riuscita; verifica visuale/mobile e dominio non eseguite |
| Gestionale Molfetta/Bari | Frontend e API agenda con controlli sedi presenti; agenda in lettura; gestione operatori e modifica appuntamenti non implementate |
| Area assistiti | Specifiche, validatori, proiezioni e permessi presenti; login assistiti, archivio, upload e lavorazione end-to-end non implementati; endpoint pratiche restituisce 503 intenzionalmente |
| Prenotazioni/Google Calendar | Codice presente e test locali parziali; mancano prove reali di OAuth, Gmail e Calendar; prenotazioni simultanee non garantite atomicamente |
| Prenotazioni Bari | Disabilitate: orari, indirizzo e conferme della sede non definiti nel percorso pubblico |
| Segretaria AI | Codice esistente non modificato né chiamato; nessuna chiave disponibile nell'ambiente locale; nessuna prova live o verifica modello |
| GDPR/cookie | Duplicazione controller corretta; mancano revisione informative effettive, fornitori/accordi, retention e verifica tracciamenti reali |
| PWA | Manifest e service worker pubblico/gestionale presenti; niente cache di dati personali; installazione iPhone/Android non collaudata; PWA assistiti non implementata |

## Operazioni che richiedono intervento della responsabile

1. Rendere disponibile un ambiente di collaudo e gli accessi ai servizi già posseduti, senza riattivare Netlify né acquistare servizi. Il repository non fornisce accesso alle impostazioni Google o al runtime Netlify.
2. Effettuare l'autorizzazione Google con l'account scelto; configurare segreti e calendari distinti tramite canali privati; confermare account amministratrice/operatori, orari e indirizzo Bari. Non inviare segreti in chat o nel repository.
3. Confermare il fornitore/ambiente già disponibile per autenticazione assistiti, database e archivio privato, scansione antivirus, backup e audit, con relativi accordi di trattamento. Non è stata attivata infrastruttura o archiviazione di documenti reali.
4. Per l'AI scegliere riuso o creazione sicura di una chiave e un budget autorizzato. Il vincolo attuale di nessuna spesa impedisce un collaudo reale a pagamento; nessuna chiave creata o riutilizzata.
5. Validare titolare, informative, basi giuridiche, tempi di conservazione e fornitori con il referente privacy. Le informazioni obbligatorie non possono essere semplicemente omesse dall'informativa.

Dopo la disponibilità dell'ambiente e degli accessi restano **lavori di sviluppo**, non soltanto configurazione: area assistiti completa, documenti privati PDF con scansione, gestione pratiche e operatori, prenotazione atomica, audit/retention, PWA assistiti. Seguiranno collaudi reali e visuali prima di ogni rilascio.

Netlify resta bloccato con `ignore = "exit 0"`. Nessun deploy, riattivazione o spesa effettuata. Le modifiche sono preparate su un branch separato per non pubblicare accidentalmente codice non collaudato end-to-end.
