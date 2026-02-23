(async function () {
  "use strict";

  var DOMAIN = "https://falconrydirectory.com";
  var PAGE_SIZE = 9;

  var stateEl = document.getElementById("state");
  var catEl = document.getElementById("cat");
  var form = document.getElementById("filters");
  var resultsEl = document.getElementById("results");
  var countEl = document.getElementById("count");
  var crumbsEl = document.getElementById("crumbs");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var pageMeta = document.getElementById("pageMeta");
  var indexTargets = document.getElementById("indexTargets");
  var seoTitle = document.getElementById("seoTitle");
  var seoText = document.getElementById("seoText");

  var data = await Promise.all([
    fetch("data/states.json").then(function (r) { return r.json(); }),
    fetch("data/categories.json").then(function (r) { return r.json(); }),
    fetch("data/listings.sample.json").then(function (r) { return r.json(); })
  ]);

  var states = data[0];
  var cats = data[1];
  var listings = data[2];

  // Populate filter selects
  window.FD.setSelectOptions(stateEl, states.map(function (s) { return { value: s.code, label: s.name }; }), "All states");
  window.FD.setSelectOptions(catEl, cats.map(function (c) { return { value: c.slug, label: c.name }; }), "All categories");

  function normalize(s) {
    return String(s || "").toLowerCase().trim();
  }

  function getParams() {
    var url = new URL(window.location.href);
    return {
      q: url.searchParams.get("q") || "",
      state: url.searchParams.get("state") || "",
      cat: url.searchParams.get("cat") || "",
      type: url.searchParams.get("type") || "",
      price: url.searchParams.get("price") || "",
      sort: url.searchParams.get("sort") || "relevance",
      page: Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    };
  }

  function setFormFromParams(p) {
    var q = document.getElementById("q");
    var type = document.getElementById("type");
    var price = document.getElementById("price");
    var sort = document.getElementById("sort");
    if (q) q.value = p.q;
    if (stateEl) stateEl.value = p.state;
    if (catEl) catEl.value = p.cat;
    if (type) type.value = p.type;
    if (price) price.value = p.price;
    if (sort) sort.value = p.sort;
  }

  function match(listing, p) {
    var hay = [
      listing.name, listing.tagline,
      (listing.offerings || []).join(" "),
      listing.city, listing.state, listing.category
    ].join(" ");

    var q = normalize(p.q);
    if (q && !normalize(hay).includes(q)) return false;
    if (p.state && listing.state !== p.state) return false;
    if (p.cat && listing.category !== p.cat) return false;
    if (p.type && listing.type !== p.type) return false;
    if (p.price && listing.price_model !== p.price) return false;
    return true;
  }

  function score(listing, p) {
    var s = 0;
    if (listing.plan === "featured") s += 30;
    if (listing.plan === "verified") s += 15;
    if (normalize(listing.name).includes(normalize(p.q))) s += 10;
    return s;
  }

  function sortList(arr, p) {
    if (p.sort === "az") return arr.sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (p.sort === "newest") return arr.sort(function (a, b) { return (b.created_at || "").localeCompare(a.created_at || ""); });
    if (p.sort === "verified") {
      var rank = function (x) { return x.plan === "featured" ? 2 : x.plan === "verified" ? 1 : 0; };
      return arr.sort(function (a, b) { return rank(b) - rank(a); });
    }
    return arr.sort(function (a, b) { return score(b, p) - score(a, p); });
  }

  function labelForCategory(slug) {
    var found = cats.find(function (c) { return c.slug === slug; });
    return found ? found.name : slug;
  }

  function labelForType(t) {
    if (t === "service") return "Service";
    if (t === "product") return "Product";
    if (t === "organization") return "Organization";
    return "Listing";
  }

  function renderCard(l) {
    var a = document.createElement("article");
    a.className = "card result-card";

    var head = document.createElement("div");
    head.className = "result-head";

    var left = document.createElement("div");
    var h3 = document.createElement("h2");
    h3.style.margin = "0";
    h3.style.fontSize = "1.1rem";
    var link = document.createElement("a");
    link.href = "listing.html?id=" + encodeURIComponent(l.id);
    link.textContent = l.name;
    link.className = "text-link";
    h3.appendChild(link);

    var p = document.createElement("p");
    p.className = "fineprint";
    p.style.marginTop = "4px";
    p.textContent = (l.city || "Online") + ", " + l.state + " \u00B7 " + labelForCategory(l.category) + " \u00B7 " + labelForType(l.type);
    left.appendChild(h3);
    left.appendChild(p);

    var badgeWrap = document.createElement("div");
    badgeWrap.className = "badges";
    var b = document.createElement("span");
    b.className = "badge " + l.plan;
    b.textContent = l.plan.toUpperCase();
    badgeWrap.appendChild(b);

    head.appendChild(left);
    head.appendChild(badgeWrap);

    // Tagline
    if (l.tagline) {
      var tag = document.createElement("p");
      tag.style.margin = "0";
      tag.style.fontSize = ".93rem";
      tag.style.color = "var(--text-muted)";
      tag.textContent = l.tagline;
      a.appendChild(head);
      a.appendChild(tag);
    } else {
      a.appendChild(head);
    }

    // Offerings chips
    var offers = document.createElement("ul");
    offers.className = "chips";
    var offerSlice = (l.offerings || []).slice(0, 5);
    for (var i = 0; i < offerSlice.length; i++) {
      var li = document.createElement("li");
      li.textContent = offerSlice[i];
      offers.appendChild(li);
    }
    a.appendChild(offers);

    // Actions
    var actions = document.createElement("div");
    actions.className = "card-actions";
    var view = document.createElement("a");
    view.className = "btn btn-small";
    view.href = "listing.html?id=" + encodeURIComponent(l.id);
    view.textContent = "View Details";
    actions.appendChild(view);
    a.appendChild(actions);

    return a;
  }

  function renderCrumbs(p) {
    var parts = [];
    if (p.type) parts.push(labelForType(p.type));
    if (p.cat) parts.push(labelForCategory(p.cat));
    if (p.state) {
      var st = states.find(function (s) { return s.code === p.state; });
      parts.push(st ? st.name : p.state);
    }
    crumbsEl.textContent = parts.length ? parts.join(" / ") : "All listings";
  }

  function setUrlFromForm() {
    var fd = new FormData(form);
    var url = new URL(window.location.href);
    url.searchParams.set("q", String(fd.get("q") || ""));
    url.searchParams.set("state", String(fd.get("state") || ""));
    url.searchParams.set("cat", String(fd.get("cat") || ""));
    url.searchParams.set("type", String(fd.get("type") || ""));
    url.searchParams.set("price", String(fd.get("price") || ""));
    url.searchParams.set("sort", String(fd.get("sort") || "relevance"));
    url.searchParams.set("page", "1");

    ["q", "state", "cat", "type", "price"].forEach(function (k) {
      if (!url.searchParams.get(k)) url.searchParams.delete(k);
    });
    if (url.searchParams.get("sort") === "relevance") url.searchParams.delete("sort");

    window.location.href = url.toString();
  }

  function renderIndexTargets() {
    if (!indexTargets) return;
    indexTargets.innerHTML = "";
    var picks = [
      { cat: "falconry-schools", type: "service" },
      { cat: "bird-abatement", type: "service" },
      { cat: "breeders", type: "service" },
      { cat: "raptor-veterinarians", type: "service" },
      { cat: "telemetry-and-trackers", type: "product" },
      { cat: "gloves-and-gauntlets", type: "product" },
      { cat: "hoods", type: "product" },
      { cat: "mews-builds", type: "product" }
    ];
    for (var i = 0; i < picks.length; i++) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "text-link";
      a.href = "directory.html?cat=" + encodeURIComponent(picks[i].cat) + "&type=" + encodeURIComponent(picks[i].type);
      a.textContent = labelForCategory(picks[i].cat) + " in the USA";
      li.appendChild(a);
      indexTargets.appendChild(li);
    }
  }

  function applySeo(p, total) {
    var bits = [];
    if (p.type) bits.push(labelForType(p.type));
    if (p.cat) bits.push(labelForCategory(p.cat));
    if (p.state) {
      var st = states.find(function (s) { return s.code === p.state; });
      bits.push(st ? st.name : p.state);
    }

    var title = bits.length
      ? bits.join(" — ") + " | Falconry Directory USA"
      : "Falconry Directory | Browse All Listings";
    var desc = bits.length
      ? "Browse " + bits.join(", ") + " listings on Falconry Directory USA. " + total + " results. Filter by category, state, and type."
      : "Browse all falconry services and products. " + total + " listings. Filter by category, state, and type.";

    var url = new URL(window.location.href);
    window.FD.seo.setTitle(title);
    window.FD.seo.setMetaDescription(desc);
    window.FD.seo.setCanonical(DOMAIN + url.pathname + url.search);

    // Update SEO text block
    if (seoTitle && seoText) {
      if (bits.length) {
        seoTitle.textContent = bits.join(" — ") + " Directory";
        seoText.textContent = "Showing " + total + " " + bits.join(", ") + " listings on Falconry Directory USA. " +
          "Use the filters above to refine your search by state, category, type, and price model. " +
          "Each listing includes contact information, service areas, credentials, and offerings.";
      } else {
        seoTitle.textContent = "Falconry Directory USA";
        seoText.textContent = "Browse our complete directory of falconry services, products, and organizations across the United States. " +
          "Use the filters above to narrow results by state, category, listing type, and price model. " +
          "Every listing includes contact information, service areas, credentials, and offerings to help you find the right falconry resource.";
      }
    }
  }

  function render() {
    var p = getParams();
    setFormFromParams(p);

    var filtered = listings.filter(function (l) { return match(l, p); });
    sortList(filtered, p);

    var total = filtered.length;
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    var page = Math.min(p.page, pages);
    var start = (page - 1) * PAGE_SIZE;
    var slice = filtered.slice(start, start + PAGE_SIZE);

    resultsEl.innerHTML = "";
    if (slice.length === 0) {
      resultsEl.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:40px"><h3>No listings found</h3><p class="fineprint">Try adjusting your filters or <a class="text-link" href="directory.html">clear all filters</a>.</p></div>';
    } else {
      for (var i = 0; i < slice.length; i++) {
        resultsEl.appendChild(renderCard(slice[i]));
      }
    }

    countEl.textContent = total + " result" + (total !== 1 ? "s" : "");
    renderCrumbs(p);

    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= pages;
    pageMeta.textContent = "Page " + page + " of " + pages;

    prevBtn.onclick = function () { goToPage(page - 1); };
    nextBtn.onclick = function () { goToPage(page + 1); };

    renderIndexTargets();
    applySeo(p, total);
  }

  function goToPage(n) {
    var url = new URL(window.location.href);
    url.searchParams.set("page", String(Math.max(1, n)));
    window.location.href = url.toString();
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setUrlFromForm();
    });
  }

  render();
})();
