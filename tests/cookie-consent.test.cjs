'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const script = fs.readFileSync('cookie-consent.js','utf8');
const build = fs.readFileSync('deploy-build.cjs','utf8');
const policy = fs.readFileSync('cookie-policy.html','utf8');
test('consent controls include equal reject, accept and preference choices', () => {
  for (const label of ['Rifiuta facoltativi','Accetta tutti','Personalizza','Salva preferenze']) assert.ok(script.includes(label),label);
});
test('necessary cookies cannot be disabled', () => {
  assert.match(script,/necessary:\s*true/);
  assert.match(script,/checked disabled/);
});
test('consent is not preset for optional categories', () => {
  assert.match(script,/type="checkbox"> Statistiche facoltative/);
  assert.match(script,/type="checkbox"> Marketing facoltativo/);
});
test('cookie and privacy information link to actual pages', () => {
  assert.ok(script.includes('/cookie-policy.html'));
  assert.ok(script.includes('/privacy.html'));
  assert.ok(policy.includes('Rifiuta facoltativi'));
});
test('build includes consent script on generated pages', () => {
  assert.ok(build.includes('src="/cookie-consent.js"'));
  assert.ok(build.includes("'cookie-consent.js'"));
});
