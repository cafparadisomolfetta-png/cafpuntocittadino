# Punto Cittadino Italia — progetto originale e stato effettivo

Ricostruzione del 27 ottobre 2026, dalle decisioni visibili nella conversazione, dal codice e dall'ispezione dei due domini. Documento di stato e di lavoro: non attesta il completamento del progetto o la conformità GDPR. Progetto distinto da Punto Cittadino Italia Tech/Punto Cittadino Pro.

## Aggiornamento operativo successivo alla ricostruzione

Il 27 ottobre è stata pubblicata sul dominio principale la build del codice `269111b`: categorie compatte e schede con URL dedicati. Verificato nel browser il percorso CAF → ISEE → ritorno alla categoria. La precedente build è conservata sul VPS per rollback. I riferimenti più sotto alla mancata pubblicazione descrivono lo stato osservato prima di questo intervento.

Verifica diretta nell'account Aruba: `puntocittadinoitalia.it`, servizio **Dominio con Email**, attivo, scadenza **25 ottobre 2027**, ordine del 24 ottobre pagato **€4,87**. Non risulta un hosting applicativo aggiuntivo in questo elenco; il sito resta sul VPS Netcup. Nella gestione posta è attiva soltanto `postmaster@puntocittadinoitalia.it`. Preparata la creazione di `info@puntocittadinoitalia.it`, fermata prima dell'inserimento della nuova password, che deve effettuare personalmente il titolare. La nuova casella non è ancora creata e non è stata dichiarata collaudata.

Backup notturno del 27 ottobre verificato: timestamp registrato `2026-10-27T02:28:37.507Z`, servizio con risultato positivo. Eseguito inoltre un backup successivo alla pubblicazione, concluso con `Result=success` ed `ExecMainStatus=0`. Google riconvalidato sul VPS: refresh, scope e account calendario tutti positivi. Il controllo runtime segnala soltanto `privacy` ed `enabled`: nessun flag è stato modificato per aggirare la revisione o dichiarare il gestionale già attivo.

### Collaudo Calendar/Gmail successivo

Il 27 ottobre è stato eseguito `deployment/check-live-booking.cjs --run`, con account ufficio verificato e vault locale temporaneo separato da quello di produzione. Disponibilità, creazione evento, rifiuto della doppia prenotazione con 409, disdetta, rilascio dello slot e rimozione dell'evento di prova sono riusciti. Gmail ha accettato le due conferme. La ricezione delle due email è stata poi verificata separatamente nel connettore Gmail dell'account ufficio, con etichetta INBOX; non sono stati coinvolti assistiti o altri destinatari. Nessun codice di disdetta o token è registrato qui.

La prova riguarda il backend effettivo usato dal runtime e i provider reali. Il sito pubblico resta in modalità contatti finché non vengono conclusi revisione/configurazione private e collaudo nel browser; login Google reale, promemoria e apertura dell'area assistiti restano distinti. `inboxDeliveryVerified:false` nel rapporto dello script significa che lo script da solo non legge la casella: la ricezione è stata verificata attraverso il connettore separato.

## 1. Identità e grafica da conservare

Nome pubblico definitivo: **Punto Cittadino Italia**. Assistenza in tutta Italia; contatti urgenti per iscritto, email/WhatsApp, con eventuale ricontatto della sede. Nessuna nuova proposta grafica.

Il riferimento documentato in `VERIFICA-GRAFICA-2026-10-14.md` comprende blu e turchese, fotografie, schede colorate arrotondate, pulsanti arrotondati e identità coordinata per sito, assistiti, candidature e gestionale. La simulazione di 31 schermate citata nel documento era una dimostrazione, non 31 funzioni già operative.

Palette del tema implementato: blu scuro `#073873`, blu pulsanti `#075bc7`, turchese `#009cbf`, azzurro chiaro `#e8f7ff`, fondo `#f5fbff`; card anche verde chiaro, pesca e lilla, con linguette colorate per servizio. Tipografia del tema coordinato: Arial/system-ui. Le pagine storiche conservano anche stili e font precedenti: questa compresenza richiede allineamento, non dimostra una nuova approvazione dell'utente.

Layout concordato: intestazione con marchio; menu delle otto categorie; introduzione con immagine; card cliccabili; scheda dedicata al servizio con descrizione e documenti; ritorno alla categoria; navigazione tra aree. Eliminare ripetizioni e pagine che contengono tutti i servizi. Gestionali con navigazione laterale, adattata su mobile. Conservare fotografie, simboli e colori approvati. Ridurre margini bianchi eccessivi; non mostrare prezzi/tariffe pubbliche o indirizzo di Molfetta nei blocchi promozionali. Non cancellare il titolare legale dalle informative per il solo rebranding.

