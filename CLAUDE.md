# FalconryDirectory.com — Project Brief

## Site
**URL:** falconrydirectory.com
**Host:** GitHub Pages (repo: github.com/tobuku/falcon, branch: main)
**Stack:** Fully static HTML — no framework, no build server

---

## Architecture

### Data
| File | Purpose |
|---|---|
| `data/listings.json` | All directory listings. Each entry has `id`, `slug`, and standard fields. |
| `data/categories.json` | 16 categories across Services and Products groups |
| `data/states.json` | All 50 US states + DC |

### Pages
| Path | Purpose |
|---|---|
| `index.html` | Homepage |
| `directory.html` | Filterable directory (JS-rendered from listings.json) |
| `listings/{slug}/index.html` | Individual listing pages — fully static, SEO-optimized, baked at build time |
| `listing.html` | Redirect fallback for old `?id=UUID` links — marked `noindex` |
| `resources/*.html` | 11 SEO content/resource pages |
| `categories/*.html` | 16 category landing pages |
| `services/*.html` | 4 service landing pages |
| `assets/js/directory.js` | Directory filtering, pagination, card rendering |
| `assets/js/listing.js` | Redirect: `?id=UUID` → `/listings/{slug}/` |

---

## Build System

**Run after any change to `data/listings.json`:**
```bash
python build_listings.py
```

What it does:
1. Assigns `name-state` slugs to all listings (e.g. `west-coast-falconry-ca`)
2. Regenerates all `/listings/{slug}/index.html` with baked-in title, meta, canonical, JSON-LD
3. Updates `sitemap.xml` with all listing URLs

**Do NOT manually add `slug` fields to listings.json** — the build script generates them.

---

## Adding a New Listing

1. Append the new entry to `data/listings.json` (no `slug` field needed)
2. Run `python build_listings.py`
3. Commit: `data/listings.json`, `listings/`, `sitemap.xml`
4. Push to main

### Slug format
`{name-in-kebab-case}-{state-code}` → `falconrylab-nv`
Collision fallback: append city slug, then `-2`, `-3`...

---

## GSC (Google Search Console)

```bash
python gsc_automation.py --report all --days 28
```

Credentials: `.gsc-credentials/laptoplane-blogspot-autoposter-c7da82883623.json`
Property: `sc-domain:falconrydirectory.com`

---

## SEO Notes
- **`/resources/falconry-rules-by-state.html`** — highest-traffic page (1,697 impressions, pos 5.6 as of 2026-03-14). Watch CTR.
- **71 listing pages** were first published 2026-03-14. None were indexed before (old `?id=UUID` URLs were never crawled). Expect indexing to begin within 2–4 weeks.
- `state.html` and `state-category.html` are JS templates — excluded from sitemap intentionally (thin content at bare URL).

---

## Form Submissions
New listing requests arrive via Formspree endpoint `xjgedyzo`.
Manually extract fields → add to `listings.json` → build → push.
