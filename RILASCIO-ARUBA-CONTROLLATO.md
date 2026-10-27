# Distribuzione controllata su Aruba — Punto Cittadino Italia

## Stato al 27 ottobre 2026
- Branch di collaudo: `release/molfetta-only-20261027`.
- Build GitHub Actions: superata; pacchetto statico disponibile tra gli artifact del workflow.
- Diagnostica del dominio pubblico: non superata, perché file della nuova versione e area gestionale restituiscono 404.
- Deploy della nuova versione: **non eseguito**. La versione già online non deve essere sovrascritta senza un backup.
- Progetto estraneo: Punto Cittadino Italia Tech (non distribuire da questo repository).

## Procedura corretta per l'hosting
1. **Accertato tramite email Aruba:** il servizio attivo dal 25/10/2026 è Dominio con email per `puntocittadinoitalia.it` (scadenza 25/10/2027), non hosting web. Non modificare MX della posta. Verificare la destinazione Netlify e HTTPS prima dei DNS.
2. Eseguire un backup verificato del sito e dei DNS sia di `cafpuntocittadino.it` sia di `puntocittadinoitalia.it`; predisporre staging protetto.
3. Il codice server usa Netlify Functions e Netlify Blobs: preferire un runtime compatibile. Lo stato dell'account Netlify e le variabili d'ambiente non sono stati ancora verificati. Il file `netlify.toml` contiene `ignore = "exit 0"`: i deploy automatici sono sospesi fino a rilascio sicuro.
4. Scaricare da GitHub Actions l'artifact `punto-cittadino-statico-<SHA>` generato da preflight. Il contenuto di `dist/` costituisce il frontend, non tutto il backend.
4. Pubblicare **solo in staging** i file contenuti nel pacchetto statico, mantenendo le sottocartelle (in particolare `gestionale/`). Verificare URL relativi, service worker e cookie policy.
5. **Non attivare le prenotazioni** sul nuovo dominio finché non viene individuato un runtime compatibile con le funzioni Netlify e i relativi servizi (Google OAuth, Calendar, Gmail, Netlify Blobs, funzioni programmate).
6. Conservare i segreti solo nell'ambiente server (non in HTML, JavaScript pubblico, GitHub o documentazione).
7. Ripetere test autenticazione Google, agenda, disdette 48 ore, blocco conflitti, email, AI Cloe, privacy e backup, con credenziali di test e calendario dedicato.
8. Solo dopo approvazione tecnica del collaudo end-to-end spostare il dominio alla nuova distribuzione con piano di rollback.

## Verifica finale
Il workflow `.github/workflows/public-smoke.yml` controlla URL pubblici ed endpoint con metodi non distruttivi. Il test deve terminare con successo **dopo** la pubblicazione; un successo in staging non sostituisce il collaudo reale sul dominio. Non introdurre mai documenti reali di assistiti nei test.

## Limitazione non risolta
Non è disponibile tramite GitHub un accesso amministrativo a Netlify o Aruba. L'accesso dell'utente a Netlify nel browser non autorizza questa chat a eseguire il deploy. Nessuna modifica in questo documento costituisce migrazione effettuata.
