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
    document.querySelectorAll('.page-heading,.brands-showcase h2,.section-head,.store-copy,.store-photo,.location-copy,.map-shell,.faq-section>div,.brand-card,.conversion-copy,.conversion-action,.about-copy,.about-photo,.contact-row,.chapter-heading,.space-panel,.process-intro,.process-steps,.questions-intro,.questions-list,.approach-grid article,.visit-card,.prepare-copy,.follow-inner,.story-details-grid>div,.light-story-visual,.light-story-copy,.destination-heading,.destination-store,.conversation-intro,.conversation-form').forEach((el, index) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.style.setProperty('--reveal-delay', `${index % 3 * 45}ms`);
      el.classList.add('reveal');
      observer.observe(el);
    });
  }
  preference.addEventListener('change', event => { if (event.matches) revealAll(); });
  addEventListener('pageshow', event => { if (event.persisted) revealAll(); });
  addEventListener('beforeprint', revealAll);
  document.addEventListener('focusin', event => { event.target.closest('.reveal')?.classList.add('is-visible'); });
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
