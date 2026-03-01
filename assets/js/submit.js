(async function () {
  "use strict";

  var form = document.getElementById("submitForm");
  var status = document.getElementById("statusMsg");
  var catSelect = document.getElementById("categorySelect");
  var stateSelect = document.getElementById("stateSelect");

  var data = await Promise.all([
    fetch("data/categories.json").then(function (r) { return r.json(); }),
    fetch("data/states.json").then(function (r) { return r.json(); })
  ]);

  var cats = data[0];
  var states = data[1];

  catSelect.innerHTML = '<option value="">Select category</option>' +
    cats.map(function (c) { return '<option value="' + c.slug + '">' + c.name + '</option>'; }).join("");
  stateSelect.innerHTML = '<option value="">Select state</option>' +
    states.map(function (s) { return '<option value="' + s.code + '">' + s.name + '</option>'; }).join("");

  function requiredOk() {
    var req = ["name", "type", "category", "state"];
    for (var i = 0; i < req.length; i++) {
      var el = form.querySelector('[name="' + req[i] + '"]');
      if (!el || !String(el.value || "").trim()) return false;
    }
    return true;
  }

  function generateId() {
    return "fd-" + String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  }

  function toPayload() {
    var fd = new FormData(form);
    var offerings = String(fd.get("offerings") || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);

    var credentials = [];
    var permit = String(fd.get("permitStatus") || "").trim();
    var years = String(fd.get("years") || "").trim();
    if (permit) credentials.push(permit);
    if (years) credentials.push(years + " years in practice");

    var now = new Date().toISOString().slice(0, 10);

    return {
      id: generateId(),
      name: String(fd.get("name") || "").trim(),
      type: String(fd.get("type") || "").trim(),
      category: String(fd.get("category") || "").trim(),
      tagline: String(fd.get("tagline") || "").trim(),
      state: String(fd.get("state") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      service_area: String(fd.get("serviceArea") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      website: String(fd.get("website") || "").trim(),
      price_model: "quote",
      plan: String(fd.get("plan") || "free").trim(),
      credentials: credentials,
      offerings: offerings,
      created_at: now,
      updated_at: now
    };
  }

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!requiredOk()) {
      status.textContent = "Missing required fields: name, type, category, and state.";
      status.style.color = "var(--danger)";
      return;
    }

    var payload = toPayload();
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Submitting...";
    status.textContent = "";

    fetch("https://formspree.io/f/xjgedyzo", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.ok) {
        status.textContent = "Listing submitted! We'll review it and add it to the directory.";
        status.style.color = "var(--success)";
        form.reset();
      } else {
        throw new Error("Server error");
      }
    }).catch(function () {
      status.textContent = "Something went wrong. Please try again or contact us directly.";
      status.style.color = "var(--danger)";
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = "Submit Listing";
    });
  });
})();
