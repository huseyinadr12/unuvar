/* Progressive collection filtering and a visitor-controlled WhatsApp draft. */
(() => {
  'use strict';
  const controls = document.querySelector('[data-collection-controls]');
  if (controls) {
    const cards = Array.from(document.querySelectorAll('[data-collection-family]'));
    const buttons = Array.from(controls.querySelectorAll('[data-family]'));
    const search = controls.querySelector('[data-collection-search]');
    const count = controls.querySelector('[data-collection-count]');
    const empty = document.querySelector('[data-collection-empty]');
    const normalize = value => value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const requested = new URLSearchParams(location.search).get('grup');
    let family = buttons.some(b => b.dataset.family === requested) ? requested : 'all';
    function filter() {
      const term = normalize(search.value.trim());
      let visible = 0;
      cards.forEach(card => {
        card.hidden = !((family === 'all' || card.dataset.collectionFamily === family) && normalize(card.dataset.collectionName).includes(term));
        if (!card.hidden) visible++;
      });
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.family === family)));
      count.textContent = `${visible} ürün grubu`;
      empty.hidden = visible !== 0;
    }
    buttons.forEach(button => button.addEventListener('click', () => { family = button.dataset.family; filter(); }));
    search.addEventListener('input', filter);
    controls.hidden = false;
    filter();
  }
  const form = document.querySelector('[data-quote-form]');
  if (!form) return;
  const fields = form.elements;
  const query = new URLSearchParams(location.search);
  fields.code.value = (query.get('urun') || '').slice(0, 80);
  const page = Number(query.get('sayfa'));
  if (Number.isInteger(page) && page > 0 && page <= Number(fields.page.max)) fields.page.value = String(page);
  const preview = form.querySelector('[data-quote-preview]');
  const button = form.querySelector('[data-quote-submit]');
  function message() {
    const parts = ['Merhaba Ünüvar Aydınlatma, fiyat ve stok bilgisi almak istiyorum.'];
    for (const [name,label] of [['code','Ürün kodu'],['quantity','Adet'],['space','Kullanım alanı'],['page','Katalog sayfası'],['note','Not']]) {
      const value = fields[name].value.trim();
      if (value) parts.push(`${label}: ${value}`);
    }
    if (fields.page.value) {
      const catalogLink = new URL('../urunler/', location.href);
      catalogLink.search = '';
      catalogLink.hash = `sayfa-${fields.page.value}`;
      parts.push(catalogLink.href);
    }
    return parts.join('\n');
  }
  const update = () => { preview.textContent = message(); };
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.reportValidity()) window.open('https://wa.me/905456105009?text=' + encodeURIComponent(message()), '_blank', 'noopener,noreferrer');
  });
  button.hidden = false;
  update();
})();
