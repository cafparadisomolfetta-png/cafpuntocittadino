> Aggiornamento sviluppo Work: esiste ora un runtime privato separato da Netlify, con area assistiti e gestione pratiche collaudate localmente. Nessun servizio è stato pubblicato. Stato corrente e limitazioni: [VERIFICA-WORK-2026-10-13.md](VERIFICA-WORK-2026-10-13.md). La checklist storica sottostante non equivale a collaudo reale.

# Area assistiti e privacy — specifica pre-rilascio

STATO: progettazione; non pubblicare né attivare upload prima dei collaudi e della revisione privacy.

## Funzioni approvate
- Invio documenti collegato a prenotazione esistente.
- Apertura richiesta e invio documenti senza prenotazione.
- Servizi iniziali: 730 e ISEE, poi altri servizi.
- Area assistito autenticata: Le mie pratiche, stato, ricevuta, richieste integrazione.
- Gestionale: coda pratiche per sede; amministratore Molfetta e Bari, operatori soltanto sede autorizzata.

## Sicurezza
- Allegati ammessi solo in PDF, massimo 10 MiB per file. Verificare estensione, MIME, intestazione PDF e scansione malware sul server.
- Non archiviare documenti in GitHub, cartelle web pubbliche o allegati email.
- Selezionare archivio privato cifrato con accordi di trattamento, controllo accessi server, URL temporanei, audit, backup, cancellazione e retention.
- Autenticare gli assistiti; codice prenotazione ed email da soli non autorizzano il download.
- Verificare tipi/dimensioni file, scansione malware, rate limiting, isolamento fra utenti e sedi.
- Upload non equivale a mandato, firma o invio ufficiale della pratica.

## Finestra cookie
- Verificare prima i tracciamenti effettivi; cookie tecnici non richiedono consenso.
- Se presenti cookie facoltativi: banner al primo accesso, rifiuto semplice quanto accettazione, preferenze granulari non preselezionate, blocco preventivo dei traccianti, link a informative e possibilità permanente di cambiare scelta.
- Non riproporre indebitamente il banner; registrare le preferenze in modo appropriato.
- Privacy policy e cookie policy accessibili dal footer e dalla finestra.
- Verifica legale delle informative, dei soggetti titolari, dei fornitori e dei tempi di conservazione prima del rilascio.

## Collaudi
- Login, ruoli, sedi, autorizzazioni, file non validi, disconnessione, duplicati, ricevute, integrazioni, revoca, retention e mobile iPhone/Android.
- Netlify resta sospeso; nessuna spesa e nessun deploy senza autorizzazione al rilascio.
