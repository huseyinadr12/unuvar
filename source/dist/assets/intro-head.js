/* Home only, once per tab session. The overlay leaves by itself through CSS; this is the fail-safe. */
(()=>{const root=document.documentElement;
  try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('unuvar-intro')==='1')return;sessionStorage.setItem('unuvar-intro','1');}catch{return;}
  root.classList.add('intro');
  const done=()=>root.classList.add('intro-done');
  setTimeout(done,2400);
  addEventListener('pointerdown',done,{once:true});addEventListener('keydown',done,{once:true});
})();
