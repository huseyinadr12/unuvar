/* Branded light-on opening and navigation, independent of other site scripts. */
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
  let exitTimer, entryTimer, brandTimer, pending = null, revision = 0, visibilityStart = null;
  function hideBrand() {
    if (!brand) return;
    brand.hidden = true;
    delete brand.dataset.phase;
  }
  function reset() {
    ++revision;
    clearTimeout(exitTimer);
    clearTimeout(entryTimer);
    clearTimeout(brandTimer);
    visibilityStart = null;
    pending = null;
    delete root.dataset.brandIntro;
    root.dataset.navMotion = 'idle';
    hideBrand();
  }
  function revealContent() {
    if (brand) brand.dataset.phase = 'out';
    root.dataset.navMotion = 'enter';
    brandTimer = setTimeout(hideBrand, 400);
    entryTimer = setTimeout(() => { root.dataset.navMotion = 'idle'; }, 1350);
  }
  function enter(fromNavigation = false) {
    reset();
    if (reduced.matches) return;
    const ticket = revision;
    if (brand) { brand.hidden = false; brand.dataset.phase = 'waiting'; }
    const begin = () => {
      if (ticket !== revision) return;
      // A background tab must not finish its opening before the visitor sees it.
      if (document.visibilityState === 'hidden') { visibilityStart = begin; return; }
      visibilityStart = null;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (ticket !== revision) return;
        if (!brand) { revealContent(); return; }
        if (fromNavigation) {
          revealContent();
          brand.dataset.phase = 'arrive';
        } else {
          brand.dataset.phase = 'intro';
          brandTimer = setTimeout(revealContent, 1300);
        }
      }));
    };
    begin();
  }
  function navigateNow() {
    if (!pending) return;
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
    if (!target) { if (pending && !event.defaultPrevented) reset(); return; }
    if (target.kind === 'anchor') { highlight(target.url); return; }
    if (target.kind === 'same') { event.preventDefault(); enter(); return; }
    event.preventDefault();
    reset();
    pending = target.url.href;
    root.dataset.navMotion = 'leave';
    if (brand) { brand.hidden = false; brand.dataset.phase = 'leave'; }
    exitTimer = setTimeout(navigateNow, brand ? 620 : 320);
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
  addEventListener('pagehide', reset);
  reduced.addEventListener('change', () => {
    if (reduced.matches && pending) { const url = pending; reset(); location.assign(url); }
    else reset();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => enter(arrival), { once: true });
  else enter(arrival);
})();
