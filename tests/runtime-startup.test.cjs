'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {configuredServer}=require('../server/main.cjs');
test('Private server cannot start accidentally or put documents in source/public directories',()=>{
 assert.throws(()=>configuredServer({}),/privacy/);
 assert.throws(()=>configuredServer({CAF_PRIVACY_REVIEWED:'true'}),/disabled/);
 assert.throws(()=>configuredServer({CAF_PRIVACY_REVIEWED:'true',CAF_PRIVATE_ENABLED:'true',CAF_PRIVATE_DIRECTORY:path.resolve(__dirname,'..','dist','uploads')}),/outside the repository/);
});
