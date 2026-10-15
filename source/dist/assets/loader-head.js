/* Small, independent fail-safe: no script or slow resources can trap the page. */
(()=>{const root=document.documentElement;
  try{if(sessionStorage.getItem('unuvar-visited')==='1')return;}catch{}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const boot=window.UnuvarBoot={started:performance.now(),closed:false};
  boot.close=(reason='ready')=>{if(boot.closed)return;boot.closed=true;clearTimeout(boot.timer);
    const overlay=document.querySelector('#site-loader'),restoreFocus=overlay?.contains(document.activeElement);
    root.classList.remove('is-loading');root.dataset.loadingResult=reason;
    root.dataset.loadingDuration=String(Math.round(performance.now()-boot.started));
    document.querySelectorAll('[data-loader-inert]').forEach(el=>{el.inert=false;el.removeAttribute('data-loader-inert');});
    if(overlay){overlay.hidden=true;overlay.setAttribute('aria-hidden','true');}
    try{sessionStorage.setItem('unuvar-visited','1');}catch{}
    if(restoreFocus)document.querySelector('.logo-link')?.focus({preventScroll:true});
  };
  root.classList.add('is-loading');boot.timer=setTimeout(()=>boot.close('timeout'),4500);
})();
