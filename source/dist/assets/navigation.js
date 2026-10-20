/* Short, explicit navigation motion also works without the View Transition API. */
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
  let exitTimer, entryTimer, pending = null, revision = 0;
  function reset() {
    ++revision;
    clearTimeout(exitTimer);
    clearTimeout(entryTimer);
    pending = null;
    root.dataset.navMotion = 'idle';
  }
  function enter() {
    reset();
    if (reduced.matches) return;
    const ticket = revision;
    // Begin after the destination DOM is ready, rather than while CSS is loading.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (ticket !== revision) return;
      root.dataset.navMotion = 'enter';
      entryTimer = setTimeout(() => { root.dataset.navMotion = 'idle'; }, 1350);
    }));
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
    exitTimer = setTimeout(() => { if (pending) location.assign(pending); }, 260);
  });
  addEventListener('pageshow', event => { if (event.persisted) enter(); });
  addEventListener('pagehide', reset);
  reduced.addEventListener('change', () => {
    if (reduced.matches && pending) { const url = pending; reset(); location.assign(url); }
    else reset();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enter, { once: true });
  else enter();
})();
