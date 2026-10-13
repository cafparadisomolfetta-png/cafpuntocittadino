# CAF Punto Cittadino — costi e condizioni di avvio

Verifica dei listini pubblici: 13 ottobre 2026. Stima di pianificazione, non preventivo vincolante né autorizzazione all'acquisto. Nessun prodotto attivato o acquistato. Il divieto di spesa, la sospensione Netlify e il blocco pubblicazione restano validi. La disponibilità e l'importo finale vanno verificati nel riepilogo ordine prima di qualsiasi attivazione.

## Aggiornamento dopo il configuratore reale

L'utente ha successivamente autorizzato **massimo 15 €/mese complessivi per server e backup**, mantenendo AI e Netlify disattivati. È stato preparato un riepilogo, ma non è stato premuto il pulsante di pagamento, creato un account o attivata una risorsa.

- Il prezzo pubblico VPS-2 di 8,80 €/mese IVA inclusa corrisponde a impegno e pagamento anticipato per 12 mesi: 86,52 € + IVA/12 mesi nel configuratore. Non è un canone mensile senza impegno. Senza impegno annuale, VPS-2 mostra 8,49 € + IVA/mese (circa 10,36 € con IVA 22%).
- Al momento della verifica, il configuratore VPS-2 mostra disponibile solo Regno Unito/Erith; le sedi UE elencate sono esaurite. Non è stato ordinato un server fuori dall'UE.
- È stata preparata un'alternativa nello stesso fornitore: **VPS-1, Germania/Limburg, Debian 13, 2 vCore, 4 GB RAM, 40 GB NVMe, durata 1 mese**, nessuna opzione aggiuntiva a pagamento. Riepilogo: **4,49 € + 0,99 € IVA = 5,48 €/mese**; backup standard incluso nella promozione mostrata. Prezzo/durata della promozione e rinnovo restano da leggere prima di accettare il contratto.
- Con backup separato indicativo 3,90 €/mese, l'alternativa sarebbe circa **9,38 €/mese**, entro il tetto di 15 €. Il backup separato non è stato ancora configurato nel relativo ordine: non è un totale finale fatturato.
- Questo piano ha meno RAM del dimensionamento iniziale da 8 GB. È proposto per l'avvio del collaudo, con verifica reale di scanner, concorrenza, memoria e spazio prima dell'uso operativo. Non si dichiara adeguato alla produzione senza quelle prove; la variazione di configurazione viene sottoposta all'utente prima di acquistare.

Le tabelle che seguono conservano la stima iniziale da listino per rendere esplicite le ipotesi. Il riepilogo reale e le condizioni contrattuali prevalgono sulla stima, che non autorizza impegni annuali, costi iniziali imprevisti o una diversa regione dei dati.

## Proposta economica per un avvio piccolo

Un solo server Linux per sito pubblico, runtime Node privato, scanner e archivio; un ambiente persistente distinto per i backup cifrati. La RAM da 8 GB è un'ipotesi iniziale prudente per applicazione e ClamAV, non una capacità certificata: scanner, carico, tempi di risposta e spazio PDF devono essere provati. Non è necessario comprare un secondo dominio o una seconda applicazione per distinguere Molfetta/Bari: il codice già separa gli accessi per sede.

