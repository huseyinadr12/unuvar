(()=>{'use strict';
  const $=s=>document.querySelector(s);
  const menu=$('#mobile-nav'), trigger=$('.menu-trigger');
  function closeMenu(){if(!menu)return;menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Menüyü aç');document.body.classList.remove('menu-open');}
  trigger?.addEventListener('click',()=>{const opening=menu.hidden;menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));trigger.setAttribute('aria-label',opening?'Menüyü kapat':'Menüyü aç');document.body.classList.toggle('menu-open',opening);});
  menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && menu && !menu.hidden){closeMenu();trigger.focus();}});
  window.matchMedia('(min-width:901px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
  let toastTimer;
  function notify(message){const toast=$('.toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),3500);}
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);notify('Kopyalandı.');}catch{notify('Kopyalanamadı. Bilgiyi seçerek kopyalayabilirsiniz.');}}));
})();
