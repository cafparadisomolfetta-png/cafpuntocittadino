document.addEventListener('DOMContentLoaded',()=>{
 const toggle=document.querySelector('.menu-toggle');
 const nav=document.querySelector('.main-nav');
 if(toggle&&nav) toggle.addEventListener('click',()=>nav.classList.toggle('open'));
 const launcher=document.getElementById('aiLauncher'), panel=document.getElementById('aiPanel'), close=document.getElementById('aiClose');
 const body=document.getElementById('aiBody'), form=document.getElementById('aiForm'), input=document.getElementById('aiInput'), send=document.getElementById('aiSend');
 if(!launcher||!panel||!form) return;
 launcher.onclick=()=>panel.classList.toggle('open');
 close.onclick=()=>panel.classList.remove('open');
 let history=[];
 function add(text,kind){const d=document.createElement('div');d.className='ai-msg '+kind;d.textContent=text;body.appendChild(d);body.scrollTop=body.scrollHeight;return d}
 form.addEventListener('submit',async e=>{
  e.preventDefault(); const text=(input.value||'').trim(); if(!text||send.disabled)return;
  add(text,'user'); history.push({role:'user',content:text}); input.value=''; send.disabled=true; const wait=add('Sto verificando la richiesta…','bot');
  try{
   const r=await fetch('/.netlify/functions/segretaria-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:history.slice(-8)})});
   const x=await r.json().catch(()=>({})); wait.remove();
   if(!r.ok) throw new Error(x.error||'Servizio momentaneamente non disponibile.');
   const answer=(x.answer||'').trim(); add(answer,'bot'); history.push({role:'assistant',content:answer}); history=history.slice(-8);
  }catch(err){wait.remove();add(err.message||'Segretaria AI non disponibile.','error')}
  finally{send.disabled=false}
 });
});