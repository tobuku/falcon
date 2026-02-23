(function () {
  "use strict";

  function setCanonical(url) {
    var link = document.querySelector('link[rel="canonical"]');
    if (link) link.setAttribute("href", url);
  }

  function setTitle(t) {
    if (t) document.title = t;
  }

  function setMetaDescription(d) {
    if (!d) return;
    var el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute("content", d);
  }

  function setOgTitle(t) {
    if (!t) return;
    var el = document.querySelector('meta[property="og:title"]');
    if (el) el.setAttribute("content", t);
  }

  function setOgDescription(d) {
    if (!d) return;
    var el = document.querySelector('meta[property="og:description"]');
    if (el) el.setAttribute("content", d);
  }

  window.FD = window.FD || {};
  window.FD.seo = {
    setCanonical: setCanonical,
    setTitle: setTitle,
    setMetaDescription: setMetaDescription,
    setOgTitle: setOgTitle,
    setOgDescription: setOgDescription
  };
})();
