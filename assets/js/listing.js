(async function () {
  "use strict";
  var id = new URL(window.location.href).searchParams.get("id") || "";
  if (!id) { window.location.replace("/directory.html"); return; }
  var listings = await fetch("/data/listings.json").then(function (r) { return r.json(); });
  var listing = listings.find(function (x) { return x.id === id; });
  if (listing && listing.slug) {
    window.location.replace("/listings/" + listing.slug + "/");
  } else {
    window.location.replace("/directory.html");
  }
})();
