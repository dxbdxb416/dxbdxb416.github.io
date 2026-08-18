# D3 Site Rebuild — Phase 1: Jekyll Architecture & Core Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-file "bundled" D3 export with a real, deployable, bilingual (AR/EN) Jekyll site on GitHub Pages: shared chrome AND shared body templates driven by data files, a homepage and 5 service pages in both languages, correct per-page SEO metadata (title/description/canonical/hreflang/OG/Twitter/JSON-LD), and no React/mustache-template dependency.

**Architecture:** Static Jekyll site (GitHub Pages' native build). One `_layouts/page.html` shell + `_includes/*` partials for nav/footer/head-SEO/schema/CTA/disclaimer — all language-aware via `_data/i18n.yml`, not inline hardcoded strings. **Every page's body content is also templated, not duplicated:** `_includes/home-body.html` and `_includes/service-body.html` render from `_data/home.yml` and `_data/services.yml` (each keyed `ar:`/`en:`), so all 12 page files (`ar/index.md`, `en/index.md`, and the 5 service-page pairs) collapse to front matter + a single `{% include %}` call — there is no hand-duplicated HTML per language anywhere in this plan. Root `/` is a static (non-Jekyll-layout) redirect page defaulting to `/ar/`. No JavaScript framework — a ~20-line vanilla JS file drives the one remaining interactive widget (the tools/stack category tabs on the homepage).

**Tech Stack:** Jekyll 4.4.1, Ruby 3.3.8, Bundler 4.0.18 (all installed locally in this environment — verify with `jekyll -v` before starting). `github-pages` gem for plugin parity with GitHub's build servers.

**Spec:** `docs/superpowers/specs/2026-08-16-d3-site-rebuild.md` — read this first. It has the full SEO brief, the complete bilingual copy inventory (§3), and the architecture decisions (§4) this plan implements. Extracted source assets (logos, fonts, original bundle, unpacked template for cross-reference) live at `docs/superpowers/specs/assets/d3-bundle-extract/`. **Also read** `docs/superpowers/specs/2026-08-16-d3-keyword-audit.md` — the resolved primary/secondary keyword assignment for all 12 pages that `_data/services.yml`/`_data/home.yml` implement, and that Task 8 verifies.

## Global Constraints

(From the spec's SEO brief — every task below implicitly must satisfy these.)

- Never use the strings `Zoho Partner`, `Authorized Partner`, `Certified Partner`, `شريك معتمد`, `وكيل معتمد` anywhere in content. Use `implementation services` / `consultant` / `خدمات إعداد وتنفيذ` / `استشاري` instead.
- Every vendor/tool logo grid must have the vendor disclaimer (`_includes/vendor-disclaimer.html`) directly beneath it.
- Arabic and English are separate routes (`/ar/...`, `/en/...`) — never both languages in one DOM with `display:none`.
- Exactly one `<h1>` per rendered page.
- `<html lang="ar" dir="rtl">` on every `/ar/` page, `<html lang="en" dir="ltr">` on every `/en/` page.
- Every page: self-referencing canonical + the full 4-entry hreflang set (ar-AE, ar-SA, en-AE, x-default→ar).
- Lowercase, hyphenated URLs, no query params.
- Titles ≤60 chars (~55 for Arabic), meta descriptions 150–160 chars — use the exact strings from spec §2 where given.
- Do not fabricate content this plan doesn't provide (no e-invoicing claims, no FAQ, no About/blog — those are Phase 2, deliberately out of scope here).
- **Keyword discipline** (full audit: `docs/superpowers/specs/2026-08-16-d3-keyword-audit.md`): each page has exactly one primary keyword driving its `<title>`, its single `<h1>`, and its first ~100 words. No primary keyword — or its distinctive component words — is reused as another page's primary, in either language. Each page carries 4–8 secondary keywords, one per `<h2>`, and no secondary keyword phrase repeats across pages. AR and EN are audited independently. Internal links between these 12 pages use the target page's primary keyword as anchor text.
- **No near-duplicate per-language HTML.** Every string that differs between `/ar/` and `/en/` lives in `_data/i18n.yml`, `_data/home.yml`, or `_data/services.yml`, keyed under `ar:`/`en:`. Layouts, includes, and page files contain Liquid logic and lookups, never a second hardcoded copy of the same block of markup with translated text baked in. Anchor text between the 12 pages is looked up from the target's own `primary_keyword` in `_data/services.yml` — never hand-copied into a link label — so it cannot drift out of sync with the target page's actual keyword.

---

## Task 1: Jekyll scaffold

**Files:**
- Create: `Gemfile`
- Create: `_config.yml`
- Test: run `bundle install` then `bundle exec jekyll build`

**Interfaces:**
- Produces: a working `bundle exec jekyll build` / `bundle exec jekyll serve` command every later task relies on to verify its output.

- [ ] **Step 1: Write the Gemfile**

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "webrick"
```

(`webrick` is required for `jekyll serve` on Ruby ≥3.0, since it's no longer in the standard library.)

- [ ] **Step 2: Write `_config.yml`**

```yaml
title: "D3 — Digital Business Solutions"
url: "https://d3moo.is-a.dev"
markdown: kramdown
permalink: pretty

defaults:
  - scope:
      path: ""
    values:
      layout: "page"

exclude:
  - Gemfile
  - Gemfile.lock
  - vendor
  - docs
  - README.md
```

**Do not add `CNAME` to `exclude`.** GitHub Pages reads the custom-domain config from the *built* site, not the source repo — an excluded file never reaches `_site/`, which would silently break the `d3moo.is-a.dev` custom domain. `CNAME` is a plain flat file with no front matter, so leaving it out of `exclude` is sufficient: Jekyll copies unrecognized static files straight into `_site/` untouched.

No `plugins:` block — Task 9 hand-writes `sitemap.xml` directly (it needs per-URL `<xhtml:link>` hreflang alternates the `jekyll-sitemap` plugin can't emit), so there's nothing to enable here.

- [ ] **Step 3: Install gems**

Run: `cd /home/d3/my-project/dxbdxb416.github.io && bundle install`
Expected: gems resolve and install without error (this pulls the full `github-pages` gem tree — takes a minute, needs network).

- [ ] **Step 4: Verify an empty build works**

Run: `bundle exec jekyll build`
Expected: `_site/` is created; build reports success with 0 or 1 pages (just whatever stray files exist so far, e.g. `CNAME`). No Liquid errors.

- [ ] **Step 5: Commit**

```bash
git add Gemfile _config.yml
git commit -m "Add Jekyll scaffold for D3 site rebuild"
```

Do NOT commit `Gemfile.lock` yet if it references machine-specific platform gems oddly — check its contents first; if it's a normal lockfile, commit it too (GitHub Pages doesn't use it, but it pins your local reproducibility). Do NOT commit `_site/` or `.bundle/` — add them to `.gitignore`:

```bash
cat > .gitignore <<'EOF'
_site/
.bundle/
.jekyll-cache/
.sass-cache/
EOF
git add .gitignore Gemfile.lock
git commit -m "Ignore Jekyll build output"
```

---

## Task 2: i18n data, base layout, and shared chrome includes

**Files:**
- Create: `_data/site.yml`
- Create: `_data/i18n.yml`
- Create: `_layouts/page.html`
- Create: `_includes/head-seo.html`
- Create: `_includes/schema-professional-service.html`
- Create: `_includes/schema-service.html`
- Create: `_includes/schema-breadcrumb.html`
- Create: `_includes/nav.html`
- Create: `_includes/footer.html`
- Create: `_includes/cta-banner.html`
- Create: `_includes/vendor-disclaimer.html`
- Create: `_includes/whatsapp-float.html`
- Create: `robots.txt`
- Create: `index.html` (root redirect)
- Create: `404.html`
- Test: a throwaway `ar/index.md` stub page to build against (replaced in Task 7)

**Interfaces:**
- Consumes: nothing yet.
- Produces: `site.data.i18n[page.lang].*` — every shared-chrome string (nav labels, footer copyright, CTA banner, vendor disclaimer, WhatsApp button text) that Tasks 2's own includes read, and the front-matter contract every content page (Task 7) follows: `layout: page`, `lang: ar|en`, `text_dir: rtl|ltr`, `permalink`, `ar_permalink`, `en_permalink`, `seo_title`, `seo_description`, `is_home: true` (homepage only), `service_id` (service pages only — the key into `_data/services.yml`), `breadcrumb_label` (non-home pages only).

**Naming note:** the front-matter key is `text_dir`, not `dir` — Jekyll's `Page` object has its own computed, reserved `dir` attribute (the page's URL directory), which silently shadows a front-matter key of the same name in Liquid (`{{ page.dir }}` would render e.g. `/ar/`, not `rtl`). `text_dir` avoids the collision.

- [ ] **Step 1: `_data/site.yml`**

```yaml
name: "D3"
tagline: "Digital Business Solutions"
url: "https://d3moo.is-a.dev"
whatsapp_number_display: "+971 509733299"
whatsapp_link: "https://wa.me/971509733299"
email: "d3@d3moo.is-a.dev"
cal_link: "https://cal.com/d3moo/30min"
og_image: "/assets/img/logo-navy.png"
```

- [ ] **Step 2: `_data/i18n.yml`** — every UI string that isn't page body content

```yaml
ar:
  nav_services: "الخدمات"
  nav_pricing: "المنتجات"
  nav_contact: "تواصل"
  nav_lang_switch: "English"
  footer_copy: "© 2026 D3 · جميع الحقوق محفوظة"
  cta_badge: "تحتاج مساعدة؟"
  cta_heading: "استشارة مجانية — نحدد احتياجك ونرشّح الحل"
  cta_button: "ابدأ الآن"
  vendor_disclaimer: "أسماء المنتجات والعلامات التجارية المذكورة ملك لأصحابها. ذكرها هنا يشير إلى خبرتنا في العمل عليها ولا يعني شراكة أو اعتماد رسمي."
  whatsapp_float_label: "WhatsApp"
  sibling_links_label: "خدمات ذات صلة"
  quote_link_suffix: " ←"
  logo_nav_alt: "شعار D3 للحلول الرقمية"
  logo_footer_alt: "شعار D3"
  not_found_title: "404"
  not_found_body: "الصفحة غير موجودة."
  not_found_link: "الرجوع للرئيسية"
en:
  nav_services: "Services"
  nav_pricing: "Products"
  nav_contact: "Contact"
  nav_lang_switch: "العربية"
  footer_copy: "© 2026 D3 · All rights reserved"
  cta_badge: "Need help?"
  cta_heading: "Free consultation — we scope your need and recommend a fit"
  cta_button: "Start now"
  vendor_disclaimer: "All product names and trademarks are the property of their respective owners. Their appearance here indicates hands-on experience, not partnership or official endorsement."
  whatsapp_float_label: "WhatsApp"
  sibling_links_label: "Related services"
  quote_link_suffix: " →"
  logo_nav_alt: "D3 — Digital Business Solutions logo"
  logo_footer_alt: "D3 logo"
  not_found_title: "404"
  not_found_body: "Page not found."
  not_found_link: "Back to homepage"
```

- [ ] **Step 3: `_includes/schema-professional-service.html`**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "{{ site.data.site.url }}/#business",
  "name": "D3 — Digital Business Solutions",
  "url": "{{ site.data.site.url }}",
  "image": "{{ site.data.site.url }}{{ site.data.site.og_image }}",
  "email": "{{ site.data.site.email }}",
  "telephone": "+971509733299",
  "areaServed": [
    { "@type": "Country", "name": "United Arab Emirates" },
    { "@type": "Country", "name": "Saudi Arabia" }
  ],
  "address": { "@type": "PostalAddress", "addressLocality": "Dubai", "addressCountry": "AE" },
  "knowsLanguage": ["ar", "en"],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "noon & Amazon store management" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Accounting & ERP implementation" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "CRM setup and integration" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Business process automation" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Websites and online stores" } }
    ]
  }
}
</script>
```

- [ ] **Step 4: `_includes/schema-service.html`**

```html
{% if page.service_id %}
{% assign svc = site.data.services[page.service_id] %}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{{ svc.service_name }}",
  "provider": { "@id": "{{ site.data.site.url }}/#business" },
  "areaServed": [
    { "@type": "Country", "name": "United Arab Emirates" },
    { "@type": "Country", "name": "Saudi Arabia" }
  ],
  "url": "{{ site.data.site.url }}{{ page.permalink }}"
}
</script>
{% endif %}
```

(`svc.service_name` is defined in Task 5's `_data/services.yml` — a single English name per service, language-independent, used only for schema.)

- [ ] **Step 5: `_includes/schema-breadcrumb.html`**

```html
{% unless page.is_home %}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "{% if page.lang == 'ar' %}الرئيسية{% else %}Home{% endif %}",
      "item": "{{ site.data.site.url }}{% if page.lang == 'ar' %}/ar/{% else %}/en/{% endif %}"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{{ page.breadcrumb_label }}",
      "item": "{{ site.data.site.url }}{{ page.permalink }}"
    }
  ]
}
</script>
{% endunless %}
```

- [ ] **Step 6: `_includes/head-seo.html`**

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ page.seo_title }}</title>
<meta name="description" content="{{ page.seo_description }}">
<link rel="canonical" href="{{ site.data.site.url }}{{ page.permalink }}">
<link rel="alternate" hreflang="ar-AE" href="{{ site.data.site.url }}{{ page.ar_permalink }}">
<link rel="alternate" hreflang="ar-SA" href="{{ site.data.site.url }}{{ page.ar_permalink }}">
<link rel="alternate" hreflang="en-AE" href="{{ site.data.site.url }}{{ page.en_permalink }}">
<link rel="alternate" hreflang="x-default" href="{{ site.data.site.url }}{{ page.ar_permalink }}">
<meta property="og:type" content="website">
<meta property="og:title" content="{{ page.seo_title }}">
<meta property="og:description" content="{{ page.seo_description }}">
<meta property="og:url" content="{{ site.data.site.url }}{{ page.permalink }}">
<meta property="og:image" content="{{ site.data.site.url }}{{ site.data.site.og_image }}">
<meta property="og:locale" content="{% if page.lang == 'ar' %}ar_AE{% else %}en_AE{% endif %}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{{ page.seo_title }}">
<meta name="twitter:description" content="{{ page.seo_description }}">
<meta name="twitter:image" content="{{ site.data.site.url }}{{ site.data.site.og_image }}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/img/apple-touch-icon-180.png">
{% include schema-professional-service.html %}
{% include schema-service.html %}
{% include schema-breadcrumb.html %}
```

- [ ] **Step 7: `_includes/nav.html`**

```html
{% assign t = site.data.i18n[page.lang] %}
<nav class="site-nav">
  <div class="nav-inner">
    <a href="/{{ page.lang }}/" class="nav-brand">
      <img src="/assets/img/logo-white.png" alt="{{ t.logo_nav_alt }}" class="nav-logo" width="120" height="26">
      <span class="nav-tagline">Digital Business Solutions</span>
    </a>
    <div class="nav-links">
      <a href="/{{ page.lang }}/#services">{{ t.nav_services }}</a>
      <a href="/{{ page.lang }}/#pricing">{{ t.nav_pricing }}</a>
      <a href="/{{ page.lang }}/#contact">{{ t.nav_contact }}</a>
      {% if page.lang == 'ar' %}
        <a href="{{ page.en_permalink }}" class="nav-lang" hreflang="en" lang="en">{{ t.nav_lang_switch }}</a>
      {% else %}
        <a href="{{ page.ar_permalink }}" class="nav-lang" hreflang="ar" lang="ar">{{ t.nav_lang_switch }}</a>
      {% endif %}
    </div>
  </div>
</nav>
```

- [ ] **Step 8: `_includes/footer.html`**

```html
{% assign t = site.data.i18n[page.lang] %}
<footer class="site-footer">
  <div class="footer-inner">
    <img src="/assets/img/logo-navy.png" alt="{{ t.logo_footer_alt }}" class="footer-logo" width="94" height="20">
    <span class="footer-copy">{{ t.footer_copy }}</span>
  </div>
</footer>
```

- [ ] **Step 9: `_includes/cta-banner.html`**

```html
{% assign t = site.data.i18n[page.lang] %}
<section class="cta-banner">
  <div class="cta-inner">
    <span class="cta-badge">{{ t.cta_badge }}</span>
    <h2 class="cta-heading">{{ t.cta_heading }}</h2>
    <a href="{{ site.data.site.cal_link }}" target="_blank" rel="noopener" class="cta-button">{{ t.cta_button }}</a>
  </div>
</section>
```

- [ ] **Step 10: `_includes/vendor-disclaimer.html`**

```html
<p class="vendor-disclaimer">{{ site.data.i18n[page.lang].vendor_disclaimer }}</p>
```

- [ ] **Step 11: `_includes/whatsapp-float.html`**

```html
<a href="{{ site.data.site.whatsapp_link }}" target="_blank" rel="noopener" class="whatsapp-float" aria-label="{{ site.data.i18n[page.lang].whatsapp_float_label }}">
  <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.257.59 4.463 1.712 6.408L3.2 28.8l6.56-1.712a12.74 12.74 0 0 0 6.244 1.6h.005c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.688-12.805-12.688Zm0 23.36h-.004a10.6 10.6 0 0 1-5.4-1.48l-.388-.23-4.03 1.052 1.075-3.93-.252-.404a10.56 10.56 0 0 1-1.62-5.64c0-5.86 4.77-10.63 10.63-10.63 2.84 0 5.51 1.108 7.518 3.117a10.56 10.56 0 0 1 3.112 7.52c0 5.86-4.77 10.625-10.64 10.625Zm5.83-7.96c-.32-.16-1.89-.932-2.183-1.04-.293-.107-.507-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.497-2.57-1.586-.95-.847-1.592-1.894-1.779-2.214-.186-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.735-.986-2.375-.26-.624-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.257 3.445 5.47 4.83.765.33 1.362.527 1.827.674.767.244 1.465.21 2.017.127.615-.092 1.89-.773 2.157-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.613-.373Z"></path></svg>
  <span>{{ site.data.i18n[page.lang].whatsapp_float_label }}</span>
</a>
```

- [ ] **Step 12: `_layouts/page.html`**

```html
<!doctype html>
<html lang="{{ page.lang }}" dir="{{ page.text_dir }}">
<head>
{% include head-seo.html %}
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/tajawal-400-arabic.woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="lang-{{ page.lang }}">
{% include nav.html %}
<main>
{{ content }}
</main>
{% include cta-banner.html %}
{% include footer.html %}
{% include whatsapp-float.html %}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
```

- [ ] **Step 13: `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://d3moo.is-a.dev/sitemap.xml
```

- [ ] **Step 14: root `index.html`** (plain file, NOT processed through `_layouts/page.html` — it has its own complete `<html>`)

**Important:** `_config.yml`'s `defaults` block (Step 2) sets `layout: page` for every file under `path: ""` that doesn't declare its own `layout`. This file has its own complete `<html>` document and must NOT be wrapped by `_layouts/page.html` — set `layout: null` explicitly in its front matter to override the default, or Jekyll will nest this whole document inside the site layout and the `{% include head-seo.html %}` in that layout will render empty/broken (this file's front matter has none of the fields `head-seo.html` expects).

```html
---
permalink: /
layout: null
sitemap: false
---
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>D3 — Digital Business Solutions</title>
<meta http-equiv="refresh" content="0; url=/ar/">
<link rel="canonical" href="https://d3moo.is-a.dev/ar/">
<script>
  var isEnglish = /^en\b/i.test(navigator.language || navigator.userLanguage || "");
  location.replace(isEnglish ? "/en/" : "/ar/");
</script>
</head>
<body>
<p>Redirecting… <a href="/ar/">العربية</a> · <a href="/en/">English</a></p>
</body>
</html>
```

- [ ] **Step 15: `404.html`**

This page shows *both* languages at once by design — it's a single shared error route, not one of the 12 audited pages, so it isn't subject to the "no both languages in one DOM" constraint (that rule is about duplicate indexable content; a 404 is `noindex`). It still pulls its two strings-per-language from `_data/i18n.yml` rather than hardcoding a third copy.

```html
---
permalink: /404.html
layout: null
sitemap: false
---
<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<title>404 — D3</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="lang-en">
<main class="not-found">
  <h1>{{ site.data.i18n.en.not_found_title }}</h1>
  <p lang="ar" dir="rtl">{{ site.data.i18n.ar.not_found_body }} <a href="/ar/">{{ site.data.i18n.ar.not_found_link }}</a></p>
  <p lang="en" dir="ltr">{{ site.data.i18n.en.not_found_body }} <a href="/en/">{{ site.data.i18n.en.not_found_link }}</a></p>
</main>
</body>
</html>
```

- [ ] **Step 16: throwaway stub page to build against**

Create `ar/index.md`:

```markdown
---
layout: page
lang: ar
text_dir: rtl
permalink: /ar/
ar_permalink: /ar/
en_permalink: /en/
is_home: true
seo_title: "STUB — replaced in Task 7"
seo_description: "STUB — replaced in Task 7"
---
<h1>stub</h1>
```

- [ ] **Step 17: Build and eyeball the output**

Run: `bundle exec jekyll build`
Expected: no Liquid errors; `_site/ar/index.html` exists and contains `<link rel="canonical"`, all 4 `hreflang` links, the `ProfessionalService` JSON-LD, the nav (with Arabic labels pulled from `i18n.yml`), footer, CTA banner, and WhatsApp float. `_site/index.html` exists with the meta-refresh. `_site/404.html` exists with both languages. `_site/robots.txt` exists.

Run: `grep -c '<h1' _site/ar/index.html` → expect `1`.
Run: `grep -o '<link rel="alternate" hreflang="[^"]*"' _site/ar/index.html | grep -o 'hreflang="[^"]*"' | sort -u` → expect exactly `ar-AE`, `ar-SA`, `en-AE`, `x-default`. (Scoped to `<link rel="alternate"` in `<head>` — the nav's language-switch link also carries a legitimate `hreflang` attribute for accessibility, e.g. `hreflang="en"`, which is unrelated to these SEO tags and would otherwise show up as a spurious 5th value.)
Run: `grep -c 'الخدمات' _site/ar/index.html` → expect ≥1 (confirms `i18n.yml` is actually being read, not silently falling back to blank).

- [ ] **Step 18: Commit**

```bash
git add _data _layouts _includes robots.txt index.html 404.html ar/index.md
git commit -m "Add Jekyll layout, i18n-driven shared includes, and SEO head partials"
```

---

## Task 3: CSS and tab-switching JS

**Files:**
- Create: `assets/css/style.css`
- Create: `assets/js/main.js`

**Interfaces:**
- Consumes: nothing.
- Produces: the class vocabulary the shared body templates (Task 6) are written against: `.eyebrow`, `.badge`, `.hero`, `.btn`/`.btn-primary`/`.btn-secondary`, `.section`, `.section-head`, `.section-title`, `.rule`, `.service-links`, `.service-link-card`, `.product-grid`, `.product-card`, `.provider-list`, `.tabs`/`[data-tabs]`/`[data-tab-button]`/`[data-tab-panel]`, `.tool-grid`, `.tool-card`, `.process-grid`, `.process-card`, `.process-step-number`, `.contact-grid`, `.contact-card`, `.contact-form`, `.sibling-links`, `.vendor-disclaimer`. Also the `[data-tabs]` / `[data-tab-button]` / `[data-tab-panel]` JS contract.

- [ ] **Step 1: Write `assets/css/style.css`**

```css
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/tajawal-400-arabic.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+200C-200E, U+2010-2011, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/tajawal-400-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/assets/fonts/tajawal-500-arabic.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+200C-200E, U+2010-2011, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/assets/fonts/tajawal-500-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/assets/fonts/tajawal-700-arabic.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+200C-200E, U+2010-2011, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/assets/fonts/tajawal-700-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/assets/fonts/tajawal-800-arabic.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+200C-200E, U+2010-2011, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/assets/fonts/tajawal-800-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122;
}

