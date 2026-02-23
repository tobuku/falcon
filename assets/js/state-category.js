(async function () {
  "use strict";

  var DOMAIN = "https://falconrydirectory.com";
  var url = new URL(window.location.href);
  var stateCode = (url.searchParams.get("state") || "").toUpperCase();
  var catSlug = url.searchParams.get("cat") || "";

  var data = await Promise.all([
    fetch("data/states.json").then(function (r) { return r.json(); }),
    fetch("data/categories.json").then(function (r) { return r.json(); }),
    fetch("data/listings.sample.json").then(function (r) { return r.json(); })
  ]);

  var states = data[0];
  var cats = data[1];
  var listings = data[2];

  var stateObj = states.find(function (s) { return s.code === stateCode; });
  var catObj = cats.find(function (c) { return c.slug === catSlug; });

  if (!stateObj || !catObj) {
    document.getElementById("pageTitle").textContent = "Page Not Found";
    document.getElementById("pageIntro").textContent = "Invalid state or category combination.";
    return;
  }

  var stateName = stateObj.name;
  var catName = catObj.name;

  // Breadcrumb
  document.getElementById("breadcrumb").innerHTML =
    '<a class="text-link" href="./">Home</a> &rarr; ' +
    '<a class="text-link" href="state.html?state=' + stateCode + '">' + stateName + '</a> &rarr; ' +
    catName;

  // Title and intro
  document.getElementById("pageTitle").textContent = catName + " in " + stateName;
  document.getElementById("pageIntro").textContent =
    "Browse " + catName.toLowerCase() + " listings in " + stateName + ". " +
    "Find providers, view credentials, and get contact information.";

  // Filtered listings
  var filtered = listings.filter(function (l) {
    return l.state === stateCode && l.category === catSlug;
  });

  var listingsTitle = document.getElementById("listingsTitle");
  listingsTitle.textContent = catName + " in " + stateName + " (" + filtered.length + " listing" + (filtered.length !== 1 ? "s" : "") + ")";

  var listingsEl = document.getElementById("comboListings");
  listingsEl.innerHTML = "";

  if (filtered.length === 0) {
    listingsEl.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:32px">' +
      '<h3>No ' + catName.toLowerCase() + ' listings in ' + stateName + ' yet</h3>' +
      '<p class="fineprint">Be the first to list your business here.</p>' +
      '<a class="btn" href="submit.html" style="margin-top:12px">Add Your Business</a></div>';
  } else {
    for (var i = 0; i < filtered.length; i++) {
      var l = filtered[i];
      var card = document.createElement("article");
      card.className = "card result-card";
      var typeName = l.type === "service" ? "Service" : l.type === "product" ? "Product" : "Organization";
      card.innerHTML =
        '<div class="result-head"><div>' +
        '<h3 style="margin:0;font-size:1.05rem"><a class="text-link" href="listing.html?id=' + encodeURIComponent(l.id) + '">' + l.name + '</a></h3>' +
        '<p class="fineprint" style="margin-top:4px">' + (l.city || "Online") + ', ' + l.state + ' &middot; ' + typeName + '</p>' +
        '</div><div class="badges"><span class="badge ' + l.plan + '">' + l.plan.toUpperCase() + '</span></div></div>' +
        (l.tagline ? '<p style="margin:0;font-size:.9rem;color:var(--text-muted)">' + l.tagline + '</p>' : '') +
        '<div class="card-actions"><a class="btn btn-small" href="listing.html?id=' + encodeURIComponent(l.id) + '">View Details</a></div>';
      listingsEl.appendChild(card);
    }
  }

  // View all in directory link
  document.getElementById("viewAllBtn").href = "directory.html?state=" + stateCode + "&cat=" + catSlug;

  // Other categories in this state
  document.getElementById("otherCatsTitle").textContent = "Other Categories in " + stateName;
  var otherCats = document.getElementById("otherCats");
  otherCats.innerHTML = "";
  for (var j = 0; j < cats.length; j++) {
    if (cats[j].slug === catSlug) continue;
    var a = document.createElement("a");
    a.className = "category-link";
    a.href = "state-category.html?state=" + stateCode + "&cat=" + cats[j].slug;
    a.textContent = cats[j].name;
    otherCats.appendChild(a);
  }

  // Other states for this category
  document.getElementById("otherStatesTitle").textContent = catName + " in Other States";
  var otherStates = document.getElementById("otherStates");
  otherStates.innerHTML = "";
  var topStates = ["TX", "CA", "AZ", "CO", "MT", "PA", "FL", "NY", "OR", "ID", "WA", "OH"];
  for (var k = 0; k < topStates.length; k++) {
    if (topStates[k] === stateCode) continue;
    var st = states.find(function (s) { return s.code === topStates[k]; });
    if (!st) continue;
    var li = document.createElement("li");
    var link = document.createElement("a");
    link.href = "state-category.html?state=" + st.code + "&cat=" + catSlug;
    link.textContent = st.name;
    li.appendChild(link);
    otherStates.appendChild(li);
  }

  // SEO text block
  document.getElementById("seoTitle").textContent = catName + " in " + stateName;
  document.getElementById("seoText").textContent =
    "Looking for " + catName.toLowerCase() + " in " + stateName + "? " +
    "Falconry Directory USA lists verified providers and sellers across every state. " +
    "Each listing includes contact information, credentials, service areas, and offerings. " +
    "Use our directory to compare options and find the right " + catName.toLowerCase() + " for your needs.";

  // SEO meta updates
  var title = catName + " in " + stateName + " | Falconry Directory USA";
  var desc = "Find " + catName.toLowerCase() + " in " + stateName + ". Browse " + filtered.length + " listings with contact info, credentials, and service areas.";

  window.FD.seo.setTitle(title);
  window.FD.seo.setMetaDescription(desc);
  window.FD.seo.setCanonical(DOMAIN + "/state-category.html?state=" + stateCode + "&cat=" + catSlug);
})();
