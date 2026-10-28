'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync(require('node:path').join(__dirname,'../server/migrations/001_booking_claims.sql'),'utf8');
test('production schema has cross-instance uniqueness for active slot claims',()=>{
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS booking_one_live_claim_per_slot/);
 assert.match(sql,/ON booking_slot_claims \(site, slot_start\)/);
 assert.match(sql,/WHERE state IN \('held', 'confirmed'\)/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS booking_cancellation_audit/);
 assert.match(sql,/CHECK \(site = 'molfetta'\)/);
});
test('migration keeps sensitive document and cancellation codes out of claims',()=>{
 assert.doesNotMatch(sql,/^\s*(?:name|email|phone|cancel_code|codice_disdetta)\s+\w+/mi);
});
