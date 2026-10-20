/* Establish the opening before body paint. Never depend on session "seen" flags. */
(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.dataset.brandIntro = 'pending';
  try {
    const arrival = JSON.parse(sessionStorage.getItem('unuvar-navigation-arrival') || 'null');
    sessionStorage.removeItem('unuvar-navigation-arrival');
    if (arrival?.url === location.href && Date.now() - arrival.time < 10000)
      root.dataset.brandArrival = '1';
  } catch (_) {}
  // Fail open even when the deferred script is unavailable.
  setTimeout(() => { delete root.dataset.brandIntro; }, 2600);
})();
