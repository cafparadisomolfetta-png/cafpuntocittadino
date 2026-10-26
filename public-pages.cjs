'use strict';
// Keep each public category separate; service dossiers have their own URLs.
const categories={
 'caf.html':['isee','modello730','successioni','locazioni','imu','f24','agenzia-entrate','ader-riscossione'],
 'patronato.html':['assegno-unico','naspi','adi','sfl','pensioni','inail','bonus-nido','assegno-sociale','disoccupazione-agricola','dis-coll','assegno-vedovanza','maternita','carta-acquisti','carta-dedicata','congedo-parentale-2026','invalidita-civile'],
 'lavoro-sindacato.html':['centro-impiego-lavoro','dimissioni','vertenze','lavoro-domestico'],
 'area-aziende.html':['area-aziende','azienda-conciliazioni','azienda-lavoro','azienda-domestico','azienda-buste','azienda-previdenza','azienda-sindacale','azienda-tirocini','azienda-consulenza'],
 'news-bonus.html':['centro-aggiornamenti','bonus-locali','bonus-energia','bonus-mamme-2026','bonus-nuovi-nati-2026','puglia-disabilita-famiglie','comuni-bari-agevolazioni','bat-agevolazioni','piano-casa-bonus-governo','bonus-dinamici','aggiornamenti-automatici'],
 'servizi-online.html':['immigrazione-pratiche','immigrazione-aggiornamenti','pugliasalute-asl','punto-send','energia-sharing'],
 'lavora-con-noi.html':[],'index.html':[]
};
const extras={'servizi-online.html':['scopri','prenotazione-online','consulenza-20','contatti','tesseramento-associazione','condizioni-consulenza','aiSecretaryPanel'],'lavora-con-noi.html':['lavora-con-noi']};
const escape=s=>s.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sections(html){
 const token=/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<\/?section\b[^>]*>/gi,stack=[],out=[];let m;
 while((m=token.exec(html))){if(!/^<\/?section\b/i.test(m[0]))continue;if(/^<\//.test(m[0])){const start=stack.pop();if(!start)throw Error('Unbalanced public sections');if(!stack.length)out.push({...start,end:token.lastIndex,html:html.slice(start.start,token.lastIndex)});}else stack.push({start:m.index,tag:m[0],id:m[0].match(/\bid="([^"]+)"/)?.[1]||''});}
 if(stack.length)throw Error('Unclosed public sections');return out;
}
function title(row){return (row.html.match(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i)?.[1]||row.id).replace(/<[^>]*>/g,'').trim();}
function routeMap(){const out={};for(const [page,ids] of Object.entries(categories))for(const id of ids)out[id]='/schede/'+id+'.html';for(const [page,ids] of Object.entries(extras))for(const id of ids)out[id]='/'+page+'#'+id;Object.assign(out,{'privacy-policy':'/privacy.html','cookie-policy':'/cookie-policy.html','richiamami':'/assistiti/?richiamata=1','invio-documenti':'/assistiti/','stato-pratica':'/assistiti/','servizi-digitali':'/servizi-online.html#cafpc-servizi','catalogo':'/servizi-online.html#scopri','lavora-con-noi':'/lavora-con-noi.html','form-candidatura':'/candidature/','chi-siamo':'/#cafpc-about-title','tariffe':'/servizi-online.html#consulenza-20','servizi-fotografici':'/#cafpc-home-services'});return out;}
function separatePage(html,file,detail=null){
 if(!categories[file])return {html,details:[]};
 const rows=sections(html),ids=categories[file],details=rows.filter(r=>ids.includes(r.id)),keep=new Set(detail?[detail]:(extras[file]||[]));
 let result=html;
 for(const row of [...rows].reverse()){
  const generated=/\bclass="[^"]*cafpc-/.test(row.tag);
  const retained=detail?row.id===detail:generated||keep.has(row.id);
  if(!retained)result=result.slice(0,row.start)+result.slice(row.end);
 }
 // Remove the duplicated legacy menus and section heading outside the dossiers.
 result=result.replace(/<nav\b[^>]*class="(?:main-nav|schedario)"[^>]*>[\s\S]*?<\/nav>/gi,'').replace(/<div\b[^>]*id="servizi"[^>]*>[\s\S]*?<\/div>/gi,'');
 if(detail){
  const row=details.find(r=>r.id===detail);if(!row)throw Error('Missing dossier '+detail);
  const heading='<section class="cafpc-services-showcase"><p><a href="/'+file+'">← Torna alla categoria</a></p><h1>'+title(row)+'</h1><p><a href="/servizi-online.html#prenotazione-online">Appuntamenti</a> · <a href="/assistiti/">Area assistiti</a></p></section>';
  result=result.replace(/(<\/nav>)/i,'$1'+heading);
  result=result.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+title(row)+' — Punto Cittadino Italia</title>');
 }else if(details.length){
  const catalog='<section class="cafpc-services-showcase" id="cafpc-servizi"><h2>Scegli il servizio</h2><div class="cafpc-home-grid">'+details.map(row=>'<a class="cafpc-home-card" href="/schede/'+row.id+'.html"><strong>'+title(row)+'</strong><span>Apri la scheda →</span></a>').join('')+'</div></section>';
  const hero=sections(result).find(row=>/cafpc-design-hero/.test(row.tag));
  if(!hero)throw Error('Category hero missing');
  result=result.slice(0,hero.end)+catalog+result.slice(hero.end);
 }else if(!result.includes('id="cafpc-servizi"'))result=result.replace(/(<section\b[^>]*class="cafpc-design-hero)/,'<span id="cafpc-servizi"></span>$1');
 // Inline legacy controllers target forms which belong only on Services online.
 if(file!=='servizi-online.html'||detail)result=result.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi,(all,attrs)=>/\bsrc=|application\/json/.test(attrs)?all:'');
 const visible=detail?[detail]:(extras[file]||[]).filter(id=>id!=='aiSecretaryPanel');
 result=result.replace('</head>','<style>'+visible.map(id=>'body[data-cafpc-design=public] #'+id+'{display:block!important}').join('')+'body[data-cafpc-design=public] .fade-in{opacity:1;transform:none}body[data-cafpc-design=public] [id$=\"-page-menu\"],body[data-cafpc-design=public] #come-funziona{display:none!important}</style></head>');
 const routes=routeMap();
 result=result.replace(/href="([^"#]*)(#[^"]+)"/g,(all,base,hash)=>{
  const id=hash.slice(1);if(detail&&id===detail&&!base)return all;
  if(routes[id])return 'href="'+escape(routes[id])+'"';return all;
 });
 result=result.replace(/<a\b([^>]*)href="\/lavoro-sindacato.html"([^>]*)>([\s\S]*?)<\/a>/g,(all,a,b,label)=>/Lavora con noi/i.test(label)?'<a'+a+'href="/lavora-con-noi.html"'+b+'>'+label+'</a>':all);
 return {html:result,details};
}
module.exports={categories,separatePage,sections};
