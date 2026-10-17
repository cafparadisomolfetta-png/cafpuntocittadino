'use strict';
// Shared private intake catalog. Each request remains subject to operator review,
// identification, mandate and any service-specific steps; intake is not official submission.
const catalog=Object.freeze([
 {
  "id": "730",
  "label": "Dichiarazione dei redditi (730 o Unico PF)",
  "category": "CAF / Fiscale"
 },
 {
  "id": "isee",
  "label": "ISEE / DSU (ordinario, corrente, universitario)",
  "category": "CAF / Fiscale"
 },
 {
  "id": "imu",
  "label": "IMU e modello F24",
  "category": "CAF / Fiscale"
 },
 {
  "id": "successioni",
  "label": "Successioni e volture catastali",
  "category": "CAF / Fiscale"
 },
 {
  "id": "locazioni",
  "label": "Contratti di affitto (registrazione, proroga, risoluzione)",
  "category": "CAF / Fiscale"
 },
 {
  "id": "red",
  "label": "RED e dichiarazioni di responsabilità INPS",
  "category": "CAF / Fiscale"
 },
 {
  "id": "cartelle_fiscali",
  "label": "Comunicazioni e cartelle fiscali (primo esame)",
  "category": "CAF / Fiscale"
 },
 {
  "id": "pensioni",
  "label": "Pensioni (domanda e consulenza)",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "contributi",
  "label": "Contributi e simulazione pensionistica",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "reversibilita",
  "label": "Pensione di reversibilità",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "naspi",
  "label": "NASpI / DIS-COLL e disoccupazione agricola",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "invalidita_civile",
  "label": "Invalidità civile, accompagnamento e Legge 104",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "invalidita_previdenziale",
  "label": "Assegno ordinario di invalidità / pensione di inabilità",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "maternita_congedi",
  "label": "Maternità e congedi",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "inps_altro",
  "label": "Altre pratiche INPS",
  "category": "Patronato / Previdenziale"
 },
 {
  "id": "inail_infortunio",
  "label": "INAIL: infortunio sul lavoro",
  "category": "Patronato / INAIL"
 },
 {
  "id": "inail_malattia_professionale",
  "label": "INAIL: malattia professionale",
  "category": "Patronato / INAIL"
 },
 {
  "id": "inail_revisione",
  "label": "INAIL: aggravamento e revisione delle prestazioni",
  "category": "Patronato / INAIL"
 },
 {
  "id": "inail_altro",
  "label": "Altre pratiche INAIL",
  "category": "Patronato / INAIL"
 },
 {
  "id": "assegno_unico",
  "label": "Assegno unico",
  "category": "Famiglia / Agevolazioni"
 },
 {
  "id": "adi",
  "label": "Assegno di inclusione e sostegno al reddito",
  "category": "Famiglia / Agevolazioni"
 },
 {
  "id": "bonus_famiglia",
  "label": "Bonus nido e contributi per la famiglia",
  "category": "Famiglia / Agevolazioni"
 },
 {
  "id": "bonus_sociali",
  "label": "Bonus sociali e agevolazioni sulle utenze",
  "category": "Famiglia / Agevolazioni"
 },
 {
  "id": "scuola",
  "label": "Libri di testo, scuola e agevolazioni comunali",
  "category": "Famiglia / Agevolazioni"
 },
 {
  "id": "lavoro",
  "label": "Buste paga, TFR e verifica del rapporto di lavoro",
  "category": "Lavoro / Sindacale"
 },
 {
  "id": "dimissioni",
  "label": "Dimissioni telematiche",
  "category": "Lavoro / Sindacale"
 },
 {
  "id": "colf_badanti",
  "label": "Colf e badanti",
  "category": "Lavoro / Sindacale"
 },
 {
  "id": "consulenza",
  "label": "Consulenza generale",
  "category": "Consulenza / Altro"
 },
 {
  "id": "altro",
  "label": "Altro / Non so quale servizio scegliere / Non trovo il servizio",
  "category": "Consulenza / Altro"
 },
 {
  "id": "tesseramento",
  "label": "Tesseramento",
  "category": "Tesseramento associativo"
 }
].map(row=>Object.freeze(row)));
const ids=Object.freeze(catalog.map(row=>row.id));
const callback=Object.freeze({id:'richiamata',label:'Richiedi una richiamata',category:'Contatti'});
function enabledServices(env={}){
 const selected=env.CAF_ENABLED_SERVICES_JSON===undefined?['730','isee']:JSON.parse(env.CAF_ENABLED_SERVICES_JSON);
 if(!Array.isArray(selected)||!selected.length||selected.length>ids.length||new Set(selected).size!==selected.length||selected.some(id=>!ids.includes(id)))throw Error('Configure a nonempty unique list of supported private services');
 return [...selected,...(env.CAF_CALLBACK_ENABLED==='true'?['richiamata']:[])];
}
function serviceCatalog(services){return services.map(id=>catalog.find(row=>row.id===id)||(id==='richiamata'?callback:null)).filter(Boolean);}
module.exports={catalog,ids,enabledServices,serviceCatalog};
