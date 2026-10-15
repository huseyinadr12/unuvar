/* Registered in the head, before the first pagereveal event. Links stay native. */
(()=>{
  const root=document.documentElement;
  addEventListener('pagereveal',event=>{
    root.classList.toggle('has-native-transition',Boolean(event.viewTransition));
    root.dataset.pageTransition=event.viewTransition?'native':'entry';
    // If snapshots are unavailable, the CSS entry animation remains a fallback.
    event.viewTransition?.ready.catch(()=>{
      root.classList.remove('has-native-transition');
      root.dataset.pageTransition='entry';
    });
  });
})();
