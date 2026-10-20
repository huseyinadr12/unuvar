/* Separate fixture opening and single-pass moving-logo navigation. */
(() => {
  'use strict';
  function destination(link, event, current) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.download || link.target && link.target !== '_self' || link.reader) return null;
    let url;
    try { url = new URL(link.href, current); } catch (_) { return null; }
    const here = new URL(current);
    if (!/^https?:$/.test(url.protocol) || url.origin !== here.origin ||
        !(/\/$/.test(url.pathname) || /\.html$/.test(url.pathname))) return null;
    if (url.pathname === here.pathname && url.search === here.search)
      return { kind: url.hash ? 'anchor' : 'same', url };
    return { kind: 'page', url };
  }
  if (typeof module === 'object' && module.exports) { module.exports = { destination }; return; }
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const brand = document.querySelector('[data-brand-transition]');
  const arrival = root.dataset.brandArrival === '1';
  delete root.dataset.brandArrival;
  const duration = (name, fallback) => {
    const value = brand && parseFloat(getComputedStyle(brand).getPropertyValue(name));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  const timing = {
    intro: duration('--brand-intro-duration', 1800),
    travel: duration('--brand-travel-duration', 1800),
    hold: duration('--brand-hold-duration', 180)
  };
  let exitTimer, entryTimer, brandTimer, prefetch, pending = null, revision = 0, visibilityStart = null, navigationStarted = false, finishing = false;
  function hideBrand() {
    if (!brand) return;
    brand.hidden = true;
    delete brand.dataset.phase;
  }
  function cancelTimers() {
    ++revision;
    clearTimeout(exitTimer);
    clearTimeout(entryTimer);
    clearTimeout(brandTimer);
    visibilityStart = null;
  }
  function reset() {
    cancelTimers();
    pending = null;
    navigationStarted = false;
    finishing = false;
    delete root.dataset.brandIntro;
    root.dataset.navMotion = 'idle';
    hideBrand();
  }
  function revealContent() {
    if (brand && !brand.hidden) {
      brand.dataset.phase = 'out';
      brandTimer = setTimeout(hideBrand, 400);
    }
    // Reveal the already stable page. A second 3D/heading entrance looked like a reload.
    root.dataset.navMotion = 'idle';
  }
  function enter(fromNavigation = false) {
    reset();
    if (reduced.matches || fromNavigation) return;
    const ticket = revision;
    if (brand) { brand.hidden = false; brand.dataset.phase = 'waiting'; }
    const begin = () => {
      if (ticket !== revision) return;
      // A background tab must not finish its opening before the visitor sees it.
      if (document.visibilityState === 'hidden') { visibilityStart = begin; return; }
      visibilityStart = null;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (ticket !== revision) return;
        if (!brand) return;
        brand.dataset.phase = 'intro';
        // The bar's animationend normally finishes the opening; this is a fail-open fallback.
        brandTimer = setTimeout(finishOpening, timing.intro + 400);
      }));
    };
    begin();
  }
  function finishOpening() {
    if (brand?.dataset.phase !== 'intro' || finishing) return;
    finishing = true;
    clearTimeout(brandTimer);
    brandTimer = setTimeout(revealContent, timing.hold);
  }
  function finishTravel() {
    if (!pending || finishing || navigationStarted) return;
    finishing = true;
    clearTimeout(exitTimer);
    exitTimer = setTimeout(navigateNow, timing.hold);
  }
  brand?.addEventListener('animationend', event => {
    if (event.animationName === 'brand-progress-fill') finishOpening();
    if (event.animationName === 'brand-travel') finishTravel();
  });
  function warmDestination(url) {
    // Warm only the selected document while the logo travels, never the full PDF.
    if (!document.createElement || !document.head) return;
    prefetch?.remove();
    prefetch = document.createElement('link');
    prefetch.rel = 'prefetch';
    prefetch.as = 'document';
    prefetch.href = url.href.split('#')[0];
    document.head.appendChild(prefetch);
  }
  function navigateNow() {
    if (!pending || navigationStarted) return;
    navigationStarted = true;
    const url = pending;
    clearTimeout(exitTimer);
    try { sessionStorage.setItem('unuvar-navigation-arrival', JSON.stringify({ url, time: Date.now() })); } catch (_) {}
    // Restore the current page if navigation is interrupted or fails.
    entryTimer = setTimeout(reset, 2600);
    location.assign(url);
  }
  function highlight(url) {
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch (_) { return; }
    const section = document.getElementById(id);
    const heading = section?.matches('h1,h2,h3') ? section : section?.querySelector('h1,h2,h3');
    if (!heading || !heading.animate) return;
    const play = () => {
      if (!reduced.matches) heading.animate([
        { opacity: .3, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 700, easing: 'cubic-bezier(.22,.7,.2,1)' });
    };
    const rect = heading.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= innerHeight) { play(); return; }
    if (!('IntersectionObserver' in window)) { play(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); play(); }
    }, { threshold: .5 });
    observer.observe(heading);
    setTimeout(() => observer.disconnect(), 2500);
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || reduced.matches) return;
    const target = destination({
      href: anchor.href, target: anchor.target, download: anchor.hasAttribute('download'),
      reader: anchor.hasAttribute('data-reader-go')
    }, event, location.href);
    if (!target) return;
    // A second click/keyboard activation must not restart or duplicate a trip.
    if (pending) { event.preventDefault(); return; }
    if (target.kind === 'anchor') { highlight(target.url); return; }
    if (target.kind === 'same') { event.preventDefault(); return; }
    event.preventDefault();
    reset();
    pending = target.url.href;
    warmDestination(target.url);
    if (brand) { brand.hidden = false; brand.dataset.phase = 'navigate'; }
    // Wait for the rendered motion to finish, not a timer racing its first paint.
    exitTimer = setTimeout(brand ? finishTravel : navigateNow, brand ? timing.travel + 400 : 0);
  });
  const skip = () => { if (pending) navigateNow(); else reset(); };
  document.querySelector('[data-brand-skip]')?.addEventListener('click', skip);
  document.addEventListener('keydown', event => {
    if (brand && !brand.hidden && (event.key === 'Escape' || event.key === 'Tab')) skip();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') visibilityStart?.();
  });
  addEventListener('pageshow', event => { if (event.persisted) enter(true); });
  // Keep the completed logo painted until the next document commits. Restoring a
  // BFCache page resets it in pageshow; hiding it here flashed the old page.
  addEventListener('pagehide', cancelTimers);
  reduced.addEventListener('change', () => {
    if (reduced.matches && pending && !navigationStarted) { navigateNow(); hideBrand(); }
    else reset();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => enter(arrival), { once: true });
  else enter(arrival);
})();
