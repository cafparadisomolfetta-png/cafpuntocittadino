'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parse,collectHeadlines,FEEDS}=require('../server/headlines.cjs');
const now=Date.parse('2026-10-14T12:00:00Z'),source=FEEDS[0];
const item=(title='Titolo &amp; aggiornamento',url='https://www.inps.it/it/it/notizia.html',date='Wed, 14 Oct 2026 09:00:00 GMT')=>'<item><title>'+title+'</title><link>'+url+'</link><pubDate>'+date+'</pubDate></item>';
const feed=items=>'<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title>'+items+'</channel></rss>';
test('RSS titles and links are minimal, dated, decoded and deduplicated',()=>{
 const rows=parse(feed(item()+item()),source,now);assert.equal(rows.length,1);assert.equal(rows[0].title,'Titolo & aggiornamento');const official=feed(item('Titolo ufficiale',undefined,'14/10/2026').replaceAll('pubDate','pubdate'));assert.equal(parse(official,source,now)[0].published_at,'2026-10-14T00:00:00.000Z');assert.equal(parse(feed(item('Data errata',undefined,'31/02/2026').replaceAll('pubDate','pubdate')),source,now).length,0);assert.deepEqual(Object.keys(rows[0]).sort(),['id','published_at','source','source_url','title']);
});
test('RSS rejects external, insecure, credential-bearing and undated or stale entries',()=>{
 for(const url of ['javascript:alert(1)','https://www.inps.it.attacker.invalid/a','https://user:secret@www.inps.it/a','http://www.inps.it/a','https://www.inps.it:8443/a'])assert.equal(parse(feed(item('Test',url)),source,now).length,0);
 for(const date of ['bad','Wed, 14 Oct 2027 09:00:00 GMT','Mon, 01 Jun 2026 09:00:00 GMT'])assert.equal(parse(feed(item('Test',undefined,date)),source,now).length,0);
});
test('RSS refuses DTD, entities, malformed XML, deep or oversized input',()=>{
 for(const xml of ['<!DOCTYPE rss [<!ENTITY secret SYSTEM "file:///etc/passwd">]>'+feed(item()),'<rss><channel></rss>','<html>Unavailable</html>','x'+feed(item()),'<rss><channel>'+ '<nested>'.repeat(40)+'x'+'</nested>'.repeat(40)+'</channel></rss>','x'.repeat(524289)])assert.throws(()=>parse(xml,source,now));
 assert.equal(parse(feed(item('<![CDATA[<b>Titolo</b>]]>')),source,now)[0].title,'Titolo');
});
test('Feed transport is bounded and refuses redirects without retaining raw errors',async()=>{
 const results=await collectHeadlines({clock:()=>now,fetcher:async(url,options)=>{assert.equal(options.redirect,'error');return {ok:true,url,text:async()=>feed(item('Test',url.includes('inail')?'https://www.inail.it/portale/it/notizia.html':undefined))};}});
 assert.equal(results.filter(r=>r.ok).length,2);assert.ok(results.every(r=>r.items.length===1));
 const failed=await collectHeadlines({clock:()=>now,fetcher:async()=>{throw Error('do not expose')}});assert.ok(failed.every(r=>!r.ok&&r.items.length===0&&!JSON.stringify(r).includes('do not expose')));
 const redirected=await collectHeadlines({clock:()=>now,fetcher:async()=>({ok:true,url:'https://attacker.invalid/',text:async()=>feed(item())})});assert.ok(redirected.every(r=>!r.ok));
});
