'use strict';
// Navigation reflects the existing UI's permissions; it never grants API access.
(()=>{
 const nav=document.querySelector('.cafpc-app-nav');if(!nav)return;
 const links=[...nav.querySelectorAll('[data-section]')];
 function sync(){for(const link of links){const target=document.getElementById(link.dataset.section);const hidden=!target||!!target.closest('[hidden]');if(link.hidden!==hidden)link.hidden=hidden;}}
 sync();
 const observer=new MutationObserver(sync);
 const main=document.querySelector('main');if(main)observer.observe(main,{attributes:true,subtree:true,attributeFilter:['hidden']});
})();
