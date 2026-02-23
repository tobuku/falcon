(async function () {
  const url = new URL(window.location.href);
  const id = url.searchParams.get("id") || "";

  const [cats, states, listings] = await Promise.all([
    fetch("/data/categories.json").then(r => r.json()),
    fetch("/data/states.json").then(r => r.json()),
    fetch("/data/listings.sample.json").then(r => r.json())
  ]);

  const listing = listings.find(x => x.id === id) || listings[0];

  const catName = (slug) => (cats.find(c => c.slug === slug) || {}).name || slug;
  const stateName = (code) => (states.find(s => s.code === code) || {}).name || code;

  const el = (x) => document.getElementById(x);

  el("name").textContent = listing.name;
  el("tagline").textContent = listing.tagline || "";

  el("type").textContent = listing.type;
  el("category").textContent = catName(listing.category);
  el("state").textContent = stateName(listing.state);
  el("city").textContent = listing.city || "Online";
  el("serviceArea").textContent = listing.service_area || "Not provided";
  el("priceModel").textContent = listing.price_model || "Not provided";

  const badges = el("badges");
  badges.innerHTML = "";
  const b = document.createElement("span");
  b.className = `badge ${listing.plan}`;
  b.textContent = listing.plan.toUpperCase();
  badges.appendChild(b);

  const creds = el("credentials");
  creds.innerHTML = "";
  for (const c of (listing.credentials || [])) {
    const li = document.createElement("li");
    li.textContent = c;
    creds.appendChild(li);
  }
  if (!(listing.credentials || []).length) {
    const li = document.createElement("li");
    li.textContent = "No credentials provided";
    creds.appendChild(li);
  }

  const off = el("offerings");
  off.innerHTML = "";
  for (const o of (listing.offerings || [])) {
    const li = document.createElement("li");
    li.textContent = o;
    off.appendChild(li);
  }

  const phone = listing.phone || "";
  const email = listing.email || "";
  const site = listing.website || "";
  const address = listing.address || "";

  el("phone").textContent = phone || "Not provided";
  el("email").textContent = email || "Not provided";
  el("address").textContent = address || "Not provided";

  const phoneBtn = el("phoneBtn");
  phoneBtn.href = phone ? `tel:${phone}` : "#";
  phoneBtn.setAttribute("aria-disabled", phone ? "false" : "true");
  if (!phone) phoneBtn.classList.add("btn-ghost");

  const siteBtn = el("siteBtn");
  siteBtn.href = site || "#";
  siteBtn.style.display = site ? "inline-flex" : "none";

  const mapBtn = el("mapBtn");
  const mapQ = encodeURIComponent([address, listing.city, listing.state].filter(Boolean).join(", "));
  mapBtn.href = mapQ ? `https://www.google.com/maps/search/?api=1&query=${mapQ}` : "#";

  const backRow = el("backRow");
  backRow.innerHTML = `<a class="text-link" href="/directory.html">← Back to results</a>`;

  const schema = {
    "@context": "https://schema.org",
    "@type": listing.type === "product" ? "Store" : "LocalBusiness",
    "name": listing.name,
    "url": site || `https://example.com/listing.html?id=${encodeURIComponent(listing.id)}`,
    "telephone": phone || undefined,
    "email": email || undefined,
    "address": address ? {
      "@type": "PostalAddress",
      "streetAddress": address,
      "addressLocality": listing.city || undefined,
      "addressRegion": listing.state || undefined,
      "addressCountry": "US"
    } : undefined,
    "areaServed": listing.service_area || undefined,
    "keywords": (listing.offerings || []).join(", ")
  };

  const schemaClean = JSON.parse(JSON.stringify(schema));
  const schemaBox = el("schemaBox");
  schemaBox.textContent = JSON.stringify(schemaClean, null, 2);

  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify(schemaClean);
  document.head.appendChild(ld);

  const title = `${listing.name} , ${catName(listing.category)} , ${stateName(listing.state)}`;
  const desc = `${listing.name}. ${catName(listing.category)} in ${stateName(listing.state)}. Contact info and offerings.`;

  window.FD.seo.setTitle(title);
  window.FD.seo.setMetaDescription(desc);
  window.FD.seo.setCanonical(`https://example.com${url.pathname}${url.search}`);
})();
