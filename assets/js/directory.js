(async function () {
  const stateEl = document.getElementById("state");
  const catEl = document.getElementById("cat");
  const form = document.getElementById("filters");
  const resultsEl = document.getElementById("results");
  const countEl = document.getElementById("count");
  const crumbsEl = document.getElementById("crumbs");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const pageMeta = document.getElementById("pageMeta");
  const indexTargets = document.getElementById("indexTargets");

  const PAGE_SIZE = 9;

  const [states, cats, listings] = await Promise.all([
    fetch("/data/states.json").then(r => r.json()),
    fetch("/data/categories.json").then(r => r.json()),
    fetch("/data/listings.sample.json").then(r => r.json())
  ]);

  window.FD.setSelectOptions(stateEl, states.map(s => ({ value: s.code, label: s.name })), "All states");
  window.FD.setSelectOptions(catEl, cats.map(c => ({ value: c.slug, label: c.name })), "All categories");

  function normalize(s) {
    return String(s || "").toLowerCase().trim();
  }

  function getParams() {
    const url = new URL(window.location.href);
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
    const q = document.getElementById("q");
    const type = document.getElementById("type");
    const price = document.getElementById("price");
    const sort = document.getElementById("sort");

    if (q) q.value = p.q;
    if (stateEl) stateEl.value = p.state;
    if (catEl) catEl.value = p.cat;
    if (type) type.value = p.type;
    if (price) price.value = p.price;
    if (sort) sort.value = p.sort;
  }

  function match(listing, p) {
    const hay = [
      listing.name,
      listing.tagline,
      (listing.offerings || []).join(" "),
      listing.city,
      listing.state,
      listing.category
    ].join(" ");

    const q = normalize(p.q);
    if (q && !normalize(hay).includes(q)) return false;
    if (p.state && listing.state !== p.state) return false;
    if (p.cat && listing.category !== p.cat) return false;
    if (p.type && listing.type !== p.type) return false;
    if (p.price && listing.price_model !== p.price) return false;
    return true;
  }

  function score(listing, p) {
    let s = 0;
    if (listing.plan === "featured") s += 30;
    if (listing.plan === "verified") s += 15;
    if (normalize(listing.name).includes(normalize(p.q))) s += 10;
    return s;
  }

  function sortList(arr, p) {
    if (p.sort === "az") return arr.sort((a, b) => a.name.localeCompare(b.name));
    if (p.sort === "newest") return arr.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    if (p.sort === "verified") {
      const rank = x => (x.plan === "featured" ? 2 : x.plan === "verified" ? 1 : 0);
      return arr.sort((a, b) => rank(b) - rank(a));
    }
    return arr.sort((a, b) => score(b, p) - score(a, p));
  }

  function renderCard(l) {
    const a = document.createElement("article");
    a.className = "card result-card";

    const head = document.createElement("div");
    head.className = "result-head";

    const left = document.createElement("div");
    const h3 = document.createElement("h2");
    h3.style.margin = "0";
    const link = document.createElement("a");
    link.href = `/listing.html?id=${encodeURIComponent(l.id)}`;
    link.textContent = l.name;
    link.className = "text-link";
    h3.appendChild(link);

    const p = document.createElement("p");
    p.className = "fineprint";
    p.textContent = `${l.city || "Online"}, ${l.state} · ${labelForCategory(l.category)} · ${labelForType(l.type)}`;
    left.appendChild(h3);
    left.appendChild(p);

    const badgeWrap = document.createElement("div");
    badgeWrap.className = "badges";
    const b = document.createElement("span");
    b.className = `badge ${l.plan}`;
    b.textContent = l.plan.toUpperCase();
    badgeWrap.appendChild(b);

    head.appendChild(left);
    head.appendChild(badgeWrap);

    const offers = document.createElement("ul");
    offers.className = "chips";
    for (const o of (l.offerings || []).slice(0, 6)) {
      const li = document.createElement("li");
      li.textContent = o;
      offers.appendChild(li);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const view = document.createElement("a");
    view.className = "btn btn-small btn-ghost";
    view.href = `/listing.html?id=${encodeURIComponent(l.id)}`;
    view.textContent = "View";
    actions.appendChild(view);

    a.appendChild(head);
    a.appendChild(offers);
    a.appendChild(actions);
    return a;
  }

  function labelForCategory(slug) {
    const found = cats.find(c => c.slug === slug);
    return found ? found.name : slug;
  }

  function labelForType(t) {
    if (t === "service") return "Service";
    if (t === "product") return "Product";
    if (t === "organization") return "Organization";
    return "Listing";
  }

  function renderCrumbs(p) {
    const parts = [];
    if (p.type) parts.push(labelForType(p.type));
    if (p.cat) parts.push(labelForCategory(p.cat));
    if (p.state) {
      const st = states.find(s => s.code === p.state);
      parts.push(st ? st.name : p.state);
    }
    crumbsEl.textContent = parts.join(" / ");
  }

  function setUrlFromForm() {
    const fd = new FormData(form);
    const url = new URL(window.location.href);
    url.searchParams.set("q", String(fd.get("q") || ""));
    url.searchParams.set("state", String(fd.get("state") || ""));
    url.searchParams.set("cat", String(fd.get("cat") || ""));
    url.searchParams.set("type", String(fd.get("type") || ""));
    url.searchParams.set("price", String(fd.get("price") || ""));
    url.searchParams.set("sort", String(fd.get("sort") || "relevance"));
    url.searchParams.set("page", "1");

    for (const k of ["q","state","cat","type","price"]) {
      if (!url.searchParams.get(k)) url.searchParams.delete(k);
    }
    if (url.searchParams.get("sort") === "relevance") url.searchParams.delete("sort");

    window.location.href = url.toString();
  }

  function renderIndexTargets() {
    if (!indexTargets) return;
    indexTargets.innerHTML = "";
    const picks = [
      { cat: "falconry-schools", type: "service" },
      { cat: "bird-abatement", type: "service" },
      { cat: "telemetry-and-trackers", type: "product" },
      { cat: "gloves-and-gauntlets", type: "product" },
      { cat: "raptor-veterinarians", type: "service" },
      { cat: "breeders", type: "service" }
    ];
    for (const p of picks) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "text-link";
      a.href = `/directory.html?cat=${encodeURIComponent(p.cat)}&type=${encodeURIComponent(p.type)}`;
      a.textContent = `${labelForCategory(p.cat)} in the USA`;
      li.appendChild(a);
      indexTargets.appendChild(li);
    }
  }

  function applySeo(p, total) {
    const bits = [];
    if (p.type) bits.push(labelForType(p.type));
    if (p.cat) bits.push(labelForCategory(p.cat));
    if (p.state) {
      const st = states.find(s => s.code === p.state);
      bits.push(st ? st.name : p.state);
    }
    const title = bits.length ? `${bits.join(" , ")} Directory` : "Falconry Directory USA, Directory";
    const desc = bits.length
      ? `Browse ${bits.join(", ")} listings. ${total} results. Filter by category and state.`
      : `Browse falconry services and products. ${total} results. Filter by category and state.`;

    const url = new URL(window.location.href);
    window.FD.seo.setTitle(title);
    window.FD.seo.setMetaDescription(desc);
    window.FD.seo.setCanonical(`https://example.com${url.pathname}${url.search}`);
  }

  function render() {
    const p = getParams();
    setFormFromParams(p);

    const filtered = listings.filter(l => match(l, p));
    sortList(filtered, p);

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(p.page, pages);
    const start = (page - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    resultsEl.innerHTML = "";
    for (const l of slice) resultsEl.appendChild(renderCard(l));

    countEl.textContent = `${total} results`;
    renderCrumbs(p);

    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= pages;
    pageMeta.textContent = `Page ${page} of ${pages}`;

    prevBtn.onclick = () => goToPage(page - 1);
    nextBtn.onclick = () => goToPage(page + 1);

    renderIndexTargets();
    applySeo(p, total);
  }

  function goToPage(n) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(Math.max(1, n)));
    window.location.href = url.toString();
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setUrlFromForm();
    });
  }

  const clearBtn = document.getElementById("clearBtn");
  if (clearBtn) clearBtn.addEventListener("click", () => {});

  stateEl.innerHTML = `<option value="">All states</option>` + states.map(s => `<option value="${s.code}">${s.name}</option>`).join("");
  catEl.innerHTML = `<option value="">All categories</option>` + cats.map(c => `<option value="${c.slug}">${c.name}</option>`).join("");

  render();
})();
