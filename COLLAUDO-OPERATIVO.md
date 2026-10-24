# Ordine delle prove prima dell'uso reale

Aggiornamento 24 ottobre: consultare prima [VERIFICA-SERA-2026-10-24.md](VERIFICA-SERA-2026-10-24.md) e [VERIFICA-COSTI-RILASCIO-2026-10-24.md](VERIFICA-COSTI-RILASCIO-2026-10-24.md). Le indicazioni su fornitore e AI qui sotto descrivono anche fasi precedenti; non attestano acquisti o attivazioni.

Il lavoro sul codice prosegue senza accendere il PC della sede. La prova locale Windows viene lasciata all'ultimo passaggio della preparazione. Questo non sposta automaticamente sul PC i servizi operativi: disponibilità del server, configurazione Google, antivirus, backup e prove reali restano requisiti distinti.

Decisione aggiornata il 17 ottobre: server Linux e backup separato su Aruba. I confronti economici precedenti sono storici; verificare il preventivo finale prima di qualsiasi acquisto. Nessuna risorsa acquistata da questa sessione. AI e Netlify restano disattivati. La checklist corrente è [CHECKLIST-RILASCIO.md](CHECKLIST-RILASCIO.md).

## Preparazione già eseguita

- Codice e documentazione nel branch `codex/verifica-sicurezza-2026-10-12`; nessuna modifica pubblicata da questo branch.
- Sito pubblico, aree assistiti/collaboratori, workflow, PDF, agenda, disdette, PWA e moduli opzionali verificati con dati sintetici.
- Controllo offline della configurazione e avvio bloccato prima del vault se incompleta.
- Verifica archivio e anteprima retention in sola lettura: un archivio mancante o non inizializzato è un errore, non viene creato e dichiarato valido. Backup/restore respingono percorsi che tramite link portano nel repository.
- Archivio e backup cifrati; su POSIX lo snapshot temporaneo del backup nasce con umask privato, ripristinato anche in errore. Su Windows restano da verificare le ACL NTFS.
- Gmail e calendari leggibili tramite Work. Questo non fornisce al sito le credenziali OAuth.
- Netlify verificato in precedenza: progetto disabilitato per limite crediti superato. Nessun riavvio, cambio piano, modifica DNS o acquisto.
- Le schermate Register.it inviate dall'utente mostrano dominio e icone di servizi; nell'elenco scadenze compare il dominio. Non è stato verificato un server compatibile attivo. L'accesso nel browser del telefono non equivale all'accesso nel browser condiviso.

## Condizioni da risolvere prima del collaudo operativo

| Condizione | Evidenza richiesta | Stato |
| --- | --- | --- |
| Server Aruba e backup separato | Sistema effettivamente disponibile con Node compatibile, HTTPS, disco persistente privato, accessi e backup separati | Fornitore scelto; risorse e accessi operativi ancora da verificare |
| Configurazione Google del sito | Client/origini corrette, calendario distinto per sede, scope effettivi Calendar/Gmail, ruoli e revoca | Credenziali presenti per nome su Netlify, valori non esportati; runtime da configurare |
| Antivirus | ClamAV reale, firme aggiornate, PDF pulito accettato, file di test infetto rifiutato e scanner indisponibile bloccante | Solo scanner simulato |
| Sedi | Avvio con sola Molfetta; ulteriori sedi dopo configurazione e collaudo | Bari esclusa dall’avvio, vedi SEDI-ATTIVE.md |
| Privacy e conservazione | Conferme del titolare per informative, fornitori e durate effettive di pratiche/CV/notifiche/audit/backup | Da confermare sull'ambiente scelto |
| AI | Decisione su provider/modello/budget e condizioni effettive, poi qualità e costi verificati | Disattivata per il divieto di spesa |
| Telefono e WhatsApp | Provider, numero, consenso, template, errori e costi; prove senza duplicare prenotazioni o messaggi | Adattatore promemoria WhatsApp con provider simulato, non collegato alle prenotazioni; segretarie voce/chat solo simulate. Vedi WHATSAPP-PROMEMORIA.md. SMS esclusi |

Non attivare le flag di revisione/abilitazione per far superare un controllo: devono descrivere una condizione realmente soddisfatta. Non incollare chiavi, password, token, codici trasferimento dominio o documenti personali in chat/GitHub.

## Prove dell'ambiente configurato

Usare account di prova, dati inventati e calendari dedicati o appuntamenti di collaudo riconoscibili. Nessuna prova su pratiche reali o selezione di candidati reali.

| Prova | Esito atteso prima del rilascio |
| --- | --- |
| Login assistito | Accesso personale; il secondo account non vede pratiche o PDF del primo |
| Collaboratori e sedi | Ruoli effettivi; operatore Molfetta escluso da Bari e viceversa; viewer senza scritture |
| Revoca collaboratore | Accesso respinto anche con una sessione già aperta; nessuna risposta tardiva visibile dopo logout |
| PDF | Solo PDF ammessi; dimensioni/duplicati/file infetti/scanner guasto rifiutati; download riservato e senza cache |
| Workflow | Richiesta, documento integrativo, lavorazione e chiusura con stato coerente per assistito/operatore |
| Calendario | Prenotazione singola; doppia richiesta sullo stesso slot senza doppio evento; disponibilità e fuso Europe/Rome corretti |
| Spostamento/disdetta | Permessi, versione evento, limite pubblico 48 ore, slot liberato/conservato secondo esito certo/incerto |
| Email | Mittente, destinazione di prova e contenuto corretti; errori incerti non generano reinvii automatici |
| Backup | Snapshot cifrato; verifica archivio esistente; restore in directory nuova, controllo integrità e recupero dati sintetici |
| Conservazione | Anteprima delle scadenze; cancellazione solo delle prove scadute secondo policy; procedura separata per copie/backup |
| News | Fonte istituzionale; cambiamenti da verificare; nessun testo pubblico senza approvazione amministratrice |
| UI | Tutte le pagine e i pulsanti, tastiera, errori comprensibili e layout desktop/mobile |
| PWA | Installazione assistiti e collaboratori su iPhone/Android, aggiornamento, logout e nessun documento nella cache |
| Sicurezza host | TLS/accessi/MFA/ACL, ripristino, monitoraggio e gestione incidenti verificati sul sistema effettivo |

Il superamento dei test automatici locali non sostituisce queste prove. Non segnare una riga come verificata solo perché il relativo modulo è implementato.

## Ultimo passaggio locale sul PC Windows

Scaricare il branch aggiornato, estrarre il ZIP ed eseguire `COLLAUDO-WINDOWS.cmd` secondo [la guida](COLLAUDO-WINDOWS.md). Raccogliere schermata ed eventuali errori. La procedura è preparata e verificata nel runtime Linux della sessione; l'esecuzione su Windows resta da effettuare dall'utente.

## Decisione di rilascio

Il progetto resta non pubblicato finché mancano ambiente o prove reali dei moduli da esporre. Modelli di installazione disponibili in deployment/README.md; non ancora installati o validati sul server finale. Con il divieto di spesa, le chiamate AI restano disattivate. Non togliere `ignore = "exit 0"`, non cambiare il branch produzione, non attivare Netlify e non trasferire il dominio come parte del collaudo. Nessuna approvazione generale al lavoro sostituisce i risultati dei controlli.
