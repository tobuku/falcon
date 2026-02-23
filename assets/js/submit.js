(async function () {
  const form = document.getElementById("submitForm");
  const status = document.getElementById("statusMsg");
  const catSelect = document.getElementById("categorySelect");
  const stateSelect = document.getElementById("stateSelect");

  const [cats, states] = await Promise.all([
    fetch("/data/categories.json").then(r => r.json()),
    fetch("/data/states.json").then(r => r.json())
  ]);

  catSelect.innerHTML = `<option value="">Select</option>` + cats.map(c => `<option value="${c.slug}">${c.name}</option>`).join("");
  stateSelect.innerHTML = `<option value="">Select</option>` + states.map(s => `<option value="${s.code}">${s.name}</option>`).join("");

  function requiredOk() {
    const req = ["name", "type", "category", "state"];
    for (const k of req) {
      const el = form.querySelector(`[name="${k}"]`);
      if (!el || !String(el.value || "").trim()) return false;
    }
    return true;
  }

  function toPayload() {
    const fd = new FormData(form);
    const offerings = String(fd.get("offerings") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    return {
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
      permit_status: String(fd.get("permitStatus") || "").trim(),
      years: String(fd.get("years") || "").trim(),
      offerings,
      plan: String(fd.get("plan") || "free").trim(),
      created_at: new Date().toISOString().slice(0, 10)
    };
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!requiredOk()) {
      status.textContent = "Missing required fields. Name, type, category, state.";
      return;
    }

    const payload = toPayload();
    const out = JSON.stringify(payload, null, 2);

    status.textContent = "Saved to clipboard. Paste into your backend intake or a spreadsheet.";
    navigator.clipboard.writeText(out).catch(() => {});
  });
})();
