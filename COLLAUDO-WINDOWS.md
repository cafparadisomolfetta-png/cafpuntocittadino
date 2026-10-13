> Aggiornamento 13 ottobre 2026: su richiesta della direzione il runtime di produzione non riceve, scansiona o conserva PDF/CV. Rimangono login, stato pratiche, integrazioni e autorizzazioni. I documenti si inviano dalla posta dell’assistito a destinazioni approvate per sede e servizio. Le precedenti istruzioni antivirus/deposito descrivono moduli legacy testati ma non attivati dal runtime. Nessuna cancellazione automatica di archivi o backup preesistenti.

# Collaudo locale su Windows

Questa procedura esegue i test automatici con dati sintetici e crea il frontend in `dist`. Non rende il sito disponibile agli assistiti, non avvia il servizio privato e non configura il PC come server pubblico. Netlify e DNS non vengono modificati. Non inserire documenti o dati degli assistiti durante queste prove.

1. Dal PC Windows scarica il branch `codex/verifica-sicurezza-2026-10-12` da GitHub: **Code → Download ZIP**. Estrai tutta la cartella ZIP, per esempio nella cartella Download. Usa una copia dedicata al collaudo: la build ricrea `dist`.
2. Se Node.js non è installato, usa [il sito ufficiale Node.js](https://nodejs.org/en/download), scegli **LTS**, Windows e Installer `.msi`. Non sono richiesti strumenti di compilazione opzionali. Nessun abbonamento o servizio hosting viene acquistato. L'esecuzione dei test richiede Node >=22.13; è preferibile una versione LTS supportata.
3. Nella cartella estratta fai doppio clic su **COLLAUDO-WINDOWS.cmd**. Il file non scarica dipendenze, non cambia firewall, impostazioni di sicurezza o criteri PowerShell e non richiede di eseguirlo come amministratore. Se Windows impedisce l'esecuzione, comunica il messaggio: non disattivare protezioni.
4. Attendi la scritta **COLLAUDO LOCALE SUPERATO** e invia alla chat la schermata finale. Se compare un errore, invia quella schermata. Non inviare variabili d'ambiente, token o password.

Il launcher rimuove dal processo di test le variabili dei provider e le chiavi private, spegne i moduli a pagamento e usa un preload che blocca le chiamate `fetch` reali a destinazioni esterne. I provider simulati restano simulati. Sono ammessi HTTP su loopback per i test API locali; non viene esposto un servizio sulla rete della sede. I test creano archivi e chiavi sintetici nelle directory temporanee e li rimuovono al termine.

Gli scenari con collegamenti di directory usano junction su Windows per esercitare lo stesso controllo dei percorsi senza richiedere symlink POSIX. La procedura non è stata eseguita su un dispositivo Windows reale in questa sessione: il risultato sul PC deve essere raccolto prima di dichiararne la compatibilità verificata.

Per la fase successiva servono configurazione privata Google, ClamAV reale con firme aggiornate, permessi NTFS effettivi, cifratura e protezione del PC, backup/ripristino, informative/policy approvate e prove UI/dispositivi. `chmod` su Windows non equivale a impostare ACL NTFS. Il PC della sede non diventa automaticamente un ambiente idoneo per dati reali o per l'accesso pubblico: questo collaudo non sostituisce il server operativo.

Riferimenti: [Node.js download](https://nodejs.org/en/download), [Node.js filesystem e junction Windows](https://nodejs.org/api/fs.html#fssymlinktarget-path-type-callback), [stato del progetto](VERIFICA-WORK-2026-10-13.md).
