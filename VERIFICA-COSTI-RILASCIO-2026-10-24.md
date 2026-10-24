# Verifica del progetto e dei costi di rilascio — 24 ottobre 2026

Verifica del codice sul ramo `codex/verifica-sicurezza-2026-10-12`, commit iniziale `f8276b105af62e0d73671aca8114832c4fdbbe2c`. Nessun acquisto, contratto, invio, modifica DNS o pubblicazione effettuati. Questa verifica aggiorna le stime economiche precedenti; non è un preventivo vincolante o una certificazione di sicurezza.

## Esito tecnico

Eseguito nuovamente `node tools/collaudo-locale.cjs`: 155 test di comportamento e 4 della build superati, con dati sintetici e provider simulati. Checkout iniziale pulito e corrispondente al ramo remoto. Il controllo `node server/environment.cjs` restituisce `configured:false`: nell'ambiente locale mancano configurazione privata approvata, archivio/chiave/scanner, identità e permessi Google, calendari e conservazione. Non dimostra che gli account già creati dall'utente non esistano; non verifica i segreti eventualmente conservati in Netlify o nella console Google.

| Parte | Riscontro | Cosa resta prima dell'uso reale |
| --- | --- | --- |
| Sito e servizi | Grafica approvata, catalogo di 30 servizi, contatti scritti e percorsi bonus/pensioni presenti | Revisione dei testi e verifica desktop/mobile completa sul dominio finale |
| Gestionale e assistiti | Codice per ruoli, richieste, PDF, stati, approvazione, accettazione quota e verifica manuale incasso | Prova con due assistiti e operatori diversi; isolamento, revoca e invio notifiche reali |
| Prenotazioni e disdette | Backend Calendar e regole locali testati | Riutilizzare e riconvalidare progetto OAuth, account e calendari già creati; dominio/origini, token, permessi e test reali |
| Email e promemoria | Coda e invio Gmail predisposti | Verificare invio, ricezione e scheduler. L'email Gmail esistente resta utilizzabile; acquistare email Aruba non configura il mittente del software |
| PDF e backup | Validazione PDF, scansione obbligatoria, archivio cifrato, backup/restore applicativi presenti | Scanner reale con firme aggiornate, trasferimento backup fuori server, rotazione e prova di ripristino |
| PWA | Manifest e frontend assistiti/collaboratori presenti | HTTPS e installazione/aggiornamento su Windows, Android e iPhone reali. Nessuno store previsto |
| News | Raccolta di titoli/fonti predisposta | Attivare scheduler e verificare feed; non equivale ad aggiornare automaticamente tutti i testi del sito |
| Social | Link Facebook, Instagram e TikTok presenti | Verificare pagina professionale e rinomina. Messenger, blog e YouTube aggiunti alla simulazione del 24 ottobre, non ancora al prodotto distribuito |
| AI e WhatsApp automatico | Assistente testuale predisposto e adattatore WhatsApp opzionale separato | Non attivi. Centralino vocale non implementato né compreso nell'acquisto VPS; provider, flussi, costi e collaudo separati |

Nel frontend generato restano contenuti pregressi con importi e requisiti di agevolazioni/scadenze: non sono stati verificati sul merito in questo controllo tecnico. Devono essere revisionati con fonti ufficiali prima della pubblicazione. I test superati non costituiscono una verifica editoriale o GDPR.

## Risorse già disponibili e riuso

- Repository e software esistenti: non serve ricomprare un sito, database gestito o una licenza gestionale per questa architettura Node/SQLite.
- Dominio esistente `cafpuntocittadino.it`: nelle schermate fornite, scadenza 14 giugno 2027. Non è stato ricontrollato l'account Register.it né il contratto di rinnovo. Si può collegare via DNS senza trasferirlo subito.
- Nuovo indirizzo desiderato `puntocittadinoitalia.it`: disponibilità e carrello da ricontrollare prima della registrazione; il dominio vecchio non si rinomina gratuitamente nel nuovo.
- Email `cafparadiso.molfetta@gmail.com`, WhatsApp Business `+390806455509`, social e progetto/configurazioni Google precedentemente creati: da riutilizzare dove appropriato, senza dichiararli già riconvalidati sul nuovo server.
- Account/progetto OpenAI già mostrato dall'utente: non implica credito disponibile, API attiva o centralino funzionante. Nessuna chiamata a pagamento eseguita.
- Netlify resta sospeso e non serve per il nuovo backend Linux. Il PC Windows è il terminale di lavoro, non deve restare acceso per ospitare il servizio.

