#!/usr/bin/env python3
"""
Build static listing pages for FalconryDirectory.com

Usage:
  python build_listings.py

Generates:
  - /listings/{slug}/index.html  (one per listing, fully baked-in HTML for SEO)
  - Adds/updates 'slug' field in data/listings.json
  - Updates sitemap.xml with all listing URLs
"""

import html as html_mod
import json
import re
import shutil
import urllib.parse
from datetime import date
from pathlib import Path

BASE         = Path(__file__).parent
DATA         = BASE / "data"
LISTINGS_DIR = BASE / "listings"
DOMAIN       = "https://falconrydirectory.com"
YEAR         = date.today().year
SITEMAP_MARKER = "  <!-- Listing pages (auto-generated) -->"


# ---------------------------------------------------------------------------
# Slug helpers
# ---------------------------------------------------------------------------

def slugify(text):
    s = str(text or "").lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def assign_slugs(listings):
    """Generate name-state slugs; fall back to name-state-city or name-state-N on collision."""
    seen = set()
    for listing in listings:
        base = slugify(listing["name"]) + "-" + listing["state"].lower()
        if base not in seen:
            seen.add(base)
            listing["slug"] = base
            continue
        # First collision: append city
        city = slugify(listing.get("city") or "")
        candidate = (base + "-" + city) if city else (base + "-2")
        if candidate not in seen:
            seen.add(candidate)
            listing["slug"] = candidate
            continue
        # Numbered fallback
        n = 2
        while True:
            candidate = base + "-" + str(n)
            if candidate not in seen:
                seen.add(candidate)
                listing["slug"] = candidate
                break
            n += 1
    return listings


# ---------------------------------------------------------------------------
# HTML rendering
# ---------------------------------------------------------------------------

def esc(val):
    return html_mod.escape(str(val or ""))


def render_page(listing, cats, states):
    cat_name   = next((c["name"] for c in cats   if c["slug"] == listing["category"]), listing["category"])
    state_name = next((s["name"] for s in states if s["code"] == listing["state"]),    listing["state"])
    slug       = listing["slug"]
    canonical  = f"{DOMAIN}/listings/{slug}/"

    name         = listing["name"]
    tagline      = listing.get("tagline") or ""
    phone        = listing.get("phone") or ""
    email        = listing.get("email") or ""
    address      = listing.get("address") or ""
    website      = listing.get("website") or ""
    service_area = listing.get("service_area") or "Not provided"
    city_display = listing.get("city") or "Online"
    price_model  = listing.get("price_model") or "Not provided"
    plan         = listing.get("plan") or "free"
    ltype        = listing.get("type") or "service"

    title     = f"{name} - {cat_name} in {state_name} | Falconry Directory USA"
    meta_desc = f"{name}. {tagline} {cat_name} in {state_name}. Falconry Directory USA.".strip()
    meta_desc = meta_desc[:160]

    # Credentials
    cred_html = ""
    for c in (listing.get("credentials") or []):
        cred_html += f"              <li>{esc(c)}</li>\n"
    if not cred_html:
        cred_html = "              <li>No credentials provided</li>\n"

    # Offerings
    offer_html = ""
    for o in (listing.get("offerings") or []):
        offer_html += f"              <li>{esc(o)}</li>\n"

    # Call button
    phone_class    = "btn" if phone else "btn btn-ghost"
    phone_disabled = "" if phone else ' aria-disabled="true"'
    phone_href     = f"tel:{phone}" if phone else "#"

    # Website button
    site_href  = esc(website) if website else "#"
    site_style = "" if website else ' style="display:none"'

    # Map link
    map_parts = [p for p in [address, listing.get("city"), listing.get("state")] if p]
    map_q     = urllib.parse.quote_plus(", ".join(map_parts)) if map_parts else ""
    map_href  = f"https://www.google.com/maps/search/?api=1&query={map_q}" if map_q else "#"

    # JSON-LD schema
    schema = {
        "@context":    "https://schema.org",
        "@type":       "Store" if ltype == "product" else "LocalBusiness",
        "name":        name,
        "description": tagline,
        "url":         website or canonical,
    }
    if phone:   schema["telephone"] = phone
    if email:   schema["email"]     = email
    if address:
        schema["address"] = {
            "@type":          "PostalAddress",
            "streetAddress":  address,
            "addressLocality": listing.get("city") or "",
            "addressRegion":  listing.get("state") or "",
            "addressCountry": "US",
        }
    if listing.get("service_area"):
        schema["areaServed"] = listing["service_area"]
    if listing.get("offerings"):
        schema["keywords"] = ", ".join(listing["offerings"])

    schema_json = json.dumps(schema, indent=2)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(meta_desc)}" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:title" content="{esc(name)} - Falconry Directory USA" />
  <meta property="og:description" content="{esc(meta_desc)}" />
  <meta property="og:type" content="website" />
  <link rel="icon" href="/assets/img/transparent-logo.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/css/styles.css" />
  <script defer src="/assets/js/app.js"></script>
  <script type="application/ld+json">
{schema_json}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <div class="container header-row">
      <a class="brand brand-has-banner" href="/" aria-label="Falconry Directory USA Home">
        <img class="brand-logo" src="/assets/img/logo-banner-type-falcon.jpg" alt="Falconry Directory" height="44" />
        <span class="brand-text">Falconry Directory USA</span>
      </a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
      <nav class="nav" id="navMenu">
        <a href="/directory.html">Directory</a>
        <a href="/submit.html">Add Listing</a>
        <a href="/blog.html">Guides</a>
        <a href="/about.html">About</a>
      </nav>
    </div>
  </header>

  <main id="main" class="section">
    <div class="container">
      <div class="back-row">
        <a class="text-link" href="/directory.html">&larr; Back to directory</a>
      </div>

      <article class="listing">
        <header class="listing-head">
          <div>
            <h1>{esc(name)}</h1>
            <p class="lede">{esc(tagline)}</p>
            <div class="badges">
              <span class="badge {esc(plan)}">{esc(plan.upper())}</span>
            </div>
          </div>
          <div class="listing-cta">
            <a class="{phone_class}"{phone_disabled} href="{phone_href}">Call</a>
            <a class="btn btn-ghost" href="{site_href}" target="_blank" rel="noopener"{site_style}>Website</a>
          </div>
        </header>

        <div class="listing-grid">
          <section class="card">
            <h2>Details</h2>
            <dl class="dl">
              <div><dt>Type</dt><dd>{esc(ltype.capitalize())}</dd></div>
              <div><dt>Category</dt><dd>{esc(cat_name)}</dd></div>
              <div><dt>State</dt><dd>{esc(state_name)}</dd></div>
              <div><dt>City</dt><dd>{esc(city_display)}</dd></div>
              <div><dt>Service Area</dt><dd>{esc(service_area)}</dd></div>
              <div><dt>Price Model</dt><dd>{esc(price_model)}</dd></div>
            </dl>
          </section>

          <section class="card">
            <h2>Credentials</h2>
            <ul class="bullets">
{cred_html}            </ul>
            <p class="fineprint" style="margin-top:10px">Permit data should be verified with the state wildlife agency.</p>
          </section>

          <section class="card">
            <h2>Services &amp; Products</h2>
            <ul class="chips">
{offer_html}            </ul>
          </section>

          <section class="card">
            <h2>Contact</h2>
            <div class="contact">
              <div><span class="label-inline">Phone</span> <span>{esc(phone or "Not provided")}</span></div>
              <div><span class="label-inline">Email</span> <span>{esc(email or "Not provided")}</span></div>
              <div><span class="label-inline">Address</span> <span>{esc(address or "Not provided")}</span></div>
            </div>
            <div class="card-actions">
              <a class="btn btn-small btn-ghost" href="{map_href}" target="_blank" rel="noopener">View on Map</a>
              <a class="btn btn-small btn-ghost" href="/contact.html?reason=report">Report Listing</a>
            </div>
          </section>
        </div>

        <div class="claim-cta">
          <h3>Is this your business?</h3>
          <p>Claim this listing to update your info, add credentials, and reach falconers searching for your services.</p>
          <a class="btn" href="/submit.html">Claim This Listing</a>
        </div>
      </article>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="brand footer-brand">
          <img class="brand-logo" src="/assets/img/logo-banner-type-falcon.jpg" alt="Falconry Directory" height="44" />
          <span class="brand-text">Falconry Directory USA</span>
        </div>
        <p class="footer-slogan">Everything falconry. One place.</p>
      </div>
      <div>
        <div class="footer-title">Directory</div>
        <a href="/directory.html?type=service">Services</a>
        <a href="/directory.html?type=product">Products</a>
        <a href="/submit.html">Add Listing</a>
      </div>
      <div>
        <div class="footer-title">Company</div>
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
        <a href="/blog.html">Guides</a>
      </div>
      <div>
        <div class="footer-title">Legal</div>
        <a href="/legal/terms.html">Terms</a>
        <a href="/legal/privacy.html">Privacy</a>
        <a href="/legal/disclaimer.html">Disclaimer</a>
      </div>
    </div>
    <div class="container footer-bottom">
      &copy; {YEAR} Falconry Directory USA &middot; falconrydirectory.com
    </div>
  </footer>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Sitemap
