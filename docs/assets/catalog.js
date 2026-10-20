/* Progressive reader: decoded pages turn over the current sheet, with native PDF fallbacks. */
(() => {
  const reader = document.querySelector('[data-reader]');
  if (!reader) return;
  const select = reader.querySelector('#reader-page');
  const img = reader.querySelector('[data-reader-image]');
  const canvas = reader.querySelector('.reader-canvas');
  const prev = reader.querySelector('[data-reader-prev]');
  const next = reader.querySelector('[data-reader-next]');
  const status = reader.querySelector('[data-reader-status]');
  const error = reader.querySelector('[data-reader-error]');
  const large = reader.querySelector('[data-reader-large]');
  const pdf = reader.querySelector('[data-reader-pdf]');
  const enquiry = document.querySelector('[data-reader-enquiry]');
  const pdfUrl = pdf.getAttribute('href').split('#')[0];
  const total = select.options.length;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 1, requested = 1, revision = 0, turning = null, sheet = null;
  function clearTurn() {
    if (turning) turning.cancel();
    turning = null;
    if (sheet) sheet.remove();
    sheet = null;
    canvas.classList.remove('is-turning');
  }
  function controls(number) {
    select.value = String(number);
    prev.disabled = number === 1;
    next.disabled = number === total;
  }
  function commit(number, source, updateHash) {
    const option = select.options[number - 1];
    const label = option.textContent.split(' · ').slice(1).join(' · ');
    current = number;
    controls(number);
    img.src = source;
    img.alt = `Katalog sayfa ${number}: ${label}`;
    large.href = source;
    pdf.href = `${pdfUrl}#page=${number}`;
    status.textContent = `Sayfa ${number} / ${total} · ${label}`;
    if (enquiry) {
      const url = new URL(enquiry.href);
      url.searchParams.set('sayfa', String(number));
      enquiry.href = url.href;
    }
    if (updateHash) {
      try { history.replaceState(null, '', `#sayfa-${number}`); } catch (_) {}
    }
  }
  async function showPage(value, updateHash = true, animate = true) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > total) return;
    const request = ++revision;
    requested = number;
    clearTurn();
    controls(number);
    error.hidden = true;
    if (number === current && img.complete && img.naturalWidth) {
      canvas.setAttribute('aria-busy', 'false');
      commit(number, select.options[number - 1].dataset.pageImage, updateHash);
      return;
    }
    canvas.setAttribute('aria-busy', 'true');
    const source = select.options[number - 1].dataset.pageImage;
    const incoming = new Image();
    incoming.src = source;
    try {
      await incoming.decode();
      if (request !== revision) return;
      const direction = number > current ? -1 : 1;
      const shouldTurn = animate && !reduced.matches && img.complete && img.naturalWidth && !!img.animate;
      if (shouldTurn) {
        sheet = img.cloneNode(false);
        sheet.removeAttribute('data-reader-image');
        sheet.removeAttribute('loading');
        sheet.alt = '';
        sheet.setAttribute('aria-hidden', 'true');
        sheet.className = 'reader-turning-sheet';
        sheet.style.transformOrigin = direction < 0 ? 'left center' : 'right center';
        canvas.append(sheet);
      }
      commit(number, source, updateHash);
      canvas.setAttribute('aria-busy', 'false');
      if (shouldTurn) {
        canvas.classList.add('is-turning');
        turning = sheet.animate([
          { transform: 'rotateY(0deg)', opacity: 1, filter: 'brightness(1)' },
          { transform: `rotateY(${direction * 45}deg)`, opacity: 1, filter: 'brightness(.88)', offset: .55 },
          { transform: `rotateY(${direction * 96}deg)`, opacity: 0, filter: 'brightness(.78)' }
        ], { duration: 580, easing: 'cubic-bezier(.22,.65,.2,1)', fill: 'forwards' });
        try { await turning.finished; } catch (_) {}
        if (request === revision) clearTurn();
      }
    } catch (_) {
      if (request !== revision) return;
      requested = current;
      controls(current);
      canvas.setAttribute('aria-busy', 'false');
      error.hidden = false;
      error.textContent = `${number}. sayfa yüklenemedi. Mevcut sayfa korunuyor; yeniden deneyebilir veya PDF’yi açabilirsiniz.`;
    }
  }
  prev.addEventListener('click', () => showPage(requested - 1));
  next.addEventListener('click', () => showPage(requested + 1));
  select.addEventListener('change', () => showPage(select.value));
  canvas.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPage(requested + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let touch = null;
  canvas.addEventListener('touchstart', event => {
    touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  canvas.addEventListener('touchend', event => {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.6) showPage(requested + (dx < 0 ? 1 : -1));
  }, { passive: true });
  canvas.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
  document.querySelectorAll('[data-reader-go]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      showPage(link.dataset.readerGo);
      reader.scrollIntoView({ block: 'start', behavior: 'auto' });
      canvas.focus({ preventScroll: true });
    });
  });
  function readHash() {
    const match = location.hash.match(/^#sayfa-(\d+)$/);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > total) return;
    showPage(Number(match[1]), false, false);
    reader.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  reduced.addEventListener('change', () => { if (reduced.matches) clearTurn(); });
  img.addEventListener('error', () => {
    error.hidden = false;
    error.textContent = 'Önizleme yüklenemedi. Yeniden deneyebilir veya PDF’yi açabilirsiniz.';
  });
  reader.querySelector('[data-reader-controls]').hidden = false;
  readHash();
  window.addEventListener('hashchange', readHash);
})();