## Prezzi e condizioni verificati

IVA italiana 22% come ipotesi prudente; fatturazione effettiva dipende dall'intestatario. Importi arrotondati e disponibilità non riservata.

**Netcup VPS Lite 2 G12.5s iv 3M**: pagina aperta nel browser, IVA Italia 22%, 9,74 €/mese, setup zero, 4 vCore x86, 8 GB RAM, 160 GB SSD, IPv4+IPv6. Minimo e fatturazione **tre mesi**, quindi circa 29,22 € per il solo server all'avvio; totale fattura da confermare. Localizzazione assegnata tra Norimberga, Vienna e Amsterdam. Non è un server gestito. Gli snapshot non sostituiscono la copia separata.

**Hetzner Storage Box BX11**: listino pubblico 3,20 € + IVA/mese, circa 3,90 € con IVA 22%; 1 TB, Germania o Finlandia. Spazio di destinazione per backup applicativi cifrati, non un backup del progetto già configurato. Prezzo finale, disponibilità e modalità di addebito da confermare nella console; conservazione e chiave separate da configurare.

**OVH VPS-2 2027**: nel configuratore odierno, selezionando il prodotto si imposta inizialmente 12 mesi, totale 86,52 € + IVA anticipato (circa 105,55 €), equivalente 7,21 € + IVA/mese. Selezionando «Nessun impegno contrattuale» il riepilogo cambia a 8,49 € + IVA/mese, circa 10,36 €. In questa sessione il prodotto mostra soltanto Regno Unito/Erith; il controllo non conferma disponibilità UE. Non consigliato come acquisto immediato per il piano con hosting dei dati nell'UE. Backup Standard giornaliero con conservazione 24 ore nello stesso datacenter: non sostituisce la copia separata.

**Correzione delle risposte precedenti:** 8,80 € IVA inclusa è il prezzo equivalente dell'impegno annuale, non quello verificato per il pagamento mensile libero. Il totale precedente di circa 10,48 €/mese con dominio ometteva sia questa differenza sia la copia separata e non rappresenta il costo completo del progetto.

**Aruba VPS O4A8**: 11,79 € + IVA/mese, circa 14,38 €, 4 vCPU, 8 GB RAM, 80 GB. Cloud Backup 50: 6,99 € + IVA/mese, circa 8,53 €, distinto dal VPS. Server+backup Aruba circa 22,91 €/mese; dominio/email non conteggiati. Backup da dimensionare sui dati e sulle versioni effettive.

**Aruba dominio .it con email**: listino 16,49 € + IVA/anno, circa 20,12 €, include cinque caselle da 1 GB e DNS. Eventuali promozioni iniziali e disponibilità del nome da verificare nel carrello; usare il rinnovo ordinario nel budget. Le caselle servono alla corrispondenza: gli invii applicativi attuali usano Gmail, non SMTP Aruba. Un cambio di trasporto richiede implementazione e test.

### Budget comparabile, AI esclusa

| Assetto | Server + backup separato / mese | Con un dominio .it+email Aruba al rinnovo, equivalente mensile |
| --- | --- | --- |
| Netcup + BX11 | circa 13,64 € | circa 15,32 € (circa 184 €/anno) |
| OVH mensile + BX11 | circa 14,26 € | circa 15,94 €, ma UE non disponibile nella verifica |
| Aruba + Cloud Backup 50 | circa 22,91 € | circa 24,59 € (circa 295 €/anno) |

