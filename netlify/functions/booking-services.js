'use strict';
// Appointment reasons, not additional document workflows or benefit eligibility.
const groups=[
 {label:'CAF e fiscale',category:'CAF / Fiscale',services:[
  'Dichiarazione dei redditi (730 o Unico PF)','ISEE / DSU (ordinario, corrente, universitario)',
  'IMU e modello F24','Successioni e volture catastali','Contratti di affitto (registrazione, proroga, risoluzione)',
  'RED e dichiarazioni di responsabilità INPS','Comunicazioni e cartelle fiscali (primo esame)']},
 {label:'Patronato / INPS',category:'Patronato / Previdenziale',services:[
  'Pensioni (domanda e consulenza)','Contributi e simulazione pensionistica','Pensione di reversibilità',
  'NASpI / DIS-COLL e disoccupazione agricola','Invalidità civile, accompagnamento e Legge 104',
  'Assegno ordinario di invalidità / pensione di inabilità','Maternità e congedi','Altre pratiche INPS']},
 {label:'Patronato / INAIL',category:'Patronato / INAIL',services:[
  'INAIL: infortunio sul lavoro','INAIL: malattia professionale','INAIL: aggravamento e revisione delle prestazioni','Altre pratiche INAIL']},
 {label:'Famiglia, bonus e agevolazioni',category:'Famiglia / Agevolazioni',services:[
  'Assegno unico','Assegno di inclusione e sostegno al reddito','Bonus nido e contributi per la famiglia',
  'Bonus sociali e agevolazioni sulle utenze','Libri di testo, scuola e agevolazioni comunali']},
 {label:'Lavoro e altri servizi',category:'Lavoro / Sindacale',services:[
  'Buste paga, TFR e verifica del rapporto di lavoro','Dimissioni telematiche','Colf e badanti']},
 {label:'Orientamento',category:'Consulenza / Altro',services:[
  'Consulenza generale','Altro / Non so quale servizio scegliere / Non trovo il servizio']},
 {label:'Associazione',category:'Tesseramento associativo',services:['Tesseramento']}
];
const categories=new Map(groups.flatMap(group=>group.services.map(service=>[service,group.category])));
function categoryFor(service){return categories.get(service)||null;}
module.exports={groups,categoryFor};
