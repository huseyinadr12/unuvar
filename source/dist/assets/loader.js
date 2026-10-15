(()=>{
  'use strict';const boot=window.UnuvarBoot,overlay=document.querySelector('#site-loader');
  if(!boot||boot.closed||!overlay)return;
  const bar=overlay.querySelector('[role="progressbar"]'),number=overlay.querySelector('[data-load-number]'),status=overlay.querySelector('[data-load-status]');
  document.querySelectorAll('.site-header,main,.site-footer,.mobile-contact,.back-to-top').forEach(el=>{if(!el.inert){el.inert=true;el.setAttribute('data-loader-inert','');}});
  overlay.querySelector('[data-load-skip]').addEventListener('click',()=>boot.close('skipped'));
  addEventListener('pageshow',event=>{if(event.persisted)boot.close('restored');});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)boot.close('reduced-motion');});
  const images=[...document.querySelectorAll('.site-header img,main img:not([loading="lazy"])')];
  const intro=1780; // Plus the 220 ms fade: a two-second first visit.
  let completed=1,target=0,displayed=0,frame=0,failed=false;
  const total=images.length+2;
  function paint(){if(boot.closed)return;const elapsed=Math.min(100,Math.floor((performance.now()-boot.started)/intro*100));displayed=Math.min(target,elapsed,displayed+Math.max(1,Math.ceil((target-displayed)/5)));number.textContent=displayed+'%';bar.setAttribute('aria-valuenow',String(displayed));bar.style.setProperty('--load',displayed/100);if(displayed<target)frame=requestAnimationFrame(paint);else frame=0;}
  function progress(){target=Math.round(completed/total*100);if(!frame)frame=requestAnimationFrame(paint);}
  function track(promise){return Promise.resolve(promise).catch(()=>{failed=true;}).finally(()=>{completed++;progress();});}
  progress();
  const tasks=images.map(img=>track(img.decode?img.decode():new Promise((resolve,reject)=>{if(img.complete)return img.naturalWidth?resolve():reject();img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true});})));
  tasks.push(track(document.fonts?document.fonts.ready:Promise.resolve()));
  Promise.all(tasks).then(()=>{if(boot.closed)return;status.textContent='Açılıyor.';
    // Never outrun settled first-view assets; pace fast cached loads over the intro.
    const remaining=Math.max(0,intro-(performance.now()-boot.started));
    setTimeout(()=>{if(boot.closed)return;cancelAnimationFrame(frame);number.textContent='100%';status.textContent=failed?'Sayfa açılıyor.':'Hazır.';bar.setAttribute('aria-valuenow','100');bar.style.setProperty('--load',1);overlay.classList.add('is-complete');setTimeout(()=>boot.close(failed?'partial':'ready'),220);},remaining);
  });
})();
