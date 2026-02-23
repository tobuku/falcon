(async function () {
  "use strict";

  var DOMAIN = "https://falconrydirectory.com";
  var url = new URL(window.location.href);
  var id = url.searchParams.get("id") || "";

  var data = await Promise.all([
    fetch("data/categories.json").then(function (r) { return r.json(); }),
    fetch("data/states.json").then(function (r) { return r.json(); }),
    fetch("data/listings.sample.json").then(function (r) { return r.json(); })
  ]);

  var cats = data[0];
  var states = data[1];
  var listings = data[2];

  var listing = listings.find(function (x) { return x.id === id; }) || listings[0];

  function catName(slug) {
    var c = cats.find(function (c) { return c.slug === slug; });
    return c ? c.name : slug;
  }
  function stateName(code) {
    var s = states.find(function (s) { return s.code === code; });
    return s ? s.name : code;
  }
  function el(x) { return document.getElementById(x); }

  // Populate fields
  el("name").textContent = listing.name;
  el("tagline").textContent = listing.tagline || "";
  el("type").textContent = listing.type.charAt(0).toUpperCase() + listing.type.slice(1);
  el("category").textContent = catName(listing.category);
  el("state").textContent = stateName(listing.state);
  el("city").textContent = listing.city || "Online";
  el("serviceArea").textContent = listing.service_area || "Not provided";
  el("priceModel").textContent = listing.price_model || "Not provided";

  // Badges
  var badges = el("badges");
  badges.innerHTML = "";
  var b = document.createElement("span");
  b.className = "badge " + listing.plan;
  b.textContent = listing.plan.toUpperCase();
  badges.appendChild(b);

  // Credentials
  var creds = el("credentials");
  creds.innerHTML = "";
  var credList = listing.credentials || [];
  if (credList.length) {
    for (var i = 0; i < credList.length; i++) {
      var li = document.createElement("li");
      li.textContent = credList[i];
      creds.appendChild(li);
    }
  } else {
    var li2 = document.createElement("li");
    li2.textContent = "No credentials provided";
    creds.appendChild(li2);
  }

  // Offerings
  var off = el("offerings");
  off.innerHTML = "";
  var offerings = listing.offerings || [];
  for (var j = 0; j < offerings.length; j++) {
    var chip = document.createElement("li");
    chip.textContent = offerings[j];
    off.appendChild(chip);
  }

  // Contact info
  var phone = listing.phone || "";
  var email = listing.email || "";
  var site = listing.website || "";
  var address = listing.address || "";

  el("phone").textContent = phone || "Not provided";
  el("email").textContent = email || "Not provided";
  el("address").textContent = address || "Not provided";

  // Phone button
  var phoneBtn = el("phoneBtn");
  phoneBtn.href = phone ? "tel:" + phone : "#";
  phoneBtn.setAttribute("aria-disabled", phone ? "false" : "true");
  if (!phone) phoneBtn.classList.add("btn-ghost");

  // Website button
  var siteBtn = el("siteBtn");
  siteBtn.href = site || "#";
  siteBtn.style.display = site ? "inline-flex" : "none";

  // Map button
  var mapBtn = el("mapBtn");
  var mapQ = encodeURIComponent([address, listing.city, listing.state].filter(Boolean).join(", "));
  mapBtn.href = mapQ ? "https://www.google.com/maps/search/?api=1&query=" + mapQ : "#";

  // Back link
  var backRow = el("backRow");
  backRow.innerHTML = '<a class="text-link" href="directory.html">&larr; Back to directory</a>';

  // JSON-LD Schema
  var schema = {
    "@context": "https://schema.org",
    "@type": listing.type === "product" ? "Store" : "LocalBusiness",
    "name": listing.name,
    "description": listing.tagline || "",
    "url": site || DOMAIN + "/listing.html?id=" + encodeURIComponent(listing.id),
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
    "keywords": offerings.join(", ")
  };

  var schemaClean = JSON.parse(JSON.stringify(schema));

  // Display schema preview
  var schemaBox = el("schemaBox");
  if (schemaBox) schemaBox.textContent = JSON.stringify(schemaClean, null, 2);

  // Inject JSON-LD
  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify(schemaClean);
  document.head.appendChild(ld);

  // SEO updates
  var title = listing.name + " — " + catName(listing.category) + " in " + stateName(listing.state) + " | Falconry Directory USA";
  var desc = listing.name + ". " + catName(listing.category) + " in " + stateName(listing.state) + ". Contact info, credentials, and offerings.";

  window.FD.seo.setTitle(title);
  window.FD.seo.setMetaDescription(desc);
  window.FD.seo.setCanonical(DOMAIN + "/listing.html?id=" + encodeURIComponent(listing.id));
})();
