'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {groups,categoryFor}=require('../netlify/functions/booking-services');
const {approvedPublic}=require('../approved-design.cjs');
test('Every booking reason maps to its own area, including INAIL and fiscal INPS declarations',()=>{
 const names=groups.flatMap(group=>group.services);assert.equal(new Set(names).size,names.length);
 for(const group of groups)for(const service of group.services){assert.equal(categoryFor(service),group.category);assert.ok(service.length<=254);}
 assert.equal(categoryFor('INAIL: malattia professionale'),'Patronato / INAIL');
 assert.equal(categoryFor('RED e dichiarazioni di responsabilità INPS'),'CAF / Fiscale');
 assert.equal(categoryFor('Libri di testo, scuola e agevolazioni comunali'),'Famiglia / Agevolazioni');
 assert.equal(categoryFor('Altro / Non so quale servizio scegliere / Non trovo il servizio'),'Consulenza / Altro');
 assert.equal(categoryFor('ISEE'),null); // Historical labels retain the existing handler fallback.
});
test('Build replaces the booking selector without rewriting unrelated selects or prices',()=>{
 const input='<head></head><body><select id="bkServizio" required><option>Altro</option></select><select id="other"><option>Altro</option></select><p>€18</p></body>';
 const output=approvedPublic(input,'privacy.html');
 assert.match(output,/<select id="bkServizio" required>/);assert.match(output,/<optgroup label="Patronato \/ INAIL">/);
 for(const group of groups)for(const service of group.services)assert.ok(output.includes('<option>'+service+'</option>'));
 assert.ok(output.includes('<select id="other"><option>Altro</option></select>'));assert.ok(output.includes('<p>€18</p>'));
});
