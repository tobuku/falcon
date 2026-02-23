(async function () {
  "use strict";

  var DOMAIN = "https://falconrydirectory.com";
  var url = new URL(window.location.href);
  var stateCode = (url.searchParams.get("state") || "").toUpperCase();

  if (!stateCode) {
    document.getElementById("stateTitle").textContent = "Select a State";
    document.getElementById("stateIntro").textContent = "Choose a state from the homepage to view falconry info, listings, and permit details.";
    return;
  }

  var data = await Promise.all([
    fetch("data/state-content.json").then(function (r) { return r.json(); }),
    fetch("data/categories.json").then(function (r) { return r.json(); }),
    fetch("data/listings.sample.json").then(function (r) { return r.json(); }),
    fetch("data/states.json").then(function (r) { return r.json(); })
  ]);

  var stateContent = data[0];
  var cats = data[1];
  var listings = data[2];
  var states = data[3];

  var stateInfo = stateContent.find(function (s) { return s.code === stateCode; });
  var stateObj = states.find(function (s) { return s.code === stateCode; });

  if (!stateInfo || !stateObj) {
    document.getElementById("stateTitle").textContent = "State Not Found";
    document.getElementById("stateIntro").textContent = "We couldn't find information for that state code. Please select a state from the homepage.";
    return;
  }

  var stateName = stateObj.name;

  // Page title and intro
  document.getElementById("stateTitle").textContent = "Falconry in " + stateName;
  document.getElementById("stateIntro").textContent = stateInfo.intro;

  // Stats
  var stateListings = listings.filter(function (l) { return l.state === stateCode; });
  var statsEl = document.getElementById("stateStats");
  statsEl.innerHTML =
    '<div class="landing-stat"><div class="stat-value">' + stateListings.length + '</div><div class="stat-label">Listings</div></div>' +
    '<div class="landing-stat"><div class="stat-value">' + cats.length + '</div><div class="stat-label">Categories</div></div>' +
    '<div class="landing-stat"><div class="stat-value">3</div><div class="stat-label">Permit Levels</div></div>';

  // Permit info
  document.getElementById("stateAgency").textContent = stateInfo.agency;
  document.getElementById("stateLevels").textContent = stateInfo.permit_levels;
  document.getElementById("stateSpecies").textContent = (stateInfo.popular_species || []).join(", ");

  // Category grid
  var catTitle = document.getElementById("catTitle");
  catTitle.textContent = "Browse Falconry Services & Gear in " + stateName;

  var catGrid = document.getElementById("catGrid");
  catGrid.innerHTML = "";
  for (var i = 0; i < cats.length; i++) {
    var a = document.createElement("a");
    a.className = "category-link";
    a.href = "directory.html?state=" + encodeURIComponent(stateCode) + "&cat=" + encodeURIComponent(cats[i].slug);
    a.textContent = cats[i].name;
    catGrid.appendChild(a);
  }

  // Listings for this state
  var listingsTitle = document.getElementById("listingsTitle");
  listingsTitle.textContent = "Listings in " + stateName;

  var listingsEl = document.getElementById("stateListings");
  listingsEl.innerHTML = "";

  if (stateListings.length === 0) {
    listingsEl.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:32px">' +
      '<h3>No listings yet for ' + stateName + '</h3>' +
      '<p class="fineprint">Be the first to add a listing in ' + stateName + '.</p>' +
      '<a class="btn" href="submit.html" style="margin-top:12px">Add Your Business</a></div>';
  } else {
    var show = stateListings.slice(0, 6);
    for (var j = 0; j < show.length; j++) {
      var l = show[j];
      var card = document.createElement("article");
      card.className = "card result-card";

      var catName = (cats.find(function (c) { return c.slug === l.category; }) || {}).name || l.category;
      var typeName = l.type === "service" ? "Service" : l.type === "product" ? "Product" : "Organization";

      card.innerHTML =
        '<div class="result-head"><div>' +
        '<h3 style="margin:0;font-size:1.05rem"><a class="text-link" href="listing.html?id=' + encodeURIComponent(l.id) + '">' + l.name + '</a></h3>' +
        '<p class="fineprint" style="margin-top:4px">' + (l.city || "Online") + ', ' + l.state + ' &middot; ' + catName + ' &middot; ' + typeName + '</p>' +
        '</div><div class="badges"><span class="badge ' + l.plan + '">' + l.plan.toUpperCase() + '</span></div></div>' +
        (l.tagline ? '<p style="margin:0;font-size:.9rem;color:var(--text-muted)">' + l.tagline + '</p>' : '') +
        '<div class="card-actions"><a class="btn btn-small" href="listing.html?id=' + encodeURIComponent(l.id) + '">View Details</a></div>';

      listingsEl.appendChild(card);
    }
  }

  // View all button
  document.getElementById("viewAllBtn").href = "directory.html?state=" + encodeURIComponent(stateCode);

  // Neighbor states
  var neighborEl = document.getElementById("neighborStates");
  neighborEl.innerHTML = "";
  var neighbors = stateInfo.neighbors || [];
  for (var k = 0; k < neighbors.length; k++) {
    var nState = states.find(function (s) { return s.code === neighbors[k]; });
    if (!nState) continue;
    var li = document.createElement("li");
    var link = document.createElement("a");
    link.href = "state.html?state=" + encodeURIComponent(nState.code);
    link.textContent = nState.name;
    li.appendChild(link);
    neighborEl.appendChild(li);
  }

  // SEO updates
  var title = "Falconry in " + stateName + " | Schools, Gear, Breeders & Services";
  var desc = "Find falconry schools, breeders, gear sellers, abatement providers, and raptor vets in " + stateName + ". " + stateInfo.intro;

  window.FD.seo.setTitle(title);
  window.FD.seo.setMetaDescription(desc);
  window.FD.seo.setCanonical(DOMAIN + "/state.html?state=" + stateCode);
})();