File effettivi di riferimento:

- `approved-design.css`: palette, card, pulsanti, responsive, aree private.
- `approved-design.cjs`: applicazione della grafica e del marchio alla build.
- `assets/punto-cittadino-brand.png`: marchio esportato dalla sorgente approvata.
- `assets/caf-consulenza.svg`, `assets/caf-previdenza.svg`: immagini incorporate derivate dai riferimenti della chat.
- `service-visuals.js`: fotografie incorporate e colori delle schede.
- `index.html`, `caf.html`, `patronato.html` e le altre pagine: contenuti storici.
- `public-pages.cjs`: correzione recente della separazione categorie/schede; non è un nuovo riferimento grafico approvato.

I due riferimenti grafici originari citati nel verbale del 14 ottobre non sono stati identificati in questa verifica come file autonomi della chat. Non attribuire loro nomi o identificativi inventati. Il sito storico è un riferimento parziale utile, non una specifica completa automaticamente approvata.

## 2. Repository e versioni

Repository: https://github.com/cafparadisomolfetta-png/cafpuntocittadino

Ramo di lavoro: `codex/verifica-sicurezza-2026-10-12`. Ultimo commit del codice verificato prima di questo documento: `269111b994e00b6cd51bbc91838398573c27c56b`. Il ramo remoto `main` risulta a `bc1a84042a89bd1f520eaf0530d7ab4c056fd64a`; non è allineato automaticamente al ramo di lavoro.

Ultimi interventi:

- `7f5c538`: distinzione tra chiave SFTP assente ed errore di accesso.
- `527ce06`: verbale backup esterno, ripristino e timer attivato.
- `b41fc0f`: separazione delle categorie e generazione di URL per le schede.
- `269111b`: ordine introduzione/card e soppressione dei menu storici ripetuti.

Le correzioni delle pagine sono su GitHub e sono state compilate/collaudate; la versione principale del nuovo dominio, osservata oggi, mostra ancora la vecchia build di lancio limitata ai contatti. Non dichiarare completata la loro pubblicazione. Prima di questo documento il checkout locale era pulito: nessuna modifica locale del codice risultava non trasferita sul ramo remoto. La decisione CLOE viene registrata qui; la relativa implementazione non esiste ancora.

## 3. I due siti online

`https://cafpuntocittadino.it/`, osservato oggi: versione storica CAF Punto Cittadino, con fotografie/card, indirizzo e nome precedenti, calendario visibile e pulsante Segretaria AI. Presenti anche link sbagliati, per esempio Lavora con noi verso Lavoro/Sindacato. Nessuna prenotazione o chiamata AI reale eseguita nella verifica: vedere un modulo non prova il funzionamento del backend. Il gestore attuale dell'origine del vecchio dominio non è stato riconfermato; Netlify è l'hosting storico, non una deduzione sufficiente sullo stato odierno.

`https://puntocittadinoitalia.it/`, osservato oggi: marchio nuovo, contatti email/WhatsApp, pagine e avviso di preparazione; agenda automatica, documenti e aree private non attivi. È una pubblicazione parziale, non il progetto completo. La fonte dei problemi di navigazione comprende sezioni storiche duplicate, CSS che nasconde contenuti e collegamenti generici anziché specifici.

## 4. Sito pubblico previsto e componenti esistenti

Otto pagine: Home; CAF e Fiscale; Patronato/INPS; Lavoro/Sindacato; Area Aziende; News e Bonus; Servizi online; Lavora con noi. Catalogo applicativo di 30 servizi e percorsi guidati bonus/pensioni già presenti.

Prenotazioni: servizio, giorno, slot di 20 minuti, modalità in presenza/telefonico/WhatsApp; verifica disponibilità Calendar; conferma email; disdetta con codice con almeno due giorni di anticipo. Orari e servizi vanno riconciliati con la configurazione approvata, evitando che testi storici e runtime usino versioni diverse. Non riattivare il vecchio endpoint Netlify come equivalente del backend nuovo, che aggiunge controllo persistente degli slot.

Google: progetto `caf-punto-cittadino-ai`; login Google e integrazione Calendar/Gmail distinti. Sul VPS sono stati completati consenso e verifica reale di refresh, scope e account Calendar. Mancano prova completa di prenotazione/disdetta, ricezione email e verifica dello stato dell'app OAuth per uso stabile.

