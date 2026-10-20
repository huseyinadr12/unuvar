/* Keep saved product links and catalog anchors when following the previous URL. */
(() => {
  const destination = new URL('../b2c/', location.href);
  destination.search = location.search;
  destination.hash = location.hash;
  const revision = document.documentElement.dataset.siteRevision;
  if (revision) destination.searchParams.set('_v', revision);
  const link = document.querySelector('[data-redirect-link]');
  if (link) link.href = destination.href;
  location.replace(destination.href);
})();
