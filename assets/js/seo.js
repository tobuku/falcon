(function () {
  function setCanonical(url) {
    const link = document.querySelector('link[rel="canonical"]');
    if (!link) return;
    link.setAttribute("href", url);
  }

  function setTitle(t) {
    if (!t) return;
    document.title = t;
  }

  function setMetaDescription(d) {
    if (!d) return;
    const el = document.querySelector('meta[name="description"]');
    if (!el) return;
    el.setAttribute("content", d);
  }

  window.FD = window.FD || {};
  window.FD.seo = { setCanonical, setTitle, setMetaDescription };
})();