Segretaria AI: interfaccia testuale e backend presenti (`netlify/functions/segretaria-ai.mjs`, `server/assistant.cjs`, `assistant-guidance.cjs`). Non operativa sul nuovo sito. Il backend richiede configurazione privata, abilitazione e autorizzazione alla spesa separate, con limite giornaliero. Un link WhatsApp non è una segretaria automatica. Nessun SMS.

Notizie: raccoglitore/fonti, titoli, coda di revisione e scheduler predisposti. Non attestato un aggiornamento automatico attivo sul nuovo sito. Preferenza settimanale/venerdì se utile a contenere i costi. Il sistema non verifica da solo tutti i testi storici, importi o requisiti delle prestazioni. Le automazioni personali della chat non aggiornano automaticamente il sito.

Privacy/cookie: popup centrale con Personalizza / Continua senza accettare / Accetta e link informativa; Privacy fuori dal menu principale, collegamenti completi nel footer. Controller condiviso e pagine dedicati presenti; il vecchio sito mostra ancora finestre e testi precedenti. Informative tecnicamente presenti non equivalgono a revisione organizzativa completata.

Moduli: candidature e richieste documentali passano al backend riservato, con PDF controllati; niente raccolta di documenti reali tramite vecchi form pubblici. Social: link presenti. Messenger, blog e YouTube indicati nelle simulazioni precedenti non risultano integrazioni complete distribuite.

## 5. Gestionale

Codice presente in `gestionale/`, `server/` e moduli `netlify/functions/pratiche-*`. Amministratrice con visibilità sulle sedi attive; manager/operatori limitati alle sedi assegnate; viewer in sola lettura; assistito limitato ai propri dati. Autorizzazioni verificate dal server, non soltanto dai pulsanti.

Ultima scelta documentata: avvio con **Molfetta**, Bari disattivata (`SEDI-ATTIVE.md`). Supporto multisede conservato; non aprire Bari automaticamente. Amministrazione iniziale collegata all'account dell'ufficio confermato.

Funzioni implementate: agenda, spostamento/annullamento autorizzato, fascicoli, richieste di integrazione, stati, documenti PDF, approvazione operatore, accettazione condizioni/importo, verifica manuale dell'incasso, audit, collaboratori e revoche. Il sistema non esegue bonifici, non attesta automaticamente l'incasso e non sostituisce mandati, firme o invii agli enti.

Da completare: configurazione finale dei moduli opzionali e conservazione, prove con account reali e più utenti/ruoli, notifiche effettivamente ricevute, percorso completo sul dominio definitivo e attivazione del runtime. Il gestionale resta chiuso al pubblico.

## 6. App PWA

Assistiti: account personale, richieste, PDF, integrazioni e stato pratiche. Collaboratori: agenda e funzioni consentite dal ruolo. Manifest, icone e service worker presenti in `assistiti/` e `gestionale/`.

Si tratta di app web installabili previste dal progetto, non app native pubblicate negli store. Nessuna cache offline dei documenti o delle risposte autenticate; non promettere lavoro offline sulle pratiche. Installazione, aggiornamento e logout da provare su Android, iPhone e Windows reali. Nessuna notifica push garantita dal solo manifest.

## 7. Hosting, dominio e costi

Assetto effettivamente preparato: VPS **Netcup**, dominio nuovo/DNS presso **Aruba**, backup **Hetzner Storage Box BX11** separato. Server Node 24, Nginx e HTTPS. Aruba hosting completo e altri VPS erano alternative, non servizi da comprare insieme. Nessuna riattivazione Netlify necessaria al nuovo backend.

Backup BX11: acquisto del titolare e canone confermato di **€3,90/mese IVA inclusa**. Netcup: riferimento economico del 24 ottobre **€9,74/mese**, fatturazione/minimo trimestrale indicati allora; importo contrattuale finale da fattura, non riconfermato in questa verifica. Dominio/email Aruba: precedente riferimento di rinnovo circa **€20,12/anno IVA inclusa**, non un importo di fattura riconfermato oggi. Evitare nuovi acquisti duplicati.

AI, avatar/voce, centralino e automazioni WhatsApp non sono inclusi nel backup o nel solo VPS; provider, consumi e limiti richiedono definizione. L'autorizzazione a completare il progetto non viene trasformata in un budget illimitato per nuovi abbonamenti.

Vecchio dominio: ancora raggiungibile, non reindirizzato al nuovo. Trasferimento/redirect Register.it–Aruba e mantenimento della posta/PEC da completare; non cancellarlo per eliminare la duplicazione. Caselle Aruba e consegna non riconfermate; contatto e mittente applicativo previsto restano Gmail dell'ufficio.