# ---------------------------------------------------------------------------

def update_sitemap(listings):
    path    = BASE / "sitemap.xml"
    content = path.read_text(encoding="utf-8")

    # Strip any previously generated listing section so rebuilds are idempotent
    if SITEMAP_MARKER in content:
        content = content[: content.index(SITEMAP_MARKER)].rstrip() + "\n</urlset>\n"

    # Build listing entries sorted by slug for determinism
    entries = ""
    for l in sorted(listings, key=lambda x: x["slug"]):
        entries += f'  <url><loc>{DOMAIN}/listings/{l["slug"]}/</loc><priority>0.6</priority></url>\n'

    new_content = content.replace(
        "</urlset>",
        f"{SITEMAP_MARKER}\n{entries}</urlset>",
    )
    path.write_text(new_content, encoding="utf-8")
    print(f"  sitemap.xml   -{len(listings)} listing URLs added")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Loading data...")
    listings = json.loads((DATA / "listings.json").read_text(encoding="utf-8"))
    cats     = json.loads((DATA / "categories.json").read_text(encoding="utf-8"))
    states   = json.loads((DATA / "states.json").read_text(encoding="utf-8"))

    print("Assigning slugs...")
    assign_slugs(listings)

    # Persist slugs back to listings.json
    (DATA / "listings.json").write_text(
        json.dumps(listings, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"  listings.json -slug fields written ({len(listings)} listings)")

    # Rebuild /listings/ directory from scratch
    print("Generating listing pages...")
    if LISTINGS_DIR.exists():
        shutil.rmtree(LISTINGS_DIR)
    LISTINGS_DIR.mkdir()

    for listing in listings:
        out_dir = LISTINGS_DIR / listing["slug"]
        out_dir.mkdir()
        (out_dir / "index.html").write_text(
            render_page(listing, cats, states),
            encoding="utf-8",
        )
    print(f"  listings/     -{len(listings)} pages generated")

    print("Updating sitemap...")
    update_sitemap(listings)

    print("\nBuild complete.")


if __name__ == "__main__":
    main()