Se si mantiene soltanto il dominio già pagato, il nuovo acquisto dominio non è necessario oggi; il suo futuro rinnovo Register.it è un costo separato non confermato. Se si registrano il nuovo dominio e si conserva il vecchio, dopo la rispettiva scadenza si pagano entrambi finché restano attivi. Il costo equivalente non è la cadenza degli addebiti: Netcup è trimestrale e dominio annuale.

## Costi non compresi o evitabili

- HTTPS Let's Encrypt: certificato gratuito; installazione e rinnovo da configurare.
- ClamAV: nessuna licenza commerciale prevista; firme, risorse e amministrazione restano necessarie.
- PWA: nessun abbonamento per utente/store previsto nel codice; nessuna garanzia di utenti simultanei senza test di carico.
- Calendar: uso standard senza costo aggiuntivo entro le quote pubblicate. Gmail ha limiti di invio: collaudare i volumi prima di valutare un servizio email a pagamento. Non serve acquistare Workspace solo per sostituire una configurazione funzionante, salvo esigenze o limiti effettivi.
- Blog e pagine video: possono usare lo stesso server, ma occorre implementare nel prodotto ciò che oggi è solo simulato. Collegamenti social semplici non equivalgono a API di pubblicazione automatica.
- Centralino AI, WhatsApp automatico, API AI, avatar/voce e strumenti video: separati e non quantificabili seriamente senza provider, volumi, durata chiamate e modalità. Nessun SMS, nessun piano extra attivato.
- Configurazione iniziale, manutenzione, revisione privacy e assistenza sistemistica non sono incluse nei canoni. Non è stato richiesto un preventivo a un tecnico e non è possibile indicarne un costo inventato. L'assistenza in chat non è monitoraggio continuo o reperibilità.

## Raccomandazione e percorso

Per la priorità di risparmio, il candidato più economico tra quelli qui verificati per 8 GB, regione UE e copia separata è **Netcup + BX11**, con dominio/email Aruba solo se si vuole subito il nuovo nome. Non ridurre a 4 GB per far quadrare il prezzo e non comprare un hosting WordPress/Plesk aggiuntivo. Nessun ordine è stato inoltrato e il minimo trimestrale non è stato accettato.

1. Confermare nel riepilogo finale server, IVA, tre mesi, disdetta e backup; registrare il nuovo dominio soltanto dopo controllo del nome oppure usare quello già pagato.
2. Installare e proteggere Linux, Node, nginx, ClamAV, archivio e chiavi. Non pubblicare il portale durante la preparazione.
3. Riconvalidare le configurazioni Google esistenti, Gmail e calendario con l'origine definitiva. Controllare consenso OAuth, stato del progetto e durata dei token; non chiedere credenziali in chat.
4. Completare informative, conservazione, dati titolare, IBAN e condizioni; aggiornare i testi pregressi e implementare blog/Messenger/video approvati.
5. Provare accessi, quote/incasso, PDF/scanner, invii reali, prenotazioni/disdette, restore, carico e dispositivi/PWA.
6. Solo dopo esito positivo: HTTPS/DNS, controllo finale sul dominio e apertura al pubblico. Centralino e automazioni social/WhatsApp come fase separata con preventivo a consumo.

## Fonti consultate

- Netcup, configurazione e condizioni: https://www.netcup.com/en/server/vps/vps-lite-2-g12.5s-iv-3m
- Hetzner BX11: https://www.hetzner.com/storage/storage-box/bx11/
- OVH, configuratore e backup: https://www.ovhcloud.com/it/vps/configurator/ e https://www.ovhcloud.com/it/vps/vps-backup/
- Aruba VPS e backup: https://www.cloud.it/vps/ e https://www.cloud.it/backup/
- Aruba domini/email: https://www.aruba.it/listino-domini.aspx e https://hosting.aruba.it/email/
- Google quote e prezzi Calendar: https://developers.google.com/workspace/calendar/api/guides/quota
- Let's Encrypt: https://letsencrypt.org/getting-started/