## 8. Sicurezza e stato dei collaudi

Già verificati nelle sessioni precedenti: HTTPS e rinnovo, restrizione dell'esposizione dei sorgenti, permessi e isolamento in test, cifratura applicativa, ClamAV reale (anche indisponibilità scanner), workflow HTTP sintetico, backup/ripristino locale ed esterno. I conteggi storici delle suite non equivalgono a un collaudo umano completo di ogni funzione pubblicata.

Backup esterno: accesso con chiave dedicata, passphrase inserita e conservazione separata confermata dal titolare; prova di recupero di fascicolo/PDF sintetici; 239 file di codice/build/configurazioni ripristinati con verifica hash; esecuzione systemd riuscita; timer abilitato tra 03:15–03:30 Europe/Rome. Questo fotografa il collaudo del 26 ottobre, non conferma l'esito del successivo job notturno del 27. Il vault di produzione risultava non inizializzato: nessun recupero di fascicoli reali è stato dichiarato.

Ancora da chiudere: tempi di conservazione e cancellazione anche dei backup; informative e presupposti/mandati; accordi fornitori; accessi e revoche reali; ricezione email; prova di recupero periodica; monitoraggio errori; dispositivi; carico e sicurezza operativa. Nessuna attestazione di conformità viene inventata per superare i controlli di avvio.

## 9. Nuova decisione: CLOE

**CLOE** è un avatar femminile parlante ispirato a Francesca, leggermente più giovane. Il volto è già stato creato in un'altra conversazione e sarà allegato separatamente. Non ricrearlo, non sostituirlo con un volto generico e non dichiararlo già integrato.

CLOE deve utilizzare e affiancare la segretaria AI esistente: stesso servizio di assistenza, presentazione visiva e voce aggiunte. Da implementare immagine/animazione, voce italiana, ascolto del microfono quando attivato dall'utente, lettura risposte, comandi audio e fallback testuale. Microfono, trascrizione, sintesi vocale, privacy e costi vanno definiti e collaudati; non attribuire a CLOE accesso automatico ai fascicoli. Centralino telefonico e WhatsApp automatico restano integrazioni distinte.

## 10. Elenco operativo in ordine di priorità

1. **Allineare il prodotto e la grafica**: conservare i riferimenti approvati, confrontare vecchio sito/nuova build, rimuovere duplicazioni, pubblicare e provare le pagine separate già su GitHub. Collegamenti corretti per ogni card; controllo desktop/mobile e navigazione indietro.
2. **Chiudere i prerequisiti dei dati**: dati del titolare, informative, mandati/condizioni/IBAN, conservazione per servizio/CV/notifiche/audit/backup e gestione fornitori. Verificare il job di backup del 27 ottobre e mantenere il restore collaudato.
3. **Completare Google e agenda**: stato OAuth e token, account/calendario corretti, prenotazione reale di prova, conflitto slot, modifica, disdetta, fuso e conferme/promemoria ricevuti. Usare identità di test autorizzate.
4. **Aprire al collaudo gestionale e assistiti**: inizializzazione controllata, amministratrice/operatori, sola Molfetta; due assistiti, approvazione, condizioni/importo, verifica incasso, PDF, integrazione, chiusura, permessi e revoca. Backup del vault dopo l'inizializzazione e prova di ripristino.
5. **Completare moduli operativi**: email/coda/scheduler, candidature, richiamate, news con revisione fonti, collegamenti social e componenti approvati ancora soltanto simulati.
6. **Riconvalidare la segretaria AI esistente**: configurazione privata, limiti/costi concordati, risposta reale senza dati personali, fallback ai contatti; nessun invio automatico non previsto.
7. **Integrare CLOE** dopo ricezione dell'immagine: stessa segretaria, volto approvato, audio/microfono e fallback, accessibilità, mobile, costi e privacy. Non sostituire la segretaria testuale.
8. **Collaudare le PWA** su dispositivi reali: installazione, aggiornamento, logout, permessi e assenza di cache dei PDF.
9. **Unificare la pubblicazione**: dominio principale definitivo, redirect del vecchio con preservazione mail/PEC, revisione testi storici e controllo finale di tutte le funzioni. Trasferimento dominio solo secondo necessità e piano approvato.
10. **Chiudere il rilascio**: registrare versione distribuita, esiti e limiti; piano di manutenzione, monitoraggio e ripristino. Il progetto è completo solo quando i percorsi concordati funzionano sul dominio finale, non perché esistono i relativi file.

Questa lista mantiene il progetto originale e la nuova decisione CLOE. Non dichiara completata l'implementazione delle attività elencate.
