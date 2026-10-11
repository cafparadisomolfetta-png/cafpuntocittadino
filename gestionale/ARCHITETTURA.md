# Gestionale: configurazione prima del rilascio

## Struttura organizzativa confermata
Le sedi iniziali sono **Molfetta** e **Bari**. La titolare del gestionale avrà un solo profilo **admin**, valido per entrambe le sedi, e svolgerà anche la funzione di responsabile. Il ruolo admin comprende la visibilità di entrambe le sedi senza creare un secondo account responsabile. Altri responsabili, operatori e lettori restano limitati alle sedi assegnate. Non inserire l'indirizzo personale dell'amministratrice in GitHub: configurarlo soltanto nelle variabili Netlify.


La app è una web app responsive con login tramite Google Identity Services e agenda **in sola lettura**. Nessun utente è abilitato in automatico. Il codice non contiene password o refresh token.

## Impostazioni necessarie in Netlify (variabili di ambiente, NON GitHub)
- `GESTIONALE_GOOGLE_CLIENT_ID`: OAuth web client ID di Google Cloud. Aggiungere il dominio finale nelle *Authorized JavaScript origins*.
- `GESTIONALE_OPERATORS_JSON`: JSON con utenti abilitati manualmente, ad esempio:
  `[{"email":"amministratrice@example.org","role":"admin","sites":["molfetta","bari"],"enabled":true},{"email":"operatore@example.org","role":"operator","sites":["molfetta"],"enabled":true}]`
- `GESTIONALE_SITE_CALENDARS_JSON`: mappa fra sede autorizzata e ID calendario Google, ad esempio `{"molfetta":"primary"}` (valore da verificare nell'account che ha autorizzato il refresh token).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`: già utilizzate dal sito per gli appuntamenti; ricontrollare gli scope Calendar.

## Permessi
**Visibilità operatori confermata:** ciascun operatore autenticato può consultare **tutti** gli appuntamenti della propria sede autorizzata, indipendentemente dall'operatore cui sono assegnati. Non può consultare appuntamenti di altre sedi non assegnate. L'amministratrice/responsabile può consultare entrambe le sedi (Molfetta e Bari). Restano in vigore le limitazioni sulle operazioni di modifica e sui dati riservati.

Il controllo email verificata + audience del token Google viene svolto dal server e i ruoli/sedi derivano unicamente da `GESTIONALE_OPERATORS_JSON`. Ogni lettura seleziona un calendario dalla mappa server e impone l'appartenenza dell'utente alla sede. La dashboard non espone codice di disdetta, descrizione libera, né password/token Google.

I ruoli sono `admin`, `manager`, `operator`, `viewer`. **In questa versione tutti hanno solo lettura**; l'interfaccia per invitare/disabilitare operatori, modificare appuntamenti, generare notifiche push e gestire più sedi non è ancora stata sviluppata. I privilegi di gestione vanno implementati e testati lato server, non solo nella UI.

## Prima di rendere live
1. Verificare assenza di credenziali e dati personali nel repo e nel bundle pubblico.
2. Testare token assente, scaduto, di altro client, account non presente, sede non autorizzata, calendario indisponibile.
3. Configurare MFA degli account Google, revoca utenti in Netlify, monitoraggio accessi e tempi di conservazione.
4. Verificare form e funzioni originali, dominio, email e refresh token.
5. Valutare con attenzione privacy e separazione dei calendari: un calendario unico per più sedi NON garantisce l'isolamento per sede.
6. Solo a test superati, rimuovere `ignore = "exit 0"` nel file `netlify.toml` e pubblicare una versione verificata.

**Non acquistare crediti Netlify finché non è pronto il collaudo finale e la configurazione degli accessi.**
