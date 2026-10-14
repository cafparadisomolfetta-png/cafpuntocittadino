'use strict';
const crypto=require('node:crypto');
const FEEDS=[{id:'inps-news',name:'INPS',url:'https://www.inps.it/it/it.rss.news.xml',host:'www.inps.it'},{id:'inail-news',name:'INAIL',url:'https://www.inail.it/portale/it.rss.news.xml',host:'www.inail.it'}];
function decode(value){return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,code)=>{if(code[0]==='#'){const n=code[1].toLowerCase()==='x'?parseInt(code.slice(2),16):Number(code.slice(1));return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):'';}return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[code.toLowerCase()];});}
// Deliberately small RSS subset. No DTD, entities, network resolution or HTML DOM.
function parse(xml,source,now){
 if(typeof xml!=='string'||Buffer.byteLength(xml)>524288||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('INVALID_FEED');
 const root={name:'root',children:[],text:''},stack=[root];let nodes=0,position=0;
 const tokens=/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<[^>]*>|[^<]+/g;
 for(const match of xml.matchAll(tokens)){
  if(match.index!==position)throw Error('INVALID_FEED');position+=match[0].length;const part=match[0],current=stack.at(-1);
  if(part.startsWith('<!--')||part.startsWith('<?'))continue;
  if(part.startsWith('<![CDATA[')){current.text+=part.slice(9,-3);continue;}
  if(part.startsWith('</')){const name=part.match(/^<\/([\w:.-]+)\s*>$/)?.[1];if(stack.length<2||current.name!==name)throw Error('INVALID_FEED');stack.pop();continue;}
  if(part.startsWith('<')){
   const name=part.match(/^<([\w:.-]+)(?:\s|\/?>)/)?.[1];if(!name||++nodes>5000||stack.length>32)throw Error('INVALID_FEED');
   const node={name,children:[],text:''};current.children.push(node);if(!part.endsWith('/>'))stack.push(node);
  }else current.text+=part;
 }
 if(position!==xml.length||stack.length!==1||root.text.trim()||root.children.length!==1||root.children[0].name!=='rss')throw Error('INVALID_FEED');
 const channels=root.children[0].children.filter(n=>n.name==='channel');if(channels.length!==1)throw Error('INVALID_FEED');
 const result=[],seen=new Set();
 for(const item of channels[0].children.filter(n=>n.name==='item')){
  const field=name=>{const matches=item.children.filter(n=>n.name===name);return matches.length===1&&!matches[0].children.length?decode(matches[0].text).trim():'';};
  const rawDate=field('pubDate')||field('pubdate');
  const dateOnly=rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const isoDate=dateOnly?dateOnly[3]+'-'+dateOnly[2]+'-'+dateOnly[1]:null;
  let date=Date.parse(isoDate?isoDate+'T00:00:00Z':rawDate);
  if(isoDate&&(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==isoDate))date=NaN;
  const title=field('title').replace(/<[^>]*>/g,' ').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim();
  let url;try{url=new URL(field('link'))}catch{continue;}
  if(!title||title.length>240||!Number.isFinite(date)||date>now||now-date>30*86400000||url.protocol!=='https:'||url.hostname!==source.host||url.port||url.username||url.password||url.pathname==='/')continue;
  url.hash='';if(seen.has(url.href))continue;seen.add(url.href);
  result.push({id:crypto.createHash('sha256').update(url.href).digest('hex'),source:source.name,source_url:url.href,title,published_at:new Date(date).toISOString()});
 }
 return result.sort((a,b)=>b.published_at.localeCompare(a.published_at)).slice(0,20);
}
async function collectHeadlines({fetcher=fetch,clock=()=>Date.now()}={}){
 const results=[];
 for(const source of FEEDS){try{
  const r=await fetcher(source.url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{Accept:'application/rss+xml, application/xml, text/xml'}});
  if(!r.ok||r.url&&r.url!==source.url)throw Error('FEED_UNAVAILABLE');
  let text='';if(r.body?.getReader){const reader=r.body.getReader(),chunks=[];let size=0;for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>524288){await reader.cancel();throw Error('FEED_TOO_LARGE');}chunks.push(Buffer.from(part.value));}text=Buffer.concat(chunks).toString('utf8');}else text=await r.text();
  results.push({id:source.id,source:source.name,url:source.url,ok:true,checked_at:new Date(clock()).toISOString(),items:parse(text,source,clock())});
 }catch{results.push({id:source.id,source:source.name,url:source.url,ok:false,checked_at:new Date(clock()).toISOString(),items:[]});}}
 return results;
}
module.exports={FEEDS,parse,collectHeadlines};
