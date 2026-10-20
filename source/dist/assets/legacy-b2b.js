/* Keep saved product links and catalog anchors when following the previous URL. */
(() => {
  const destination = new URL('../b2c/', location.href);
  destination.search = location.search;
  destination.hash = location.hash;
  const link = document.querySelector('[data-redirect-link]');
  if (link) link.href = destination.href;
  location.replace(destination.href);
})();
