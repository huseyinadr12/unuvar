/* Prepare a local draft; the visitor sends it from WhatsApp. No storage or requests. */
(() => {
  'use strict';
  const composer = document.querySelector('[data-contact-composer]');
  if (!composer) return;
  const topic = document.querySelector('#contact-topic');
  const note = document.querySelector('#contact-note');
  const preview = document.querySelector('[data-contact-preview]');
  const link = document.querySelector('.composer-send');
  const topics = ['mekânımın aydınlatması', 'mağaza ziyareti', 'genel bir soru'];
  const update = () => {
    const extra = note.value.trim().slice(0, 700);
    const text = `Merhaba Ünüvar Aydınlatma, ${topics[topic.selectedIndex] || topics[0]} hakkında görüşmek istiyorum.${extra ? '\n\n' + extra : ''}`;
    preview.textContent = text;
    link.href = 'https://wa.me/905456105009?text=' + encodeURIComponent(text);
  };
  topic.addEventListener('change', update);
  note.addEventListener('input', update);
  addEventListener('pageshow', update);
  update();
  composer.hidden = false;
})();