:root {
  --navy: #0F1B3D;
  --navy-hover: #1C2C55;
  --blue: #2952E3;
  --blue-hover: #4A6EF0;
  --blue-text: #2143C9;
  --blue-bg: #E5EAFB;
  --bg: #F6F7F9;
  --white: #FFFFFF;
  --border: #E3E7EE;
  --border-soft: #EEF2F8;
  --text: #0F1B3D;
  --text-muted: #5A6478;
  --text-faint: #8A93A6;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Tajawal', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--navy); }
a:hover { color: var(--blue); }
img { max-width: 100%; }
::selection { background: var(--blue-bg); }

.eyebrow { font-size: 12px; letter-spacing: 0.12em; color: var(--text-faint); text-transform: uppercase; }

.site-nav { position: sticky; top: 0; z-index: 40; background: var(--navy); color: #F3F5F8; }
.nav-inner { max-width: 1140px; margin: 0 auto; padding: 0 28px; height: 70px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.nav-brand { display: flex; align-items: baseline; gap: 10px; text-decoration: none; }
.nav-logo { height: 26px; width: auto; display: block; }
.nav-tagline { font-size: 11px; letter-spacing: 0.16em; color: var(--blue); text-transform: uppercase; }
.nav-links { display: flex; align-items: center; gap: 24px; font-size: 15px; }
.nav-links a { text-decoration: none; color: #C7CFDD; }
.nav-links a:hover { color: #FFFFFF; }
.nav-lang { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.06); border: 1px solid #2A3A63; border-radius: 999px; padding: 0 16px; height: 38px; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; }
.nav-lang:hover { background: var(--blue); border-color: var(--blue); color: #FFFFFF; }

.section { max-width: 1140px; margin: 0 auto; padding: 76px 28px 0; }
.section:first-of-type { padding-top: 0; }
.section-head { display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px; }
.section-title { margin: 0; font-size: 26px; font-weight: 800; }
.rule { width: 44px; height: 3px; background: var(--blue); }

.hero { background: var(--white); border-bottom: 1px solid var(--border); }
.hero-inner { max-width: 1140px; margin: 0 auto; padding: 72px 28px 76px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 44px 60px; align-items: center; }
.hero-copy { display: flex; flex-direction: column; gap: 22px; }
.badge { display: inline-flex; align-self: flex-start; align-items: center; gap: 8px; background: var(--blue-bg); color: var(--blue-text); font-size: 13px; font-weight: 500; padding: 7px 13px; border-radius: 999px; }
.hero h1 { margin: 0; font-size: clamp(28px, 3.2vw, 40px); line-height: 1.5; font-weight: 700; letter-spacing: -0.01em; }
.hero p { margin: 0; font-size: 16px; line-height: 1.9; color: var(--text-muted); max-width: 520px; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.hero-art { aspect-ratio: 4 / 3; border-radius: 4px; border: 1px solid var(--border); background: repeating-linear-gradient(135deg, #F7F9FC 0 10px, #EEF2F8 10px 20px); display: flex; align-items: center; justify-content: center; }
.hero-art span { font-size: 12px; letter-spacing: 0.1em; color: #93A0B5; text-transform: uppercase; }

.btn { display: inline-flex; align-items: center; text-decoration: none; padding: 15px 26px; font-size: 15px; font-weight: 700; border-radius: 3px; min-height: 44px; box-sizing: border-box; }
.btn-primary { background: var(--navy); color: #FFFFFF; }
.btn-primary:hover { background: var(--navy-hover); color: #FFFFFF; }
.btn-secondary { padding: 15px 22px; color: var(--text); border: 1px solid #CBD3E0; background: var(--white); }
.btn-secondary:hover { border-color: var(--blue); color: var(--blue-text); }

.service-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; margin-bottom: 40px; }
.service-link-card { display: flex; align-items: center; gap: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 5px; padding: 18px 20px; text-decoration: none; color: var(--text); min-height: 44px; transition: border-color 240ms ease, transform 240ms ease; }
.service-link-card:hover { border-color: var(--blue); color: var(--text); transform: translateY(-2px); }
.service-link-dot { width: 34px; height: 34px; border-radius: 50%; background: var(--blue-bg); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.service-link-dot span { width: 11px; height: 11px; border-radius: 50%; background: var(--blue); }
.service-link-title { font-size: 17px; font-weight: 700; display: block; }
.service-link-sub { font-size: 11px; letter-spacing: 0.12em; color: var(--text-faint); text-transform: uppercase; display: block; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
.product-card { background: var(--white); border: 1px solid var(--border); border-radius: 5px; padding: 30px 26px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 1px 2px rgba(15,27,61,0.04); }
.product-card h3 { margin: 0; font-size: 22px; font-weight: 800; }
.product-card p { margin: 0; font-size: 15px; line-height: 1.9; color: var(--text-muted); }
.provider-list { display: flex; flex-direction: column; }
.provider-list .provider-list-label { font-size: 11px; letter-spacing: 0.14em; color: var(--text-faint); text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.provider-list .provider { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border-soft); font-size: 14px; color: #16233F; }
.provider .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); flex-shrink: 0; }
.product-card .quote-link { margin-top: auto; align-self: flex-start; color: var(--blue); text-decoration: none; font-weight: 700; }
.footnote { margin: 24px 0 0; font-size: 14px; line-height: 1.9; color: #7B869B; max-width: 720px; }

.tabs-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 26px; }
.tab-button { font-family: 'Tajawal', sans-serif; background: var(--white); color: var(--text); border: 1px solid var(--border); border-radius: 999px; padding: 12px 22px; font-size: 15px; font-weight: 700; cursor: pointer; min-height: 44px; }
.tab-button.is-active { background: var(--navy); color: #FFFFFF; }
.tool-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; }
.tool-card { background: var(--white); border: 1px solid var(--border); border-radius: 6px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.tool-card .tool-mark { width: 64px; height: 64px; border-radius: 6px; border: 1px solid var(--border); background: repeating-linear-gradient(135deg, #F7F9FC 0 8px, #EEF2F8 8px 16px); }
.tool-card span.tool-name { font-size: 14px; font-weight: 700; text-align: center; }

.process-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; align-items: stretch; }
.process-card { position: relative; overflow: hidden; background: var(--white); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 30px 26px 32px; display: flex; flex-direction: column; gap: 16px; transition: transform 380ms cubic-bezier(0.2,0.8,0.2,1), background 380ms ease, color 380ms ease, border-color 380ms ease, box-shadow 380ms ease; }
.process-card:hover { transform: translateY(-8px); background: var(--navy); color: #FFFFFF; border-color: var(--navy); box-shadow: 0 24px 48px rgba(15,27,61,0.22); }
.process-step-number { position: absolute; top: -18px; inset-inline-end: 6px; font-size: 92px; font-weight: 800; line-height: 1; color: currentColor; opacity: 0.07; pointer-events: none; }
.process-card .rule { width: 40px; height: 3px; background: var(--blue); }
.process-card h3 { margin: 0; font-size: 22px; font-weight: 800; color: inherit; }
.process-card ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 11px; }
.process-card li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; line-height: 1.65; color: inherit; opacity: 0.85; }
.process-card li .step-dot { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid currentColor; opacity: 0.5; flex-shrink: 0; margin-top: 4px; }

.cta-banner { max-width: 1140px; margin: 76px auto 0; padding: 0 28px; }
.cta-inner { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; background: var(--navy); color: #FFFFFF; border-radius: 8px; padding: 30px 32px; }
.cta-badge { font-size: 13px; font-weight: 700; letter-spacing: 0.14em; color: #6E9BFF; text-transform: uppercase; display: block; }
.cta-heading { font-size: clamp(22px, 2.6vw, 30px); font-weight: 800; line-height: 1.3; margin: 6px 0 0; flex: 1; min-width: 200px; }
.cta-button { display: inline-flex; align-items: center; background: var(--blue); color: #FFFFFF; text-decoration: none; padding: 14px 26px; border-radius: 999px; font-size: 15px; font-weight: 700; min-height: 44px; box-sizing: border-box; }
.cta-button:hover { background: var(--blue-hover); color: #FFFFFF; }

.contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 36px 56px; align-items: start; }
.contact-card { display: flex; align-items: center; gap: 16px; text-decoration: none; color: var(--text); background: var(--white); border: 1px solid var(--border); border-radius: 6px; padding: 18px 20px; min-height: 44px; margin-bottom: 12px; transition: border-color 260ms ease, transform 260ms ease, box-shadow 260ms ease; }
.contact-card:hover { border-color: var(--blue); transform: translateY(-2px); box-shadow: 0 10px 24px rgba(41,82,227,0.12); color: var(--text); }
.contact-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--blue-bg); color: var(--blue); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.contact-label { font-size: 11px; font-weight: 500; letter-spacing: 0.14em; color: var(--text-faint); text-transform: uppercase; display: block; }
.contact-value { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; display: block; }
.contact-hours { font-size: 13px; color: var(--text-faint); }
.contact-form { display: flex; flex-direction: column; gap: 13px; background: var(--white); border: 1px solid var(--border); border-radius: 6px; padding: 28px 26px; box-shadow: 0 1px 2px rgba(22,35,63,0.04); }
.contact-form input, .contact-form select, .contact-form textarea { font-family: 'Tajawal', sans-serif; font-size: 15px; padding: 13px 14px; border: 1px solid #D7DDE8; border-radius: 4px; background: #FBFCFE; color: var(--text); min-height: 44px; box-sizing: border-box; }
.contact-form textarea { resize: vertical; }
.contact-form button { font-family: 'Tajawal', sans-serif; background: var(--navy); color: #FFFFFF; border: none; padding: 15px 20px; font-size: 15px; font-weight: 700; border-radius: 4px; cursor: pointer; min-height: 44px; }
.contact-form button:hover { background: var(--blue); }
.contact-form small { font-size: 13px; color: var(--text-faint); }

.vendor-disclaimer { font-size: 12px; line-height: 1.7; color: var(--text-faint); max-width: 760px; margin: 14px 0 0; }

.sibling-links { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 24px 0 8px; font-size: 14px; }
.sibling-links-label { color: var(--text-faint); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
.sibling-links a { text-decoration: none; font-weight: 700; }

.site-footer { border-top: 1px solid var(--border); background: var(--bg); }
.footer-inner { max-width: 1140px; margin: 0 auto; padding: 26px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.footer-logo { height: 20px; width: auto; display: block; }
.footer-copy { font-size: 13px; color: var(--text-faint); }

.whatsapp-float { position: fixed; bottom: 24px; inset-inline-start: 24px; z-index: 50; display: inline-flex; align-items: center; gap: 10px; background: var(--blue); color: #FFFFFF; text-decoration: none; padding: 0 22px; height: 48px; border-radius: 999px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 20px rgba(41,82,227,0.35); transition: transform 240ms ease, box-shadow 240ms ease; }
.whatsapp-float:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(41,82,227,0.45); color: #FFFFFF; }

.not-found { max-width: 640px; margin: 120px auto; padding: 0 28px; text-align: center; }

@media (max-width: 620px) {
  .nav-tagline { display: none; }
  .nav-links { gap: 14px; font-size: 13px; }
}
```

- [ ] **Step 2: Write `assets/js/main.js`**

```js
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var buttons = group.querySelectorAll('[data-tab-button]');
    var panels = group.querySelectorAll('[data-tab-panel]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab-button');
        buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-tab-panel') !== target; });
      });
    });
  });
});
```

- [ ] **Step 3: Verify no build errors and CSS is served**

Run: `bundle exec jekyll build && ls _site/assets/css/style.css _site/assets/js/main.js`
Expected: both files exist in `_site/assets/...` (Jekyll copies non-front-matter files verbatim).

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css assets/js/main.js
git commit -m "Add site stylesheet and vanilla-JS tab switching"
```

---

## Task 4: Asset pipeline (logos, fonts, favicons)

**Files:**
- Create: `assets/img/logo-white.png`, `assets/img/logo-navy.png`, `assets/img/favicon-32.png`, `assets/img/apple-touch-icon-180.png`
- Create: `assets/fonts/tajawal-{400,500,700,800}-{arabic,latin}.woff2` (8 files)

**Interfaces:**
- Consumes: source files at `docs/superpowers/specs/assets/d3-bundle-extract/` (logo-white.png, logo-navy.png, favicon-32.png, apple-touch-icon-180.png, fonts/tajawal-*.woff2) — already extracted from the original bundle and prepared (favicons cropped/padded from the navy logo via Pillow) during spec-writing.
- Produces: the exact asset paths `_includes/nav.html`, `_includes/footer.html`, `_includes/head-seo.html`, and `assets/css/style.css`'s `@font-face` rules already reference.

- [ ] **Step 1: Copy assets into place**

```bash
mkdir -p assets/img assets/fonts
cp docs/superpowers/specs/assets/d3-bundle-extract/logo-white.png assets/img/
cp docs/superpowers/specs/assets/d3-bundle-extract/logo-navy.png assets/img/
cp docs/superpowers/specs/assets/d3-bundle-extract/favicon-32.png assets/img/
cp docs/superpowers/specs/assets/d3-bundle-extract/apple-touch-icon-180.png assets/img/
cp docs/superpowers/specs/assets/d3-bundle-extract/fonts/tajawal-*.woff2 assets/fonts/
```

- [ ] **Step 2: Verify counts and that nothing is missing**

Run: `ls assets/fonts | wc -l` → expect `8`.
Run: `ls assets/img` → expect `logo-white.png logo-navy.png favicon-32.png apple-touch-icon-180.png`.

- [ ] **Step 3: Build and confirm assets are copied into `_site/`**

Run: `bundle exec jekyll build && ls _site/assets/fonts | wc -l && ls _site/assets/img`
Expected: `8` fonts, all 4 images present in `_site/assets/img`.

- [ ] **Step 4: Commit**

```bash
git add assets/img assets/fonts
git commit -m "Add extracted logo, favicon, and Tajawal font assets"
```

---

## Task 5: Content data — `_data/services.yml` and `_data/home.yml`

**Files:**
- Create: `_data/services.yml`
- Create: `_data/home.yml`

**Interfaces:**
- Consumes: the keyword audit (`docs/superpowers/specs/2026-08-16-d3-keyword-audit.md`) and the copy inventory (spec §3).
- Produces: `site.data.services[id]` (id ∈ `noon-amazon`, `accounting-erp`, `crm`, `automation`, `websites`) and `site.data.home`, which Task 6's two shared templates render and Task 7's 12 page files trigger via `page.service_id` / `page.is_home`. Every `primary_keyword` and `secondary_keywords` value here must exactly match the audit table — Task 8 verifies this by reading these files directly.

- [ ] **Step 1: Write `_data/services.yml`**

```yaml
noon-amazon:
  order: 1
  eyebrow_number: "01"
  category_label: "Marketplace"
  service_name: "noon & Amazon store management"
  siblings: ["crm", "automation", "websites"]
  ar:
    primary_keyword: "إدارة متجر نون وأمازون"
    secondary_keywords:
      - "فتح حساب بائع في نون"
      - "رفع منتجات على نون وأمازون"
      - "تحديث الأسعار والمخزون في نون"
      - "تحسين صفحات المنتجات وزيادة المبيعات"
      - "شروط البيع على نون في السعودية"
    seo_title: "إدارة متجر نون وأمازون: إطلاق ورفع منتجات وإدارة شهرية"
    seo_description: "نفتح حساب البائع، نرفع الكتالوج بالعربي والإنجليزي، وندير الأسعار والمخزون والطلبات شهرياً على نون وأمازون في الإمارات والسعودية."
    breadcrumb_label: "نون وأمازون"
    h1: "إدارة متجر نون وأمازون: إطلاق، رفع منتجات، وإدارة شهرية"
    intro: "نساعد الشركات الصغيرة في الإمارات والسعودية تبيع على نون وأمازون من الصفر — فتح حساب البائع، رفع الكتالوج بالعربي والإنجليزي، وإدارة الأسعار والمخزون والطلبات شهريًا."
    sections:
      - h2: "فتح حساب البائع والتحقق"
        body: "نساعدك تفتح حساب بائع في نون خطوة بخطوة — من التسجيل والتحقق من الهوية والمستندات، إلى ربط حساب بنكي لاستلام المدفوعات. نتابع معك حتى تفعيل الحساب وجاهزيته للبيع."
      - h2: "رفع الكتالوج وتجهيز المنتجات"
        body: "نرفع منتجاتك على نون وأمازون بالعربي والإنجليزي، بصور ومواصفات مطابقة لمعايير كل منصة، مع تنظيم الـSKU والفاريانتس بشكل صحيح من أول مرة."
      - h2: "الإدارة الشهرية للمتجر"
        body: "تحديث الأسعار والمخزون أول بأول، متابعة الطلبات والمرتجعات، ومراقبة أداء المنتجات بتقرير شهري واضح."
      - h2: "تحسين الأداء والنمو"
        body: "تحسين صفحات المنتجات، إدارة العروض والإعلانات، وتحليل المنافسين والأداء لزيادة مبيعاتك باستمرار."
      - h2: "شروط البيع والمستندات المطلوبة"
        body: "نوضح لك المستندات والشروط التي تطلبها كل منصة لفتح حساب بائع (سجل تجاري، حساب بنكي، معلومات ضريبية)، ونجهزها معك قبل التقديم لتفادي أي تأخير."
    quote_link_text: "اطلب عرض سعر"
  en:
    primary_keyword: "noon and Amazon store management"
    secondary_keywords:
      - "noon seller account setup"
      - "bilingual catalogue upload for noon and Amazon"
      - "pricing and inventory management for online sellers"
      - "product page optimization for marketplaces"
      - "amazon.ae seller services"
    seo_title: "noon & Amazon Seller Setup and Store Management | D3"
    seo_description: "Seller account setup, bilingual catalogue upload, pricing and inventory management for noon and Amazon sellers across the UAE and Saudi Arabia."
    breadcrumb_label: "noon & Amazon"
    h1: "noon and Amazon Store Management: Launch, Catalogue Upload, and Monthly Management"
    intro: "We help small businesses in the UAE and Saudi Arabia start selling on noon and Amazon from scratch — seller account setup, bilingual catalogue upload, and monthly price, inventory, and order management."
    sections:
      - h2: "Seller Account Opening and Verification"
        body: "We walk you through opening a seller account on noon step by step — registration, identity and document verification, and linking a bank account to receive payouts. We stay with you until the account is active and ready to sell."
      - h2: "Catalogue Upload and Product Setup"
        body: "We upload your products to noon and Amazon in Arabic and English, with images and specs that match each platform's requirements, and SKUs and variants organized correctly from the start."
      - h2: "Monthly Price and Inventory Management"
        body: "Keeping prices and stock levels current, handling orders and returns, and tracking product performance with a clear monthly report."
      - h2: "Growth and Performance Optimization"
        body: "Optimizing product pages, managing promotions and ads, and analyzing competitors and performance to keep growing your sales."
      - h2: "Seller Requirements and Documents"
        body: "We explain the documents and requirements each platform asks for when opening a seller account (trade license, bank account, tax information), and help you prepare them before applying to avoid delays."
    quote_link_text: "Request a quote"

accounting-erp:
  order: 2
  eyebrow_number: "ERP"
  category_label: "ERP"
  service_name: "Accounting & ERP implementation"
  providers: ["Odoo", "Zoho", "SAP Business One", "Oracle NetSuite", "QuickBooks", "Xero"]
  siblings: ["crm", "automation", "noon-amazon"]
  ar:
    primary_keyword: "برنامج محاسبة للشركات الصغيرة"
    secondary_keywords:
      - "نظام إدارة مخزون ومشتريات"
      - "ربط النظام المحاسبي مع منصة فاتورة"
      - "نظام ERP للشركات الصغيرة والمتوسطة"
      - "برنامج محاسبة معتمد من هيئة الزكاة"
      - "تدريب الفريق على البرنامج المحاسبي"
    seo_title: "برنامج محاسبة وإدارة شركة للمنشآت الصغيرة بالإمارات والسعودية"
    seo_description: "نساعدك تختار برنامج الحسابات والفواتير والمخزون المناسب لحجم شركتك، ونشرف على التركيب ونقل البيانات وتدريب فريقك."
    breadcrumb_label: "برامج حسابية وERP"
    h1: "برنامج محاسبة وإدارة شركة للمنشآت الصغيرة والمتوسطة"
    intro: "برنامج واحد يجمع الحسابات والفواتير والمخزون والمشتريات، بدل ملفات الإكسل المتفرقة. نساعدك تختار البرنامج المناسب لحجم شركتك ونشرف على التركيب والتدريب. (يُعرف تقنيًا بـ ERP)"
    provider_list_label: "الشركات المتوفرة"
    sections:
      - h2: "إدارة المخزون والمشتريات"
        body: "ندمج المخزون والمشتريات مع الحسابات في نظام واحد، بدل تتبعها يدويًا في ملفات منفصلة — تعرف كمية كل منتج ومتى تحتاج تشتري من جديد."
      - h2: "التوافق مع الفوترة الإلكترونية"
        body: "نساعدك تجهّز نظامك المحاسبي ليتوافق مع متطلبات الفوترة الإلكترونية، ونربطه بالمنصات المطلوبة حسب نوع نشاطك وبلد التسجيل."
      - h2: "اختيار نظام ERP المناسب"
        body: "مو كل شركة تحتاج نفس البرنامج — نقارن لك بين Odoo وZoho وSAP Business One وOracle NetSuite حسب حجم شركتك وميزانيتك، ونرشّح الأنسب."
      - h2: "التوافق مع متطلبات هيئة الزكاة"
        body: "للشركات في السعودية، نساعدك تختار وتُعِد برنامج محاسبة يتوافق مع متطلبات هيئة الزكاة والضريبة والجمارك، بالتنسيق مع محاسبك أو مستشارك الضريبي."
      - h2: "التركيب والتدريب"
        body: "نشرف على تركيب البرنامج، نقل بياناتك من الإكسل أو النظام القديم، وتدريب فريقك عليه خطوة بخطوة حتى يصير جاهز للاستخدام اليومي."
    footnote: "لكل برنامج أكثر من شركة مزوّدة، والسعر يعتمد على البرنامج وعدد المستخدمين وحجم العمل المطلوب. تواصل معنا ونرشّح لك الأنسب بدون التزام."
    quote_link_text: "اطلب عرض سعر"
  en:
    primary_keyword: "accounting software for small business Dubai"
    secondary_keywords:
      - "inventory and purchasing management software"
      - "Odoo implementation Dubai"
      - "small business ERP system UAE"
      - "accounting software data migration"
      - "e-invoicing ready accounting software"
    seo_title: "Accounting & ERP Software Setup for SMBs in UAE & Saudi | D3"
    seo_description: "We help you choose the right accounting, invoicing, and inventory software for your company size, and oversee installation, data migration, and training."
    breadcrumb_label: "Accounting & ERP"
    h1: "Accounting Software for Small Business: Choosing and Setting Up the Right ERP"
    intro: "One system that brings together your accounts, invoices, inventory, and purchasing instead of scattered spreadsheets. We help you pick the right software for your company size and oversee installation and training. (known technically as ERP)"
    provider_list_label: "Available providers"
    sections:
      - h2: "Inventory and Purchasing Management"
        body: "We bring inventory and purchasing together with your accounts in one system, instead of tracking them manually in separate files — so you always know how much stock you have and when to reorder."
      - h2: "Staying Ready for E-Invoicing Requirements"
        body: "We help you prepare your accounting system to meet e-invoicing requirements, and connect it to the right platforms based on your business type and country of registration."
      - h2: "Choosing the Right ERP System"
        body: "Not every company needs the same software — we compare Odoo, Zoho, SAP Business One, and Oracle NetSuite for your company size and budget, and recommend the best fit."
      - h2: "Staying Compliant with ZATCA Requirements"
        body: "For companies in Saudi Arabia, we help you choose and set up accounting software that meets Zakat, Tax and Customs Authority (ZATCA) requirements, coordinated with your accountant or tax advisor."
      - h2: "Setup, Data Migration, and Training"
        body: "We oversee installation, migrate your data from spreadsheets or your previous system, and train your team step by step until they're comfortable using it day to day."
    footnote: "Each program comes from several providers, and pricing depends on the program, user count, and scope of work. Talk to us and we'll recommend the best fit — no obligation."
    quote_link_text: "Request a quote"

crm:
  order: 3
  eyebrow_number: "02"
  category_label: "CRM"
  service_name: "CRM setup and integration"
  providers: ["Zoho CRM", "HubSpot", "Salesforce", "Pipedrive"]
  siblings: ["automation", "accounting-erp", "noon-amazon"]
  ar:
    primary_keyword: "ربط CRM مع واتساب"
    secondary_keywords:
      - "برنامج إدارة عملاء عربي"
      - "قمع المبيعات ومتابعة العروض"
      - "أتمتة متابعة العملاء"
      - "تقارير ولوحات مبيعات"
      - "CRM للشركات الصغيرة في السعودية"
    seo_title: "برنامج إدارة العملاء والمبيعات مع ربط واتساب | D3"
    seo_description: "إعداد Zoho أو HubSpot، تنظيم العملاء وقمع المبيعات، وربط الـCRM مع واتساب والبريد وقنوات عملك، مع تدريب الفريق."
    breadcrumb_label: "CRM"
    h1: "برنامج CRM لإدارة العملاء والمبيعات وربطه مع واتساب"
    intro: "برنامج يحفظ كل عميل ومكالمة وعرض سعر في مكان واحد، ويذكّر فريقك بالمتابعة ويعطيك تقرير عن المبيعات. (يُعرف تقنيًا بـ CRM)"
    provider_list_label: "الشركات المتوفرة"
    sections:
      - h2: "تنظيم بيانات العملاء والـLeads"
        body: "نعد لك Zoho CRM أو HubSpot لحفظ كل عميل ومكالمة وفرصة بيع في مكان واحد، بدل تشتتها بين الإكسل والواتساب والإيميل."
      - h2: "قمع المبيعات ومتابعة عروض الأسعار"
        body: "ننظم مراحل البيع من أول تواصل إلى إغلاق الصفقة، ونربط كل عرض سعر بالعميل والمرحلة اللي وصلها، حتى تعرف وين تقف كل صفقة."
      - h2: "أتمتة المتابعة والتذكير"
        body: "نعد تذكيرات ومهام تلقائية لفريق المبيعات حتى ما ينسون يتابعون عميل، مع رسائل متابعة تلقائية عبر البريد أو واتساب."
      - h2: "لوحات التقارير وتحليل المبيعات"
        body: "نبني لك لوحة تقارير توضح أداء فريق المبيعات، أكثر المصادر اللي تجيب عملاء، ومعدل تحويل العملاء المحتملين لعملاء فعليين."
      - h2: "خيارات مناسبة للسوق السعودي"
        body: "نساعد الشركات في السعودية تختار بين Zoho CRM وHubSpot وSalesforce وPipedrive حسب حجم فريق المبيعات واللغة والتكامل مع أنظمتها."
    quote_link_text: "اطلب عرض سعر"
  en:
    primary_keyword: "CRM setup with WhatsApp integration"
    secondary_keywords:
      - "Zoho CRM implementation Dubai"
      - "sales pipeline management software"
      - "follow-up automation for sales teams"
      - "sales reporting dashboards"
      - "HubSpot setup Saudi Arabia"
    seo_title: "CRM Setup with WhatsApp Integration for SMBs | D3"
    seo_description: "Zoho or HubSpot setup, organizing customers and the sales funnel, and connecting your CRM to WhatsApp, email, and your business channels — with team training."
    breadcrumb_label: "CRM"
    h1: "CRM Setup with WhatsApp Integration for Customer and Sales Management"
    intro: "A system that keeps every customer, call, and quote in one place, reminds your team to follow up, and gives you a sales report. (known technically as CRM)"
    provider_list_label: "Available providers"
    sections:
      - h2: "Zoho and HubSpot Setup for Customer and Lead Data"
        body: "We set up Zoho CRM or HubSpot to keep every customer, call, and sales opportunity in one place, instead of scattered across spreadsheets, WhatsApp, and email."
      - h2: "Sales Pipeline and Quote Tracking"
        body: "We organize your sales stages from first contact to closed deal, and link every quote to the customer and stage it's at, so you always know where each deal stands."
      - h2: "Automated Follow-Up Reminders"
        body: "We set up automatic reminders and tasks for your sales team so no customer follow-up gets missed, with automated follow-up messages by email or WhatsApp."
      - h2: "Sales Reporting Dashboards"
        body: "We build a reporting dashboard showing your sales team's performance, your best-performing lead sources, and your lead-to-customer conversion rate."
      - h2: "CRM Options for the Saudi Market"
        body: "We help companies in Saudi Arabia choose between Zoho CRM, HubSpot, Salesforce, and Pipedrive based on sales team size, language, and integration needs."
    quote_link_text: "Request a quote"

automation:
  order: 4
  eyebrow_number: "03"
  category_label: "Automation"
  service_name: "Business process automation"
  providers: ["Zapier", "Make", "n8n", "WhatsApp API", "Google Sheets", "REST APIs"]
  siblings: ["crm", "accounting-erp", "websites"]
  ar:
    primary_keyword: "أتمتة العمليات وربط الأنظمة"
    secondary_keywords:
      - "ربط المتجر الإلكتروني مع برنامج المحاسبة"
      - "نقل البيانات بين الأنظمة تلقائيًا"
      - "أتمتة الإشعارات والتقارير الدورية"
      - "تقليل الأخطاء اليدوية في العمليات"
      - "أدوات الأتمتة Zapier وMake"
    seo_title: "أتمتة العمليات وربط الأنظمة للشركات الصغيرة"
    seo_description: "نربط متجرك ونظامك المحاسبي والـCRM ببعضهم، وننقل البيانات تلقائياً، ونؤتمت الإشعارات والتقارير عبر واتساب والبريد."
    breadcrumb_label: "أتمتة العمليات"
    h1: "أتمتة العمليات وربط الأنظمة ببعضها"
    intro: "نربط متجرك الإلكتروني، نظامك المحاسبي، والـCRM ببعضهم، وننقل البيانات تلقائيًا بدل النسخ اليدوي بين الأنظمة."
    provider_list_label: "الأدوات المستخدمة"
    sections:
      - h2: "ربط المتجر بالمحاسبة والـCRM"
        body: "نربط متجرك الإلكتروني بنظام المحاسبة والـCRM حتى تنعكس كل عملية بيع تلقائيًا في حساباتك وبيانات عملائك، بدون إدخال يدوي مكرر."
      - h2: "نقل البيانات وتقليل العمل اليدوي"
        body: "ننقل البيانات تلقائيًا بين الأنظمة المختلفة اللي تستخدمها شركتك — بدل نسخ ولصق الأرقام كل يوم، ونقلل احتمال الأخطاء البشرية."
      - h2: "أتمتة الإشعارات والتقارير"
        body: "نبني لك إشعارات وتقارير تلقائية تصلك عبر واتساب أو البريد الإلكتروني، عن الطلبات الجديدة، المخزون المنخفض، أو أي حدث مهم في عملك."
      - h2: "لماذا تحتاج شركتك للأتمتة"
        body: "مع نمو عملك، النسخ اليدوي بين الأنظمة يصير مصدر أخطاء وتأخير — الأتمتة تقلل الأخطاء وتوفر وقت فريقك للمهام الأهم."
      - h2: "الأدوات التي نستخدمها"
        body: "نستخدم أدوات مجرّبة زي Zapier وMake وn8n لربط الأنظمة بدون الحاجة لبرمجة مخصصة في أغلب الحالات."
    quote_link_text: "اطلب عرض سعر"
  en:
    primary_keyword: "business process automation and system integration"
    secondary_keywords:
      - "connect online store to accounting software"
      - "automated data transfer between systems"
      - "WhatsApp Business API setup UAE"
      - "reduce manual work with workflow automation"
      - "Zapier and Make consultant Dubai"
    seo_title: "Business Process Automation & System Integration | D3"
    seo_description: "We connect your store, accounting system, and CRM to each other, move data automatically, and automate notifications and reports over WhatsApp and email."
    breadcrumb_label: "Automation"
    h1: "Business Process Automation and System Integration"
    intro: "We connect your online store, accounting system, and CRM to each other, and move data automatically instead of copying it by hand between systems."
    provider_list_label: "Tools we use"
    sections:
      - h2: "Connecting Your Store, CRM, and Accounting"
        body: "We connect your online store to your accounting system and CRM so every sale is automatically reflected in your accounts and customer data, without duplicate manual entry."
      - h2: "Moving Data Automatically Between Systems"
        body: "We move data automatically between the different systems your business uses — instead of copying and pasting numbers every day — cutting the chance of human error."
      - h2: "Automated Notifications Over WhatsApp and Email"
        body: "We build automated notifications and reports that reach you over WhatsApp or email — for new orders, low stock, or any important event in your business."
      - h2: "Why Your Business Needs Automation"
        body: "As your business grows, manual copying between systems becomes a source of errors and delays — automation reduces mistakes and frees up your team's time for higher-value work."
      - h2: "The Tools We Use"
        body: "We use proven tools like Zapier, Make, and n8n to connect your systems, without the need for custom-built code in most cases."
    quote_link_text: "Request a quote"

websites:
  order: 5
  eyebrow_number: "04"
  category_label: "Websites"
  service_name: "Websites and online stores"
  providers: ["Shopify", "Salla", "Zid", "WooCommerce", "Next.js"]
  siblings: ["noon-amazon", "automation", "crm"]
  ar:
    primary_keyword: "تصميم المواقع والمتاجر الإلكترونية"
    secondary_keywords:
      - "سلة أو زد أيهما أفضل"
      - "تصميم متجر إلكتروني على شوبيفاي"
      - "تصميم موقع شركة احترافي"
      - "ربط بوابات الدفع والشحن"
      - "تهيئة المتجر الإلكتروني لمحركات البحث"
    seo_title: "تصميم المواقع والمتاجر الإلكترونية: Shopify وسلة وNext.js"
    seo_description: "متاجر إلكترونية ومواقع شركات وصفحات هبوط، مع ربط الدفع والشحن وواتساب والتحليلات حسب احتياج مشروعك."
    breadcrumb_label: "مواقع ومتاجر إلكترونية"
    h1: "تصميم المواقع والمتاجر الإلكترونية"
    intro: "متاجر إلكترونية ومواقع شركات وصفحات هبوط، مع ربط الدفع والشحن وواتساب والتحليلات حسب احتياج مشروعك."
    provider_list_label: "المنصات المستخدمة"
    sections:
      - h2: "اختيار منصة متجرك: سلة أم زد"
        body: "كل منصة متاجر لها ميزاتها — سلة وزد منتشرتين بالسعودية وسهلتين للبداية، بينما Shopify يعطيك مرونة أكبر للتوسع دوليًا. نساعدك تختار الأنسب حسب سوقك المستهدف وميزانيتك."
      - h2: "متاجر Shopify للعلامات التجارية"
        body: "نصمم ونطلق متجرك على Shopify بتصميم يناسب علامتك التجارية، مع ربط طرق الدفع والشحن المناسبة لسوقك."
      - h2: "مواقع الشركات وصفحات الهبوط"
        body: "نصمم مواقع شركات وصفحات هبوط احترافية باستخدام Next.js، سريعة وسهلة التحديث، تعكس هوية علامتك التجارية."
      - h2: "ربط الدفع والشحن بمتجرك"
        body: "نربط متجرك ببوابات الدفع والشحن المحلية والدولية حسب احتياجك، حتى تكون تجربة الشراء والتوصيل سلسة لعملائك."
      - h2: "تهيئة متجرك لمحركات البحث"
        body: "نهيئ متجرك من ناحية السرعة والبنية التقنية ليكون جاهزًا للظهور في نتائج البحث، ونربطه بأدوات التحليل لمتابعة الزوار والمبيعات."
    quote_link_text: "اطلب عرض سعر"
  en:
    primary_keyword: "website and online store design"
    secondary_keywords:
      - "Salla or Zid which is better"
      - "Shopify developer Dubai"
      - "company website design"
      - "payment and shipping integration for online stores"
      - "SEO for online stores"
    seo_title: "Website & Online Store Design: Shopify, Salla, Next.js | D3"
    seo_description: "Online stores, company websites, and landing pages, with payment, shipping, WhatsApp, and analytics integrations tailored to your project."
    breadcrumb_label: "Websites"
    h1: "Website and Online Store Design"
    intro: "Online stores, company websites, and landing pages, with payment, shipping, WhatsApp, and analytics integrations tailored to your project's needs."
    provider_list_label: "Platforms we use"
    sections:
      - h2: "Choosing Your Online Store Platform"
        body: "Every store platform has its strengths — Salla and Zid are widely used in Saudi Arabia and easy to get started with, while Shopify gives you more flexibility to expand internationally. We help you choose the right fit for your target market and budget."
      - h2: "Shopify Stores for Growing Brands"
        body: "We design and launch your store on Shopify with a design that fits your brand, and connect the payment and shipping methods that suit your market."
      - h2: "Company Websites and Landing Pages"
        body: "We build professional company websites and landing pages using Next.js — fast, easy to update, and reflecting your brand identity."
      - h2: "Connecting Payments and Shipping"
        body: "We connect your store to local and international payment gateways and shipping providers based on your needs, so checkout and delivery feel seamless to your customers."
      - h2: "Preparing Your Store for Search"
        body: "We optimize your store's speed and technical structure so it's ready to show up in search results, and connect it to analytics tools to track visitors and sales."
    quote_link_text: "Request a quote"
```

- [ ] **Step 2: Write `_data/home.yml`**

```yaml
services_row: ["noon-amazon", "crm", "automation", "websites"]

stack_tools:
  stores: ["Amazon", "Noon", "Shopify", "Salla", "WooCommerce", "Zid"]
  accounting: ["Odoo", "Zoho Books", "SAP Business One", "Oracle NetSuite", "QuickBooks", "Xero"]
  crm: ["Zoho CRM", "HubSpot", "Salesforce", "Pipedrive"]
  hr: ["Zoho People", "Bayzat", "ZenHR", "Odoo HR"]
  automation: ["Zapier", "Make", "n8n", "WhatsApp API", "Google Sheets", "REST APIs"]

ar:
  primary_keyword: "حلول رقمية للشركات الصغيرة"
  secondary_keywords:
    - "خدمات رقمية للشركات الصغيرة بالإمارات والسعودية"
    - "برامج إدارة الأعمال للشركات الصغيرة"
    - "أنظمة وأدوات إدارة الأعمال في الإمارات"
    - "خطوات تنفيذ مشروع رقمي للشركة"
    - "استشارة مجانية لأتمتة الأعمال"
  seo_title: "حلول رقمية للشركات الصغيرة | نون وأمازون، محاسبة، CRM | D3"
  seo_description: "نساعد الشركات الصغيرة بالإمارات والسعودية على البيع عبر نون وأمازون، وإعداد برامج المحاسبة والفوترة الإلكترونية، وربط الأنظمة ببعضها. استشارة مجانية."
  hero:
    badge: "خبرة ٨ سنوات · الإمارات والسعودية"
    h1: "نقدّم حلول رقمية تساعد الشركات الصغيرة والمتوسطة تبيع أونلاين، وتنظّم مبيعاتها، وتربط أنظمتها ببعض."
    p: "خبرة ٨ سنوات في بيع حلول ERP وCRM في الإمارات، مع خبرة تقنية عملية في التجارة الإلكترونية، أتمتة الكتالوجات، ونقل البيانات بين الأنظمة."
    cta_primary: "تواصل عبر WhatsApp"
    cta_secondary: "شوف المنتجات"
  services_h2: "خدمات رقمية للشركات الصغيرة بالإمارات والسعودية"
  pricing_h2: "برامج إدارة الأعمال للشركات الصغيرة"
  products:
    erp: { eyebrow: "ERP", h3: "برامج حسابية وإدارة الشركة", p: "برنامج واحد يجمع الحسابات والفواتير والمخزون والمشتريات، بدل ملفات الإكسل المتفرقة. نساعدك تختار البرنامج المناسب لحجم شركتك ونشرف على التركيب والتدريب. (يُعرف تقنيًا بـ ERP)", link_service_id: "accounting-erp" }
    crm: { eyebrow: "CRM", h3: "برامج إدارة العملاء والمبيعات", p: "برنامج يحفظ كل عميل ومكالمة وعرض سعر في مكان واحد، ويذكّر فريقك بالمتابعة ويعطيك تقرير عن المبيعات. (يُعرف تقنيًا بـ CRM)", link_service_id: "crm" }
    hr: { eyebrow: "HR", h3: "برامج إدارة الموظفين والرواتب", p: "برنامج ينظّم ملفات الموظفين والرواتب والإجازات والحضور والانصراف، ويصدر الكشوفات تلقائيًا. (يُعرف تقنيًا بـ HR)", providers: ["Zoho People", "Bayzat", "ZenHR"], provider_list_label: "الشركات المتوفرة", quote_link_text: "اطلب عرض سعر" }
  footnote: "لكل برنامج أكثر من شركة مزوّدة، والسعر يعتمد على البرنامج وعدد المستخدمين وحجم العمل المطلوب. تواصل معنا ونرشّح لك الأنسب بدون التزام."
  stack_h2: "أنظمة وأدوات إدارة الأعمال في الإمارات"
  stack_intro: "نختار لك الأداة المناسبة من بين أدوات مجرّبة، ونتولى الإعداد والربط والتدريب."
  stack_tabs:
    - { key: "stores", label: "المتاجر والمنصات" }
    - { key: "accounting", label: "برامج حسابية" }
    - { key: "crm", label: "إدارة العملاء" }
    - { key: "hr", label: "الموظفين والرواتب" }
    - { key: "automation", label: "الأتمتة والربط" }
  process_h2: "خطوات تنفيذ مشروع رقمي للشركة"
  process_stages:
    - { number: "01", title: "الدراسة", items: ["فهم احتياج الشركة", "مراجعة الوضع الحالي", "ترشيح الحل المناسب", "تقدير التكلفة والمدة"] }
    - { number: "02", title: "الإعداد", items: ["تجهيز الحسابات والبيانات", "تصميم سير العمل", "ضبط الصلاحيات", "ربط القنوات"] }
    - { number: "03", title: "التنفيذ", items: ["التركيب والربط", "نقل البيانات", "اختبار كامل", "تعديل حسب الملاحظات"] }
    - { number: "04", title: "التشغيل", items: ["تدريب الفريق", "متابعة أول شهر", "تقارير دورية", "دعم وصيانة"] }
  contact_h2: "استشارة مجانية لأتمتة الأعمال"
  contact:
    whatsapp_label: "واتساب"
    email_label: "البريد"
    hours: "متاحون من الأحد إلى الخميس · نرد خلال يوم عمل."
    form_name: "الاسم"
    form_company: "اسم الشركة"
    form_whatsapp: "رقم WhatsApp"
    form_select_placeholder: "إيش تحتاج؟"
    form_select_options:
      - "نون وأمازون — إطلاق وإدارة"
      - "برامج حسابية وإدارة الشركة"
      - "برامج إدارة العملاء والمبيعات"
      - "برامج إدارة الموظفين والرواتب"
      - "أتمتة العمليات والربط"
      - "موقع أو متجر إلكتروني"
      - "غير ذلك / مو متأكد"
    form_note: "ملاحظة (اختياري)"
    form_submit: "أرسل الطلب"
    form_hint: "نرد خلال يوم عمل. سيفتح هذا واتساب لإرسال طلبك مباشرة."

en:
  primary_keyword: "digital solutions for small businesses UAE"
  secondary_keywords:
    - "digital services for SMBs in the UAE and Saudi Arabia"
    - "business management software for small companies"
    - "business tools and systems used in the UAE"
    - "steps to implement a digital project"
    - "free consultation for business automation"
  seo_title: "Marketplace, ERP & CRM Setup for SMBs in UAE & Saudi | D3"
  seo_description: "We help small businesses in the UAE and Saudi Arabia sell on noon and Amazon, set up accounting and CRM systems, and connect them together. Free consultation."
  hero:
    badge: "8 years of experience · UAE & KSA"
    h1: "Digital solutions for small businesses in the UAE and Saudi Arabia — we help you sell online, organize your sales, and connect your systems together."
    p: "8 years selling ERP and CRM solutions in the UAE, with hands-on technical experience in e-commerce, catalog automation, and data migration between systems."
    cta_primary: "Talk on WhatsApp"
    cta_secondary: "See products"
  services_h2: "Digital services for SMBs in the UAE and Saudi Arabia"
  pricing_h2: "Business management software for small companies"
  products:
    erp: { eyebrow: "ERP", h3: "Accounting & business management software", p: "One program that holds your accounts, invoices, inventory, and purchasing instead of scattered spreadsheets. We help you pick the right one for your company size and oversee setup and training. (known technically as ERP)", link_service_id: "accounting-erp" }
    crm: { eyebrow: "CRM", h3: "Customer & sales management software", p: "A program that keeps every customer, call, and quote in one place, reminds your team to follow up, and gives you a sales report. (known technically as CRM)", link_service_id: "crm" }
    hr: { eyebrow: "HR", h3: "Staff & payroll software", p: "A program that organizes staff files, payroll, leave, and attendance, and issues payslips automatically. (known technically as HR)", providers: ["Zoho People", "Bayzat", "ZenHR"], provider_list_label: "Available providers", quote_link_text: "Request a quote" }
  footnote: "Each program comes from several providers, and pricing depends on the program, user count, and scope of work. Talk to us and we'll recommend the best fit — no obligation."
  stack_h2: "Business tools and systems used in the UAE"
  stack_intro: "We choose the right tool for you from proven options, and handle setup, integration, and training."
  stack_tabs:
    - { key: "stores", label: "Stores & platforms" }
    - { key: "accounting", label: "Accounting software" }
    - { key: "crm", label: "Customer management" }
    - { key: "hr", label: "Staff & payroll" }
    - { key: "automation", label: "Automation & integration" }
  process_h2: "Steps to implement a digital project"
  process_stages:
    - { number: "01", title: "Discovery", items: ["Understanding your needs", "Reviewing the current setup", "Recommending the right fit", "Cost and timeline estimate"] }
    - { number: "02", title: "Setup", items: ["Accounts and data prep", "Workflow design", "Permissions setup", "Channel integrations"] }
    - { number: "03", title: "Delivery", items: ["Installation and integration", "Data migration", "Full testing", "Adjustments from feedback"] }
    - { number: "04", title: "Operation", items: ["Team training", "First-month follow-up", "Regular reporting", "Support and maintenance"] }
  contact_h2: "Free consultation for business automation"
  contact:
    whatsapp_label: "WhatsApp"
    email_label: "Email"
    hours: "Sunday to Thursday · we reply within one business day."
    form_name: "Name"
    form_company: "Company"
    form_whatsapp: "WhatsApp number"
    form_select_placeholder: "What do you need?"
    form_select_options:
      - "Noon & Amazon — launch and management"
      - "Accounting & business management software"
      - "Customer & sales management software"
      - "Staff & payroll software"
      - "Automation & integrations"
      - "Website or online store"
      - "Something else / not sure"
    form_note: "Note (optional)"
    form_submit: "Send request"
    form_hint: "We reply within one business day. This opens WhatsApp to send your request directly."
```

- [ ] **Step 3: Validate the YAML parses and both languages have equal structure**

```bash
bundle exec ruby -e "require 'yaml'; d = YAML.load_file('_data/services.yml'); d.each { |id, s| puts id + ': ' + s['ar']['sections'].length.to_s + ' ar sections, ' + s['en']['sections'].length.to_s + ' en sections' }"
bundle exec ruby -e "require 'yaml'; h = YAML.load_file('_data/home.yml'); puts h['ar'].keys.sort == h['en'].keys.sort"
```
Expected: all 5 services print `5 ar sections, 5 en sections`; the home.yml check prints `true` (same top-level keys in both languages — catches an accidentally-omitted field before it becomes a broken template render).

- [ ] **Step 4: Commit**

```bash
git add _data/services.yml _data/home.yml
git commit -m "Add bilingual content data for homepage and 5 service pages"
```

---

## Task 6: Shared body templates

**Files:**
- Create: `_includes/home-body.html`
- Create: `_includes/service-body.html`
- Create: `_includes/sibling-links.html` (renders from `_data/services.yml`, not from page front matter)

**Interfaces:**
- Consumes: `site.data.home`, `site.data.services`, `page.lang`, `page.service_id` (service pages only).
- Produces: the two `{% include %}` calls Task 7's 12 page files use — `{% include home-body.html %}` on `is_home` pages, `{% include service-body.html %}` on service pages.

- [ ] **Step 1: Write `_includes/home-body.html`**

```html
{% assign t = site.data.home[page.lang] %}
<section class="hero">
  <div class="hero-inner">
    <div class="hero-copy">
      <span class="badge">{{ t.hero.badge }}</span>
      <h1>{{ t.hero.h1 }}</h1>
      <p>{{ t.hero.p }}</p>
      <div class="hero-actions">
        <a href="{{ site.data.site.whatsapp_link }}" class="btn btn-primary">{{ t.hero.cta_primary }}</a>
        <a href="#pricing" class="btn btn-secondary">{{ t.hero.cta_secondary }}</a>
      </div>
    </div>
    <div class="hero-art"><span>{% if page.lang == 'ar' %}صورة الهيدر / لقطة لوحة{% else %}Hero image / dashboard shot{% endif %}</span></div>
  </div>
</section>

<section id="services" class="section">
  <div class="section-head">
    <h2 class="section-title">{{ t.services_h2 }}</h2>
    <div class="rule"></div>
  </div>
  <div class="service-links">
    {% for id in site.data.home.services_row %}
      {% assign svc = site.data.services[id] %}
      {% assign st = svc[page.lang] %}
      <a href="/{{ page.lang }}/{{ id }}/" class="service-link-card">
        <span class="service-link-dot"><span></span></span>
        <span><span class="service-link-title">{{ st.primary_keyword }}</span><span class="service-link-sub">{{ svc.eyebrow_number }} · {{ svc.category_label }}</span></span>
      </a>
    {% endfor %}
  </div>
</section>

<section id="pricing" class="section">
  <div class="section-head">
    <h2 class="section-title">{{ t.pricing_h2 }}</h2>
    <div class="rule"></div>
  </div>
  <div class="product-grid">
    {% assign product_keys = "erp,crm" | split: "," %}
    {% for key in product_keys %}
      {% assign card = t.products[key] %}
      {% assign linked_svc = site.data.services[card.link_service_id] %}
      {% assign linked_t = linked_svc[page.lang] %}
      <article class="product-card">
        <span class="eyebrow">{{ card.eyebrow }}</span>
        <h3>{{ card.h3 }}</h3>
        <p>{{ card.p }}</p>
        <div class="provider-list">
          <span class="provider-list-label">{{ linked_t.provider_list_label }}</span>
          {% for provider in linked_svc.providers %}<span class="provider"><span class="dot"></span>{{ provider }}</span>{% endfor %}
        </div>
        <a href="/{{ page.lang }}/{{ card.link_service_id }}/" class="quote-link">{{ linked_t.primary_keyword }}{{ site.data.i18n[page.lang].quote_link_suffix }}</a>
      </article>
    {% endfor %}
    <article class="product-card">
      <span class="eyebrow">{{ t.products.hr.eyebrow }}</span>
      <h3>{{ t.products.hr.h3 }}</h3>
      <p>{{ t.products.hr.p }}</p>
      <div class="provider-list">
        <span class="provider-list-label">{{ t.products.hr.provider_list_label }}</span>
        {% for provider in t.products.hr.providers %}<span class="provider"><span class="dot"></span>{{ provider }}</span>{% endfor %}
      </div>
      <a href="{{ site.data.site.whatsapp_link }}" class="quote-link">{{ t.products.hr.quote_link_text }}{{ site.data.i18n[page.lang].quote_link_suffix }}</a>
    </article>
  </div>
  <p class="footnote">{{ t.footnote }}</p>
</section>

<section id="stack" class="section">
  <div class="section-head" style="align-items:center;text-align:center">
    <h2 class="section-title">{{ t.stack_h2 }}</h2>
    <p style="margin:0;font-size:15px;line-height:1.8;color:var(--text-muted);max-width:640px">{{ t.stack_intro }}</p>
  </div>
  <div data-tabs>
    <div class="tabs-buttons">
      {% for tab in t.stack_tabs %}
        <button type="button" class="tab-button{% if forloop.first %} is-active{% endif %}" data-tab-button="{{ tab.key }}">{{ tab.label }}</button>
      {% endfor %}
    </div>
    {% for tab in t.stack_tabs %}
      <div data-tab-panel="{{ tab.key }}" class="tool-grid"{% unless forloop.first %} hidden{% endunless %}>
        {% for tool in site.data.home.stack_tools[tab.key] %}
          <div class="tool-card"><div class="tool-mark"></div><span class="tool-name">{{ tool }}</span></div>
        {% endfor %}
      </div>
    {% endfor %}
  </div>
  {% include vendor-disclaimer.html %}
</section>

<section id="process" class="section">
  <div class="section-head" style="align-items:center;text-align:center">
    <h2 class="section-title">{{ t.process_h2 }}</h2>
    <div class="rule"></div>
  </div>
  <div class="process-grid">
    {% for stage in t.process_stages %}
      <article class="process-card">
        <span class="process-step-number">{{ stage.number }}</span>
        <span class="rule"></span>
        <h3>{{ stage.title }}</h3>
        <ul>
          {% for item in stage.items %}<li><span class="step-dot"></span><span>{{ item }}</span></li>{% endfor %}
        </ul>
      </article>
    {% endfor %}
  </div>
</section>

<section id="contact" class="section">
  <div class="section-head">
    <h2 class="section-title">{{ t.contact_h2 }}</h2>
    <div class="rule"></div>
  </div>
  <div class="contact-grid">
    <div>
      <a href="{{ site.data.site.whatsapp_link }}" class="contact-card">
        <span class="contact-icon"><svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.257.59 4.463 1.712 6.408L3.2 28.8l6.56-1.712a12.74 12.74 0 0 0 6.244 1.6h.005c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.688-12.805-12.688Zm0 23.36h-.004a10.6 10.6 0 0 1-5.4-1.48l-.388-.23-4.03 1.052 1.075-3.93-.252-.404a10.56 10.56 0 0 1-1.62-5.64c0-5.86 4.77-10.63 10.63-10.63 2.84 0 5.51 1.108 7.518 3.117a10.56 10.56 0 0 1 3.112 7.52c0 5.86-4.77 10.625-10.64 10.625Zm5.83-7.96c-.32-.16-1.89-.932-2.183-1.04-.293-.107-.507-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.497-2.57-1.586-.95-.847-1.592-1.894-1.779-2.214-.186-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.735-.986-2.375-.26-.624-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.257 3.445 5.47 4.83.765.33 1.362.527 1.827.674.767.244 1.465.21 2.017.127.615-.092 1.89-.773 2.157-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.613-.373Z"></path></svg></span>
        <span><span class="contact-label">{{ t.contact.whatsapp_label }}</span><span class="contact-value" dir="ltr">{{ site.data.site.whatsapp_number_display }}</span></span>
      </a>
      <a href="mailto:{{ site.data.site.email }}" class="contact-card">
        <span class="contact-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2"></rect><path d="m3 6 9 6 9-6"></path></svg></span>
        <span><span class="contact-label">{{ t.contact.email_label }}</span><span class="contact-value" dir="ltr" style="overflow-wrap:anywhere">{{ site.data.site.email }}</span></span>
      </a>
      <p class="contact-hours">{{ t.contact.hours }}</p>
    </div>
    <form class="contact-form" onsubmit="event.preventDefault(); window.open('{{ site.data.site.whatsapp_link }}', '_blank');">
      <input type="text" placeholder="{{ t.contact.form_name }}">
      <input type="text" placeholder="{{ t.contact.form_company }}">
      <input type="text" placeholder="{{ t.contact.form_whatsapp }}">
      <select>
        <option value="">{{ t.contact.form_select_placeholder }}</option>
        {% for opt in t.contact.form_select_options %}<option>{{ opt }}</option>{% endfor %}
      </select>
      <textarea rows="3" placeholder="{{ t.contact.form_note }}"></textarea>
      <button type="submit">{{ t.contact.form_submit }}</button>
      <small>{{ t.contact.form_hint }}</small>
    </form>
  </div>
</section>
```

- [ ] **Step 2: Write `_includes/service-body.html`**

```html
{% assign svc = site.data.services[page.service_id] %}
{% assign t = svc[page.lang] %}
<section class="section" style="padding-top:56px">
  <div class="section-head">
    <span class="eyebrow">{{ svc.eyebrow_number }} · {{ svc.category_label }}</span>
    <h1>{{ t.h1 }}</h1>
    <div class="rule"></div>
  </div>
  <p style="font-size:16px;line-height:1.9;color:var(--text-muted);max-width:640px">{{ t.intro }}</p>

  {% for section in t.sections %}
    <h2>{{ section.h2 }}</h2>
    <p style="font-size:15px;line-height:1.9;color:var(--text-muted);max-width:640px">{{ section.body }}</p>
  {% endfor %}

  {% if svc.providers %}
    <div class="provider-list" style="max-width:420px;margin-top:24px">
      <span class="provider-list-label">{{ t.provider_list_label }}</span>
      {% for provider in svc.providers %}<span class="provider"><span class="dot"></span>{{ provider }}</span>{% endfor %}
    </div>
    {% include vendor-disclaimer.html %}
  {% endif %}

  {% if t.footnote %}<p style="font-size:14px;line-height:1.9;color:#7B869B;max-width:720px;margin-top:24px">{{ t.footnote }}</p>{% endif %}

  <a href="{{ site.data.site.whatsapp_link }}" class="btn btn-primary" style="margin-top:24px">{{ t.quote_link_text }}</a>

  {% include sibling-links.html %}
</section>
```

(Only `accounting-erp`, `crm`, `automation`, `websites` define `providers` in Task 5's data — `noon-amazon` doesn't, so its provider-list block and disclaimer are correctly skipped, matching the original bundle's design where marketplaces aren't styled as a "vendor" grid.)

- [ ] **Step 3: Write `_includes/sibling-links.html`**

```html
{% assign svc = site.data.services[page.service_id] %}
{% if svc.siblings %}
<nav class="sibling-links" aria-label="{{ site.data.i18n[page.lang].sibling_links_label }}">
  <span class="sibling-links-label">{{ site.data.i18n[page.lang].sibling_links_label }}</span>
  {% for sib_id in svc.siblings %}
    {% assign sib_t = site.data.services[sib_id][page.lang] %}
    <a href="/{{ page.lang }}/{{ sib_id }}/">{{ sib_t.primary_keyword }}</a>
  {% endfor %}
</nav>
{% endif %}
```

This is the key correctness win from the refactor: sibling anchor text is *looked up* from the target page's own `primary_keyword`, not hand-typed into a label field — it is structurally impossible for a sibling link's text to drift from what that target page actually targets.

- [ ] **Step 4: Build against the Task 2 stub and check for Liquid errors**

Run: `bundle exec jekyll build`
Expected: build still succeeds (the stub `ar/index.md` from Task 2 doesn't call these includes yet, so this just confirms no syntax errors in the new files). If you want to smoke-test rendering before Task 7, temporarily add `{% include home-body.html %}` to the stub, build, `grep` for a known string (e.g. `grep 'خبرة ٨ سنوات' _site/ar/index.html`), then remove the temporary include — Task 7 does this for real.

- [ ] **Step 5: Commit**

```bash
git add _includes/home-body.html _includes/service-body.html _includes/sibling-links.html
git commit -m "Add shared, data-driven body templates for home and service pages"
```

---

## Task 7: The 12 page files

**Files:**
- Create: `ar/index.md` (overwrites the Task 2 stub), `en/index.md`
- Create: `ar/noon-amazon/index.md`, `en/noon-amazon/index.md`
- Create: `ar/accounting-erp/index.md`, `en/accounting-erp/index.md`
- Create: `ar/crm/index.md`, `en/crm/index.md`
- Create: `ar/automation/index.md`, `en/automation/index.md`
- Create: `ar/websites/index.md`, `en/websites/index.md`

**Interfaces:**
- Consumes: `_layouts/page.html`, `_includes/home-body.html`, `_includes/service-body.html`, `_data/home.yml`, `_data/services.yml`.
- Produces: the 12 live routes.

Every file in this task follows one of two fixed shapes — front matter that identifies the page, then exactly one include call. There is no page-specific HTML left to write; that's the point of Tasks 5–6.

- [ ] **Step 1: Homepage — `ar/index.md`**

```markdown
---
layout: page
lang: ar
text_dir: rtl
permalink: /ar/
ar_permalink: /ar/
en_permalink: /en/
is_home: true
seo_title: "حلول رقمية للشركات الصغيرة | نون وأمازون، محاسبة، CRM | D3"
seo_description: "نساعد الشركات الصغيرة بالإمارات والسعودية على البيع عبر نون وأمازون، وإعداد برامج المحاسبة والفوترة الإلكترونية، وربط الأنظمة ببعضها. استشارة مجانية."
---
{% include home-body.html %}
```

- [ ] **Step 2: Homepage — `en/index.md`**

```markdown
---
layout: page
lang: en
text_dir: ltr
permalink: /en/
ar_permalink: /ar/
en_permalink: /en/
is_home: true
seo_title: "Marketplace, ERP & CRM Setup for SMBs in UAE & Saudi | D3"
seo_description: "We help small businesses in the UAE and Saudi Arabia sell on noon and Amazon, set up accounting and CRM systems, and connect them together. Free consultation."
---
{% include home-body.html %}
```

- [ ] **Step 3: The 5 service pages, Arabic** — one file each, only `permalink`/`service_id`/`seo_title`/`seo_description`/`breadcrumb_label` change between them (values come straight from the matching entry in `_data/services.yml`, Task 5):

`ar/noon-amazon/index.md`:
```markdown
---
layout: page
lang: ar
text_dir: rtl
permalink: /ar/noon-amazon/
ar_permalink: /ar/noon-amazon/
en_permalink: /en/noon-amazon/
service_id: "noon-amazon"
breadcrumb_label: "نون وأمازون"
seo_title: "إدارة متجر نون وأمازون: إطلاق ورفع منتجات وإدارة شهرية"
seo_description: "نفتح حساب البائع، نرفع الكتالوج بالعربي والإنجليزي، وندير الأسعار والمخزون والطلبات شهرياً على نون وأمازون في الإمارات والسعودية."
---
{% include service-body.html %}
```

`ar/accounting-erp/index.md`: same shape, `permalink: /ar/accounting-erp/`, `ar_permalink`/`en_permalink` matching, `service_id: "accounting-erp"`, `breadcrumb_label: "برامج حسابية وERP"`, `seo_title: "برنامج محاسبة وإدارة شركة للمنشآت الصغيرة بالإمارات والسعودية"`, `seo_description: "نساعدك تختار برنامج الحسابات والفواتير والمخزون المناسب لحجم شركتك، ونشرف على التركيب ونقل البيانات وتدريب فريقك."`.

`ar/crm/index.md`: `permalink: /ar/crm/`, `service_id: "crm"`, `breadcrumb_label: "CRM"`, `seo_title: "برنامج إدارة العملاء والمبيعات مع ربط واتساب | D3"`, `seo_description: "إعداد Zoho أو HubSpot، تنظيم العملاء وقمع المبيعات، وربط الـCRM مع واتساب والبريد وقنوات عملك، مع تدريب الفريق."`.

`ar/automation/index.md`: `permalink: /ar/automation/`, `service_id: "automation"`, `breadcrumb_label: "أتمتة العمليات"`, `seo_title: "أتمتة العمليات وربط الأنظمة للشركات الصغيرة"`, `seo_description: "نربط متجرك ونظامك المحاسبي والـCRM ببعضهم، وننقل البيانات تلقائياً، ونؤتمت الإشعارات والتقارير عبر واتساب والبريد."`.

`ar/websites/index.md`: `permalink: /ar/websites/`, `service_id: "websites"`, `breadcrumb_label: "مواقع ومتاجر إلكترونية"`, `seo_title: "تصميم المواقع والمتاجر الإلكترونية: Shopify وسلة وNext.js"`, `seo_description: "متاجر إلكترونية ومواقع شركات وصفحات هبوط، مع ربط الدفع والشحن وواتساب والتحليلات حسب احتياج مشروعك."`.

Every one of these 5 files ends with the identical single line: `{% include service-body.html %}`.

- [ ] **Step 4: The 5 service pages, English** — same pattern, `lang: en`, `text_dir: ltr`, `/en/...` permalinks, `ar_permalink` pointing at the sibling Arabic route:

`en/noon-amazon/index.md`: `permalink: /en/noon-amazon/`, `service_id: "noon-amazon"`, `breadcrumb_label: "noon & Amazon"`, `seo_title: "noon & Amazon Seller Setup and Store Management | D3"`, `seo_description: "Seller account setup, bilingual catalogue upload, pricing and inventory management for noon and Amazon sellers across the UAE and Saudi Arabia."`.

`en/accounting-erp/index.md`: `permalink: /en/accounting-erp/`, `service_id: "accounting-erp"`, `breadcrumb_label: "Accounting & ERP"`, `seo_title: "Accounting & ERP Software Setup for SMBs in UAE & Saudi | D3"`, `seo_description: "We help you choose the right accounting, invoicing, and inventory software for your company size, and oversee installation, data migration, and training."`.

`en/crm/index.md`: `permalink: /en/crm/`, `service_id: "crm"`, `breadcrumb_label: "CRM"`, `seo_title: "CRM Setup with WhatsApp Integration for SMBs | D3"`, `seo_description: "Zoho or HubSpot setup, organizing customers and the sales funnel, and connecting your CRM to WhatsApp, email, and your business channels — with team training."`.

`en/automation/index.md`: `permalink: /en/automation/`, `service_id: "automation"`, `breadcrumb_label: "Automation"`, `seo_title: "Business Process Automation & System Integration | D3"`, `seo_description: "We connect your store, accounting system, and CRM to each other, move data automatically, and automate notifications and reports over WhatsApp and email."`.

`en/websites/index.md`: `permalink: /en/websites/`, `service_id: "websites"`, `breadcrumb_label: "Websites"`, `seo_title: "Website & Online Store Design: Shopify, Salla, Next.js | D3"`, `seo_description: "Online stores, company websites, and landing pages, with payment, shipping, WhatsApp, and analytics integrations tailored to your project."`.

Every one of these 5 files ends with the identical single line: `{% include service-body.html %}`.

- [ ] **Step 5: Build and spot-check**

Run: `bundle exec jekyll build`
Run: `grep -c '<h1' _site/ar/index.html _site/en/index.html _site/ar/crm/index.html _site/en/websites/index.html` → expect `1` for each.
Run: `grep -c '<h2' _site/ar/crm/index.html` → expect `6` (5 content sections + 1 shared CTA banner heading from `_includes/cta-banner.html`, which every page carries).
Run: `grep -o 'href="/ar/[a-z-]*/">[^<]*<' _site/ar/noon-amazon/index.html` → expect the 3 sibling links, each with the sibling's actual `primary_keyword` text (compare against `_data/services.yml`, not a hand-typed label — there is none anymore).

- [ ] **Step 6: Commit**

```bash
git add ar en
git commit -m "Add the 12 thin page files rendering from shared body templates"
```

---

## Task 8: Keyword audit verification

**Files:**
- Read (no changes expected if Tasks 5–7 were followed correctly): `docs/superpowers/specs/2026-08-16-d3-keyword-audit.md`, `_data/services.yml`, `_data/home.yml`.

**Interfaces:**
- Consumes: `primary_keyword`/`secondary_keywords` from the two data files (the single source of truth now — not per-page front matter, since Task 6's refactor moved all content into data).
- Produces: a pass/fail gate — do not proceed to Task 9 until every check below passes.

- [ ] **Step 1: Every primary keyword appears in its page's `seo_title` and rendered `<h1>`**

```bash
bundle exec jekyll build
for f in ar/index en/index ar/noon-amazon/index en/noon-amazon/index ar/accounting-erp/index en/accounting-erp/index ar/crm/index en/crm/index ar/automation/index en/automation/index ar/websites/index en/websites/index; do
  echo "== $f =="
  grep -o '<title>[^<]*</title>' "_site/$f.html"
  grep -o '<h1>[^<]*</h1>' "_site/$f.html"
done
```
Expected: manually cross-reference each page's rendered `<title>` **and** `<h1>` against that page's `primary_keyword` in `_data/home.yml`/`_data/services.yml` — the keyword should be a recognizable substring/near-match of both. Check the rendered `<h1>`, not just the `seo_title:` front-matter line — a title can carry the keyword while the h1 (authored separately) omits it, which is a real gate failure, not a false positive.

- [ ] **Step 2: No `primary_keyword` is reused across two pages, in the same language**

```bash
bundle exec ruby -e "
require 'yaml'
services = YAML.load_file('_data/services.yml')
home = YAML.load_file('_data/home.yml')
['ar', 'en'].each do |lang|
  keys = services.map { |id, s| s[lang]['primary_keyword'] } + [home[lang]['primary_keyword']]
  dupes = keys.tally.select { |_, c| c > 1 }
  puts lang + ': ' + (dupes.empty? ? 'OK, no duplicate primaries' : 'CONFLICT: ' + dupes.keys.join(', '))
end
"
```
Expected: both lines print `OK, no duplicate primaries`.

- [ ] **Step 3: No `secondary_keywords` value is reused across two pages, in the same language, and every page has 4–8**

```bash
bundle exec ruby -e "
require 'yaml'
services = YAML.load_file('_data/services.yml')
home = YAML.load_file('_data/home.yml')
['ar', 'en'].each do |lang|
  all = []
  ([['home', home]] + services.map { |id, s| [id, s] }).each do |id, entry|
    kws = entry[lang]['secondary_keywords']
    puts id + ' (' + lang + '): ' + kws.length.to_s + ' secondaries' + (kws.length.between?(4,8) ? '' : ' -- OUT OF RANGE')
    all += kws
  end
  dupes = all.tally.select { |_, c| c > 1 }
  puts lang + ' cross-page dupes: ' + (dupes.empty? ? 'none' : dupes.keys.join(', '))
end
"
```
Expected: every count is 4–8 (Phase 1 pages should all show 5), and both "cross-page dupes" lines print `none`.

- [ ] **Step 4: Every page has one `<h2>` per secondary keyword**

```bash
for f in ar/crm en/crm ar/noon-amazon en/websites; do
  echo "$f: $(grep -c '<h2' _site/$f/index.html) h2s"
done
```
Expected: `6` for each — 5 content secondaries (matches Task 5's data) + 1 shared CTA banner `<h2 class="cta-heading">` that `_layouts/page.html` includes on every page via `_includes/cta-banner.html`. This extra heading isn't a secondary keyword and doesn't need its own row in the keyword audit — it's identical boilerplate across all 12 pages, not page-specific content.

- [ ] **Step 5: Internal anchor text matches the target's primary keyword — verified structurally, not just visually**

Since Task 6's `sibling-links.html` and the homepage's service/product cards *look up* `primary_keyword` from `_data/services.yml` rather than storing a separate label, this can't drift by construction — there is no second copy of the string to go stale. Confirm the lookup is actually wired up (not silently falling through to a blank) by checking the rendered output isn't empty:

```bash
grep -o '<a href="/ar/[a-z-]*/">[^<]*</a>' _site/ar/index.html
grep -o '<a href="/ar/[a-z-]*/">[^<]*</a>' _site/ar/noon-amazon/index.html
```
Expected: both print non-empty link text for every link (no `<a href="...">  </a>` or `<a href="...">Liquid error</a>`).

- [ ] **Step 6: If any check fails, fix `_data/services.yml`/`_data/home.yml` (the single source of truth) and re-run this task from Step 1.**

- [ ] **Step 7: Commit — only if Step 6 required edits**

Run `git status`. If it shows no changes, skip this step.

```bash
git add _data
git commit -m "Fix keyword-audit conflicts found during verification"
```

---

## Task 9: Sitemap, full-site verification, final commit

**Files:**
- Create: `sitemap.xml`

**Interfaces:**
- Consumes: the final list of 12 routes from Task 7.
- Produces: nothing further downstream (last task in Phase 1).

- [ ] **Step 1: Write `sitemap.xml`**

Same `layout: null` override as the root `index.html`/`404.html` (Task 2) — this file is a complete standalone XML document, not a page to wrap in the HTML site layout. The 5 service slugs are a plain hardcoded list rather than a loop over `site.data.services` — Task 8 already re-derives its checks from `_data/services.yml` directly, so this file doesn't need to be clever to stay in sync; a hardcoded list here is simpler to read and has zero Liquid-syntax risk. If Phase 2 adds a 6th service, add its slug to this one list.

```xml
---
permalink: /sitemap.xml
layout: null
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
{% assign routes = "/,/noon-amazon/,/accounting-erp/,/crm/,/automation/,/websites/" | split: "," %}
{% for route in routes %}
  <url>
    <loc>{{ site.data.site.url }}/ar{{ route }}</loc>
    <xhtml:link rel="alternate" hreflang="ar-AE" href="{{ site.data.site.url }}/ar{{ route }}"/>
    <xhtml:link rel="alternate" hreflang="ar-SA" href="{{ site.data.site.url }}/ar{{ route }}"/>
    <xhtml:link rel="alternate" hreflang="en-AE" href="{{ site.data.site.url }}/en{{ route }}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{{ site.data.site.url }}/ar{{ route }}"/>
  </url>
  <url>
    <loc>{{ site.data.site.url }}/en{{ route }}</loc>
    <xhtml:link rel="alternate" hreflang="ar-AE" href="{{ site.data.site.url }}/ar{{ route }}"/>
    <xhtml:link rel="alternate" hreflang="ar-SA" href="{{ site.data.site.url }}/ar{{ route }}"/>
    <xhtml:link rel="alternate" hreflang="en-AE" href="{{ site.data.site.url }}/en{{ route }}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{{ site.data.site.url }}/ar{{ route }}"/>
  </url>
{% endfor %}
</urlset>
```

- [ ] **Step 2: Full clean rebuild**

Run: `rm -rf _site .jekyll-cache && bundle exec jekyll build`
Expected: build succeeds with no warnings/errors.

- [ ] **Step 3: Verify all 12 content pages exist and are structurally correct**

```bash
for lang in ar en; do
  for route in "" noon-amazon accounting-erp crm automation websites; do
    f="_site/$lang/${route:+$route/}index.html"
    echo "== $f =="
    test -f "$f" && echo "exists" || echo "MISSING"
    grep -c '<h1' "$f"
    grep -o '<link rel="alternate" hreflang="[^"]*"' "$f" | grep -o 'hreflang="[^"]*"' | sort -u | wc -l
  done
done
```
Expected: every file exists, every file has exactly 1 `<h1>`, every file has 4 unique hreflang values. (The hreflang check is scoped to `<link rel="alternate"` — the nav's language-switch anchor also carries a legitimate, unrelated `hreflang` attribute that would otherwise inflate this count to 5.)

- [ ] **Step 4: Verify sitemap**

Run: `bundle exec jekyll build && cat _site/sitemap.xml | grep -c '<url>'`
Expected: `12`.

Run: `cat _site/robots.txt`
Expected: contains `Sitemap: https://d3moo.is-a.dev/sitemap.xml`.

- [ ] **Step 5: Verify the non-negotiable content constraints**

Run: `grep -riE "authorized partner|certified partner|zoho partner|شريك معتمد|وكيل معتمد" _data ar en _includes _layouts` (from the repo root)
Expected: no matches.

Run: `bundle exec ruby -e "require 'yaml'; s = YAML.load_file('_data/services.yml'); s.each { |id, svc| puts id + ': ' + (svc['providers'] ? 'has providers, needs disclaimer' : 'no providers, no disclaimer needed') }"`
Then confirm every service with `providers` renders the disclaimer: `for id in accounting-erp crm automation websites; do echo "$id: $(grep -c vendor-disclaimer _site/ar/$id/index.html)"; done` → expect `1` for each (the include renders one `<p class="vendor-disclaimer">`).

- [ ] **Step 6: Full local serve + click-through**

Run: `bundle exec jekyll serve --port 4000`
Manually visit `/`, `/ar/`, `/en/`, and all 5 service pages in both languages. Confirm:
- Every homepage service card and product link lands on a real page (no 404s), with visible text matching the target's primary keyword.
- Every service page's sibling-links row has 3 working links.
- The language-switch nav link on each page lands on the correct translated sibling (not the homepage).
- The 5 stack tabs on the homepage switch panels without a page reload.
- WhatsApp floating button and CTA banner link work on every page.
- `/broken-url` shows the 404 page in both languages.

- [ ] **Step 7: Commit**

```bash
git add sitemap.xml
git commit -m "Add hreflang-aware sitemap generated from services.yml; final Phase 1 verification"
```

- [ ] **Step 8: Report back to the user**

Summarize: 12 pages live (home + 5 services × 2 languages), rendered entirely from `_data/services.yml` + `_data/home.yml` + `_data/i18n.yml` through two shared body templates — zero hand-duplicated per-language HTML anywhere in the site. All Global Constraints satisfied. Phase 2 (e-invoicing page, About, FAQ, blog, analytics, Search Console/GBP) still pending as a separate plan. Do not push to the `main` branch / GitHub remote without explicit confirmation — pushing changes what's publicly live at `d3moo.is-a.dev`.
