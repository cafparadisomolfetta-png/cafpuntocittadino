# Distribuzione controllata su Aruba — Punto Cittadino Italia

## Stato al 27 ottobre 2026
- Branch di collaudo: `release/molfetta-only-20261027`.
- Build GitHub Actions: superata; pacchetto statico disponibile tra gli artifact del workflow.
- Diagnostica del dominio pubblico: non superata, perché file della nuova versione e area gestionale restituiscono 404.
- Deploy della nuova versione: **non eseguito**. La versione già online non deve essere sovrascritta senza un backup.
- Progetto estraneo: Punto Cittadino Italia Tech (non distribuire da questo repository).

## Procedura corretta per l'hosting
1. Accertare quale **piano Aruba** sia stato attivato (hosting Linux, Windows, VPS o cloud) e se il dominio punta effettivamente a esso; senza questa informazione non impostare percorsi server o DNS a caso.
2. Eseguire un backup verificato del sito e della configurazione DNS correnti; predisporre una directory di staging protetta.
3. Scaricare da GitHub Actions l'artifact `punto-cittadino-statico-<SHA>` generato da preflight. Il contenuto di `dist/` costituisce il frontend, non tutto il backend.
4. Pubblicare **solo in staging** i file contenuti nel pacchetto statico, mantenendo le sottocartelle (in particolare `gestionale/`). Verificare URL relativi, service worker e cookie policy.
5. **Non attivare le prenotazioni** sul nuovo dominio finché non viene individuato un runtime compatibile con le funzioni Netlify e i relativi servizi (Google OAuth, Calendar, Gmail, Netlify Blobs, funzioni programmate).
6. Conservare i segreti solo nell'ambiente server (non in HTML, JavaScript pubblico, GitHub o documentazione).
7. Ripetere test autenticazione Google, agenda, disdette 48 ore, blocco conflitti, email, AI Cloe, privacy e backup, con credenziali di test e calendario dedicato.
8. Solo dopo approvazione tecnica del collaudo end-to-end spostare il dominio alla nuova distribuzione con piano di rollback.

## Verifica finale
Il workflow `.github/workflows/public-smoke.yml` controlla URL pubblici ed endpoint con metodi non distruttivi. Il test deve terminare con successo **dopo** la pubblicazione; un successo in staging non sostituisce il collaudo reale sul dominio. Non introdurre mai documenti reali di assistiti nei test.

## Limitazione non risolta
Non è disponibile tramite il collegamento GitHub un accesso amministrativo al pannello Aruba o alla configurazione runtime. Nessuna modifica in questo documento costituisce migrazione effettuata.
