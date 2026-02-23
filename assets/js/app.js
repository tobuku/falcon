(function () {
  "use strict";

  // Year in footer
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // Query string helper
  function qs(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name) || "";
  }

  // Populate a <select> from an array of {value, label}
  function setSelectOptions(select, options, placeholder) {
    if (!select) return;
    select.innerHTML = "";
    var first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder || "All";
    select.appendChild(first);
    for (var i = 0; i < options.length; i++) {
      var o = document.createElement("option");
      o.value = options[i].value;
      o.textContent = options[i].label;
      select.appendChild(o);
    }
  }

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("navMenu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Populate home page selects from JSON
  var stateSelect = document.getElementById("stateSelect");
  var catSelect = document.getElementById("catSelect");
  var topCats = document.getElementById("topCats");
  var topStates = document.getElementById("topStates");
  var stateMap = document.getElementById("stateMap");

  if (stateSelect || catSelect || topCats || topStates || stateMap) {
    Promise.all([
      fetch("data/states.json").then(function (r) { return r.json(); }),
      fetch("data/categories.json").then(function (r) { return r.json(); })
    ]).then(function (data) {
      var states = data[0];
      var cats = data[1];

      if (stateSelect) {
        setSelectOptions(stateSelect, states.map(function (s) { return { value: s.code, label: s.name }; }), "All states");
      }
      if (catSelect) {
        setSelectOptions(catSelect, cats.map(function (c) { return { value: c.slug, label: c.name }; }), "All categories");
      }

      // Top categories sidebar
      if (topCats) {
        var picks = cats.slice(0, 8);
        topCats.innerHTML = "";
        for (var i = 0; i < picks.length; i++) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "directory.html?cat=" + encodeURIComponent(picks[i].slug);
          a.textContent = picks[i].name;
          li.appendChild(a);
          topCats.appendChild(li);
        }
      }

      // Popular states sidebar
      if (topStates) {
        var popular = ["TX", "CA", "AZ", "CO", "MT", "PA", "FL", "NY", "OR", "ID"];
        topStates.innerHTML = "";
        for (var j = 0; j < popular.length; j++) {
          var st = states.find(function (s) { return s.code === popular[j]; });
          if (!st) continue;
          var li2 = document.createElement("li");
          var a2 = document.createElement("a");
          a2.href = "directory.html?state=" + encodeURIComponent(st.code);
          a2.textContent = st.name;
          li2.appendChild(a2);
          topStates.appendChild(li2);
        }
      }

      // State map on homepage
      if (stateMap) {
        stateMap.innerHTML = "";
        for (var k = 0; k < states.length; k++) {
          var a3 = document.createElement("a");
          a3.className = "map-item";
          a3.href = "directory.html?state=" + encodeURIComponent(states[k].code);
          a3.textContent = states[k].name;
          stateMap.appendChild(a3);
        }
      }
    });
  }

  // Expose globals
  window.FD = window.FD || {};
  window.FD.qs = qs;
  window.FD.setSelectOptions = setSelectOptions;
})();
