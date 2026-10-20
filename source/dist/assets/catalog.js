/* One preview at a time; native PDF and chapter links work without JavaScript. */
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
  const pdfUrl = pdf.getAttribute('href').split('#')[0];
  const total = select.options.length;
  let current = 1;

  function showPage(value, updateHash = true) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > total) return;
    current = number;
    const option = select.options[number - 1];
    const label = option.textContent.split(' · ').slice(1).join(' · ');
    select.value = String(number);
    prev.disabled = number === 1;
    next.disabled = number === total;
    error.hidden = true;
    img.hidden = false;
    const source = option.dataset.pageImage;
    if (img.getAttribute('src') !== source) {
      canvas.setAttribute('aria-busy', 'true');
      img.src = source;
    }
    img.alt = `Katalog sayfa ${number}: ${label}`;
    large.href = source;
    pdf.href = `${pdfUrl}#page=${number}`;
    status.textContent = `Sayfa ${number} / ${total} · ${label}`;
    if (updateHash) {
      try { history.replaceState(null, '', `#sayfa-${number}`); } catch (_) {}
    }
  }
  img.addEventListener('load', () => canvas.setAttribute('aria-busy', 'false'));
  img.addEventListener('error', () => {
    canvas.setAttribute('aria-busy', 'false');
    img.hidden = true;
    error.hidden = false;
  });
  prev.addEventListener('click', () => showPage(current - 1));
  next.addEventListener('click', () => showPage(current + 1));
  select.addEventListener('change', () => showPage(select.value));
  document.querySelectorAll('[data-reader-go]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      showPage(link.dataset.readerGo);
      reader.scrollIntoView({ block: 'start', behavior: 'auto' });
      select.focus({ preventScroll: true });
    });
  });
  function readHash() {
    const match = location.hash.match(/^#sayfa-(\d+)$/);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > total) return;
    showPage(Number(match[1]), false);
    reader.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  reader.querySelector('[data-reader-controls]').hidden = false;
  readHash();
  window.addEventListener('hashchange', readHash);
})();
