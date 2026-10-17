# Rilascio Aruba — Punto Cittadino Italia

Aggiornamento: 17 ottobre 2026. **Non ancora pubblicato né collaudato in produzione.** Questa checklist sostituisce le precedenti indicazioni di riattivazione Netlify. Il progetto completo usa un VPS Linux con backend persistente; il PC Windows non è il server.

## Decisioni confermate

- Nome pubblico: **Punto Cittadino Italia**. Dominio mantenuto: `cafpuntocittadino.it`.
- Grafica approvata blu/turchese, logo esistente con aggiunta testuale “Italia”.
- Assistenza soprattutto online in tutta Italia, senza prezzi o indirizzo nelle sezioni promozionali. Informative e identità legale richiedono dati effettivi corretti.
- Avvio con una sede interna attiva; Bari predisposta ma disattivata. La configurazione interna non limita il territorio degli assistiti.
- Prenotazioni per telefono, WhatsApp con un operatore e presenza concordata; 30 servizi, compresi INAIL e “Altro”. SMS esclusi.
- Segretaria AI telefonica e WhatsApp automatico rinviati. Nessuna chiamata AI a pagamento autorizzata o effettuata.
- Link pubblici ai profili esistenti Facebook, Instagram e TikTok; rinomina e collegamento amministrativo social separati dal rilascio del sito.
- Server e backup: Aruba. Nessuna risorsa acquistata o configurata da questa sessione. Nessuna autorizzazione di spesa implicita.
- Netlify sospeso; non rimuovere `ignore = "exit 0"` e non usarlo come destinazione del nuovo backend.

## Codice e controlli locali

- [x] Repository recuperato dal ramo `codex/verifica-sicurezza-2026-10-12`.
- [x] Suite iniziale: 140 test di comportamento e 4 test della build superati.
- [x] Nome aggiornato nel sito, aree riservate, manifest PWA e testi email.
- [x] Blocco della lavorazione fino alla verifica manuale dell’incasso per importi maggiori di zero; nessuna conferma automatica tramite ricevuta.
- [x] Approvazione operatore e conferma quota prima dei PDF; notifiche email generiche predisposte e testate con provider simulati.
- [x] Intake PDF, integrazioni e stati estesi al catalogo dei 30 servizi; attivazione vincolata alle durate approvate.
- [x] Social aggiunti come semplici collegamenti, senza widget o script di tracciamento social.
- [x] Suite finale: 157 test superati; controlli HTTP locali e rapporto corrente: vedere `VERIFICA-CHIUSURA-2026-10-17.md`.

## Prima dell'accesso al server

- [ ] Attivare l'account Aruba e scegliere il VPS Linux e il backup esterno al server. Contratto, fatturazione e pagamento spettano al titolare.
- [ ] Verificare un metodo autorizzato di amministrazione del VPS; password, chiavi e token non vanno inviati in chat o salvati nel repository.
- [ ] Confermare titolare/responsabili, informative definitive, tempi di conservazione per pratiche, candidature, notifiche, audit e backup. Non inventare durate per superare il controllo.
- [ ] Configurare OAuth Google per il sito: origine autorizzata, account amministratrice, calendario e permessi Calendar/Gmail. Le connessioni Google di ChatGPT non configurano automaticamente il sito.

## Preparazione e collaudo privato Aruba

Seguire `deployment/README.md` e `COLLAUDO-OPERATIVO.md` prima di abilitare servizi o cambiare DNS.

- [ ] Node >=22.13, utente dedicato senza login, archivio esterno al codice, permessi e chiave separata dai backup.
- [ ] Installare ClamAV e aggiornare le firme; PDF pulito, file di prova infetto e scanner non disponibile devono produrre gli esiti corretti.
- [ ] Configurare il file privato partendo da `deployment/runtime.env.example`; verificare `npm run check:private` senza esporre valori.
- [ ] Eseguire build e suite sul server; verificare unit con `systemd-analyze verify` e proxy con `nginx -t`.
- [ ] Login con due assistiti distinti, ruoli collaboratori, revoca e isolamento di documenti/pratiche.
- [ ] Prenotazione reale di prova, concorrenza, spostamento, disdetta, fuso italiano e consegna email.
- [ ] Caricamento e download PDF, integrazioni, chiusura pratica, limiti e riservatezza.
- [ ] Backup cifrato trasferito fuori dal VPS, restore in ambiente separato e verifica dei dati sintetici recuperati.
- [ ] Controllare pagine desktop/mobile, tastiera, errori e installazione/aggiornamento PWA su dispositivi reali.
- [ ] Attivare e verificare scheduler per news e promemoria; monitoraggio e procedure di ripristino.

## Passaggio in produzione

- [ ] Certificato HTTPS valido, rinnovo verificato, firewall e accessi amministrativi verificati.
- [ ] Conservare i record DNS precedenti e una procedura di rollback; puntare il dominio al server effettivo solo dopo il collaudo.
- [ ] Eseguire una prenotazione e una pratica sintetica sul dominio finale; eliminare le prove secondo la procedura appropriata.
- [ ] Dichiarare operativo soltanto ciò che ha superato il collaudo reale. Una build superata non equivale a sito online.

Il trasferimento del dominio da Register.it ad Aruba non è un prerequisito tecnico: il dominio esistente può essere collegato tramite DNS. Non iniziare trasferimenti o acquisti come effetto di un test.
