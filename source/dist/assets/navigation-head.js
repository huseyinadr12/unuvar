/* Only a fresh visit/reload gets the opening. Internal arrivals never flash it. */
(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const navigationType = performance.getEntriesByType('navigation')[0]?.type;
  let internal = navigationType === 'back_forward';
  try {
    const arrival = JSON.parse(sessionStorage.getItem('unuvar-navigation-arrival') || 'null');
    sessionStorage.removeItem('unuvar-navigation-arrival');
    const age = Date.now() - arrival?.time;
    if (navigationType !== 'reload' && arrival?.url === location.href && age >= 0 && age < 10000)
      internal = true;
  } catch (_) {}
  // Also works when storage is blocked or the destination normalizes its URL.
  try {
    if (navigationType === 'navigate' && document.referrer &&
        new URL(document.referrer).origin === location.origin) internal = true;
  } catch (_) {}
  if (internal) { root.dataset.brandArrival = '1'; return; }
  root.dataset.brandIntro = 'pending';
  // Fail open even when the deferred script is unavailable.
  setTimeout(() => { delete root.dataset.brandIntro; }, 2600);
})();
