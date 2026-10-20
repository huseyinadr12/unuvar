/* Progressive motion: native links stay native; page transitions never delay clicks. */
(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  const revealAll = () => {
    observer?.disconnect();
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  };
  if (!preference.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -12px 0px' });
    document.querySelectorAll('.page-heading,.guide-toc,.section-head,.brand-card,.range-card,.space-card,.kelvin,.guide-link,.socket-card,.ip-card,.guide-split>*,.ask-copy,.ask-card,.faq-intro,.faq-list,.location-copy,.map-shell,.about-photo,.value-card,.channel-card,.destination-store,.conversation-intro,.conversation-form,.follow-inner,.collection-card,.selection-card,.atmosphere-grid>*,.project-intro,.project-steps>li,.catalog-teaser,.b2b-home-promo .container>*,.guide-short-links>a,.solution-card,.b2b-faq-grid>article').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      // Cards in a row follow one another; standalone blocks start straight away.
      const index = [...el.parentElement.children].indexOf(el);
      el.style.setProperty('--reveal-delay', `${index % 4 * 90}ms`);
      el.classList.add('reveal');
      observer.observe(el);
    });
  }
  preference.addEventListener('change', event => { if (event.matches) revealAll(); });
  addEventListener('pageshow', event => { if (event.persisted) revealAll(); });
  addEventListener('beforeprint', revealAll);
  document.addEventListener('focusin', event => { event.target.closest('.reveal')?.classList.add('is-visible'); });
  // Feedback follows the native action; navigation, keyboard activation and URLs stay intact.
  const animate = (element, frames, options) => {
    if (preference.matches || !element?.animate) return;
    element.animate(frames, { duration: 340, easing: 'cubic-bezier(.2,.7,.2,1)', ...options });
  };
  document.addEventListener('click', event => {
    const control = event.target.closest('a,button,summary');
    if (!control || control.disabled || event.defaultPrevented && control.tagName === 'A') return;
    if (control.matches('.button,.text-link,.space-links a,.guide-short-links a,.desktop-nav a,summary')) {
      animate(control, [{ transform: 'translateY(0)' }, { transform: 'translateY(2px)', offset: .3 }, { transform: 'translateY(0)' }]);
    }
    if (control.matches('[data-family]')) {
      document.querySelectorAll('.collection-card:not([hidden])').forEach((card, index) => {
        card.classList.add('is-visible');
        animate(card, [{ opacity: .35, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { delay: Math.min(index, 5) * 35 });
      });
    }
    if (control.matches('[data-b2b-add]')) {
      document.querySelectorAll('[data-b2b-badge]').forEach(badge =>
        animate(badge, [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: .45 }, { transform: 'scale(1)' }]));
    }
  });
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.reading-progress');
  const topButton = document.querySelector('.back-to-top');
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    header?.classList.toggle('is-scrolled', scrollY > 20);
    if (topButton) topButton.hidden = scrollY < 700;
  }
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  topButton?.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: preference.matches ? 'instant' : 'smooth' });
    document.querySelector('.logo-link')?.focus({ preventScroll: true });
  });
  updateScroll();
})();
