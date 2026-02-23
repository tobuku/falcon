(function () {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  function qs(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || "";
  }

  function setSelectOptions(select, options, placeholder) {
    if (!select) return;
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder || "All";
    select.appendChild(first);

    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      select.appendChild(o);
    }
  }

  window.FD = window.FD || {};
  window.FD.qs = qs;
  window.FD.setSelectOptions = setSelectOptions;
})();