| Voce | Riferimento di listino | Stima di cassa usata nel budget |
| --- | --- | --- |
| Server VPS | OVHcloud VPS-2: da 7,21 €/mese + IVA, 8,80 € IVA inclusa; 4 vCore, 8 GB RAM, 75 GB NVMe e backup delle 24 ore precedenti | 8,80 €/mese, solo se l'offerta finale mantiene questo prezzo e condizioni |
| Backup separato cifrato | Hetzner Storage Box BX11: 1 TB, indicazione ufficiale indicizzata 3,20 €/mese IVA esclusa | Circa 3,90 €/mese assumendo IVA 22%; da confermare nel carrello (la pagina prodotto dinamica non ha esposto il prezzo nell'apertura testuale) |
| Dominio .it già registrato | Register.it listino annuale: rinnovo fascia A 58,55 € + IVA; fascia B 50,55 € + IVA | Accantonamento prudente 71,43 €/anno con IVA 22%; prezzo effettivo del contratto da verificare nel pannello |
| AI testuale | Consumo API variabile, modello da scegliere e collaudare | Riserva facoltativa 5–10 €/mese; non un abbonamento né un costo fisso o un tetto tecnico già garantito |
| Certificato HTTPS | Let's Encrypt emette certificati TLS gratuiti | Nessuna licenza di certificato prevista; configurazione e rinnovo vanno mantenuti |
| Antivirus | ClamAV open source GPL | Nessuna licenza commerciale ClamAV prevista; configurazione, firme e gestione non sono lavoro gratuito garantito |
| Google Calendar | Uso standard dell'API senza costo aggiuntivo, entro limiti del provider | Nessun nuovo canone API previsto nello scenario piccolo; quote/modifiche di prezzo e account effettivo da verificare |
| PWA | Frontend già nel repository, installazione via browser | Nessuna pubblicazione in App Store/Google Play prevista nello scope corrente |

L'IVA al 22% è un'ipotesi prudente per i calcoli dei prezzi netti, non una determinazione del trattamento fiscale della specifica associazione. L'IVA OVH di 8,80 € è quella direttamente mostrata dal listino italiano. Il dominio risulta nelle schermate dell'utente con scadenza 14/06/2027: non occorre acquistarlo nuovamente oggi, ma accantonare il rinnovo evita di ometterlo dal costo annuo.

### Totali di pianificazione

Usando 8,80 €/mese per VPS, 3,90 €/mese arrotondati per backup e 71,43 €/anno per rinnovo dominio:

| Scenario | Costi mensili dei servizi + dominio distribuito su 12 mesi | Totale annuo |
| --- | --- | --- |
| Infrastruttura, dominio accantonato, AI spenta | Circa 18,65 € | Circa 223,83 € |
| Stesso assetto e riserva AI 5 €/mese | Circa 23,65 € | Circa 283,83 € |
| Stesso assetto e riserva AI 10 €/mese | Circa 28,65 € | Circa 343,83 € |

**Budget orientativo: 20–30 €/mese per i servizi online di base, con uso contenuto. Non è il costo complessivo garantito del progetto.** Il primo periodo può non avere una nuova fattura dominio; l'accantonamento ne considera il costo futuro. Non si assume uno sconto annuale né una specifica durata contrattuale non verificata.

## Altre spese che il totale non include

- Assistenza sistemistica: configurazione del server, aggiornamenti, monitoraggio, incidenti e prove periodiche di ripristino. Il prezzo di un VPS non include automaticamente un tecnico che gestisce l'applicazione. Occorre un referente competente o un preventivo di servizio gestito; nessun costo viene inventato o impegnato qui.
- Revisione privacy, accordi con i fornitori, policy e controlli indipendenti di sicurezza/accessibilità: da concordare con il professionista o la struttura già incaricata. Non si dichiara inclusa una certificazione GDPR.
- PEC/email professionali: eventuali rinnovi di prodotti già acquistati o attivati. Un ordine bonus PEC non prova il futuro prezzo applicato né che il servizio sia ora attivo. Il listino Register.it PEC Unica 3 GB è 68,60 € + IVA/anno (83,69 € ipotizzando IVA 22%); verificare contratto e rinnovi senza modificare impostazioni.
- Abbonamento ChatGPT già in uso e suoi limiti: separato dai servizi del sito. Le API OpenAI sono fatturate separatamente dall'abbonamento ChatGPT; questa ricerca non ha verificato o modificato il piano dell'utente.
- Eventuali crescita dei PDF, volumi aggiuntivi, traffico fuori quota, SMTP dedicato, SMS/WhatsApp, voce/telefonia, firma elettronica, SPID/CIE o licenze di gestionali terzi: non attivati e non compresi nella stima. La segretaria implementata è testuale; una segreteria telefonica è un altro servizio con altri costi.

Non occorre acquistare come parte di questa proposta WordPress, un site builder, pacchetti marketing, nuovi domini, app store o certificati TLS commerciali. Un banner cookie o un pacchetto privacy commerciale da solo non risolve l'adeguatezza del sistema ai dati reali.

## AI: esempio di consumo, non scelta già effettuata

Il modello corrente GPT-6 Luna indica tariffa Standard per 1 milione di token: input 0,10 USD, output 0,50 USD. Ipotesi di 1.000 richieste mensili da 2.000 token input e 500 token output **fatturati** ciascuna: 2 milioni × 0,10 + 0,5 milioni × 0,50 = **0,45 USD**, prima di tasse, cambio, eventuali cache write, maggiorazioni e strumenti aggiuntivi. A 10.000 richieste con gli stessi token: 4,50 USD. È solo un calcolo di listino: il consumo reale include storia/prompt e token di ragionamento dove applicabili; non è stato eseguito un collaudo reale di questo modello.

Il cap del runtime attuale conta richieste, non euro. Non si promette quindi che una riserva 5/10 € sia un limite monetario automatico. Serve scegliere un modello realmente disponibile, testare qualità/compatibilità, misurare il consumo e predisporre controlli economici prima di abilitare l'AI. Entrambe le flag AI restano spente e non è stata utilizzata la chiave presente per nome su Netlify.

## Alternativa verificata, non acquistata

Hetzner CX23: listino europeo aggiornato 5,49 €/mese IVA/IPv4 esclusi, 4 GB RAM/40 GB; CX33 8,49 €/mese IVA/IPv4 esclusi, 8 GB/80 GB. La pagina prodotto aperta mostra questi modelli non disponibili, perciò non sono una soluzione immediatamente ordinabile verificata. I backup di istanza Hetzner costano il 20% del server e l'IPv4 è separato. Non usare vecchi prezzi promozionali come preventivo attuale. Le copie di sistema del VPS non sostituiscono backup applicativi cifrati con chiave conservata separatamente e ripristino provato.

## Prossime azioni

1. Preparare e revisionare la configurazione dell'ambiente scelto, conservando tutte le integrazioni a pagamento disattivate.
2. Prima di creare risorse o acquistare: mostrare il riepilogo reale con fornitore, regione UE, importo IVA/oneri, periodo di pagamento, rinnovo, backup e limiti; ottenere l'autorizzazione specifica alla spesa. I termini contrattuali richiedono il passaggio previsto dal servizio.
3. Configurare privatamente credenziali e policy solo dopo disponibilità/accesso all'ambiente; poi eseguire le prove di [COLLAUDO-OPERATIVO.md](COLLAUDO-OPERATIVO.md).
4. Lasciare la prova locale Windows per l'ultimo passaggio locale richiesto dall'utente; essa non sostituisce il server online.
5. Pubblicare solo i moduli con esito positivo. Nessuna riattivazione Netlify o modifica DNS è autorizzata dalla sola richiesta di conoscere i prezzi.

## Fonti primarie consultate

- [OVHcloud VPS, listino Italia](https://www.ovhcloud.com/it/vps/)
- [Hetzner Storage Box, listino indicizzato](https://www.hetzner.com/storage/storage-box/) e [BX11, caratteristiche](https://www.hetzner.com/storage/storage-box/bx11/)
- [Register.it, listino dominio e PEC](https://www.register.it/company/listino-prezzi/)
- [OpenAI GPT-6 Luna, prezzi e modalità](https://developers.openai.com/api/docs/models/gpt-6-luna)
- [OpenAI, fatturazione ChatGPT/API separata](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform)
- [Google Calendar API, pricing e quote](https://developers.google.com/workspace/calendar/api/guides/quota)
- [Let's Encrypt](https://letsencrypt.org/it/)
- [ClamAV](https://www.clamav.net/about.html)
- [Hetzner, prezzi europei aggiornati](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [disponibilità cost-optimized](https://www.hetzner.com/cloud/cost-optimized/) e [backup/IP/billing](https://docs.hetzner.com/cloud/billing/faq/)
