# D3 — Digital Business Solutions: Site Rebuild Spec

**Repo:** dxbdxb416.github.io (GitHub Pages, custom domain `d3moo.is-a.dev` via `CNAME`)
**Owner contact found in content:** WhatsApp `+971 509733299` (`https://wa.me/971509733299`), email `d3@d3moo.is-a.dev`, Cal.com `https://cal.com/d3moo/30min`

## 0. Where this came from

The user uploaded `D3 Website(1).html` (456KB) at the repo root and asked to work on it. Investigation showed it is not plain HTML — it's a self-contained "bundled" export from an AI website-builder (internal name `dc-runtime`). Structure:

- An unpacker bootstrapper that decodes an embedded manifest (base64/gzip assets) and mounts the real page into the DOM at runtime.
- A manifest of 16 assets: 2 PNG logos (identical navy "D3." wordmark, 828×431, used at nav 26px / footer 20px height), 3 gzip JS bundles (React, ReactDOM, `dc-runtime`), 11 woff2 font files (Archivo weight 800 in 3 unicode subsets — vietnamese/latin-ext/latin; Tajawal weights 400/500/700/800 in 2 subsets — arabic/latin).
- The actual page markup as one JSON-escaped HTML string, containing `{{ mustache }}` bindings and `sc-camel-on-click` attributes that only resolve once the `dc-runtime` blob hydrates — i.e. it's not directly editable as static HTML.
- Bilingual content: every section exists twice (`id="*-b"` Arabic, `id="*-en"` English) inside one DOM, toggled via `display:none/block` — both languages ship to every visitor regardless of which is shown.

Full extracted copy is inventoried in §3 below. The raw uploaded file and the extraction working copy live under `docs/superpowers/specs/assets/d3-bundle-extract/` (not shipped — see Phase 1 Task 0).

## 1. What the site currently is vs. becomes

- **Current `index.html`** (tracked, live): a black & white "philosophical theme" personal portfolio (commit `201056c`), unrelated in content to D3.
- **New site**: a bilingual (Arabic-primary, English-secondary) B2B site for **D3 — Digital Business Solutions**, an 8-year ERP/CRM/e-commerce/automation consultancy serving UAE + Saudi SMBs. The Cal.com handle `d3moo` matches the domain `d3moo.is-a.dev`, confirming this is the same owner repositioning the site from personal to business.
- Proceeding with this rebuild means the current personal portfolio stops being served at `/`. It remains fully recoverable from git history; nothing is destroyed, just superseded. Flagged explicitly so the user can object before Phase 1 executes.

## 2. SEO brief (verbatim, as given by the user)

> # D3 — SEO Implementation Brief
>
> Markets: **UAE + Saudi Arabia**. Languages: **Arabic (primary)**, English (secondary).
>
> ### Non-negotiable rules
> 1. Never claim authorized partner status. Do not use `Zoho Partner`, `Authorized Partner`, `Certified Partner`, `شريك معتمد`, `وكيل معتمد` anywhere. Use `implementation services`, `consultant`, `خدمات إعداد وتنفيذ`, `استشاري` instead. Legal constraint, not style.
> 2. Vendor logos must not imply partnership — every vendor logo grid carries the disclaimer in §6.
> 3. Arabic and English must be separate routes — do NOT render both in one DOM with `display:none` (the old bundle does this; Google treats hidden duplicate content as a negative quality signal).
> 4. One `<h1>` per rendered page.
> 5. Every claim with a number must be true and verifiable.
>
> ### Route architecture
> ```
> /ar/                      homepage (Arabic — default)
> /ar/noon-amazon           marketplace service
> /ar/accounting-erp        accounting / ERP service
> /ar/e-invoicing-uae       ★ highest-priority content page
> /ar/crm                   CRM service
> /ar/automation            integration & automation service
> /ar/websites              websites & online stores
> /ar/about                 who is behind D3 (trust page)
> /ar/faq                   consolidated FAQ
> /ar/blog/<slug>           long-tail articles
> /en/…                     same tree, English
> ```
> Root `/` → redirect to `/ar/` (default) based on `Accept-Language`; self-referencing canonical on every page.
>
> hreflang on every page `<head>`:
> ```html
> <link rel="alternate" hreflang="ar-AE" href="https://DOMAIN/ar/PATH">
> <link rel="alternate" hreflang="ar-SA" href="https://DOMAIN/ar/PATH">
> <link rel="alternate" hreflang="en-AE" href="https://DOMAIN/en/PATH">
> <link rel="alternate" hreflang="x-default" href="https://DOMAIN/ar/PATH">
> ```
> `<html lang="ar" dir="rtl">` on Arabic routes, `<html lang="en" dir="ltr">` on English.
>
> ### Keyword → page map (full detail, condensed here — see original message for exhaustive per-keyword tables)
> - `/ar/` + `/en/`: brand/homepage terms only — homepage should NOT chase a service keyword, it distributes authority to service pages via internal links.
> - `/ar/noon-amazon`: نون/أمازون seller & store-management terms (AR + EN), competitors are freelancers not agencies — real service page outranks quickly.
> - `/ar/accounting-erp`: accounting software / ERP terms, incl. Saudi Zakat-authority-approved software terms.
> - `/ar/e-invoicing-uae` ★ **priority**: UAE e-invoicing terms. Mandatory for businesses under AED 50M from **1 July 2027**, ASP appointment deadline **31 March 2027**, structured PINT AE (UBL 2.1 XML) required — no existing simple Arabic explainer exists for small shop owners. **These specific facts (threshold, dates, format) must be independently verified against an official UAE Ministry of Finance / Federal Tax Authority source before publishing — do not ship them from memory.**
> - `/ar/crm`: CRM + WhatsApp integration terms.
> - `/ar/automation`: store↔accounting integration, WhatsApp Business API, Zapier/Make consultant terms.
> - `/ar/websites`: Salla vs Zid vs Shopify comparison terms.
> - Blog long-tail: 6 planned articles (ERP vs accounting software, CRM setup cost, noon catalog mistakes, store↔accounting integration, what is an ASP, Salla/Zid/Shopify comparison).
> - Modifiers: دبي, الإمارات, السعودية, الرياض, أبوظبي, الشارقة, للشركات الصغيرة, أسعار, تكلفة, مقارنة, بديل, شرح بالعربي.
> - Do NOT target (saturated/unavailable): `ERP software UAE`, `best CRM Dubai`, `IT solutions Dubai`, `web design company Dubai`, `digital transformation`, `Zoho Partner *`.
>
> ### Titles & meta descriptions (≤60 char titles, 150–160 char descriptions; AR titles ~55 chars — Arabic renders wider)
>
> | Route | Title | Meta description |
> |---|---|---|
> | `/ar/` | حلول رقمية للشركات الصغيرة \| نون وأمازون، محاسبة، CRM \| D3 | نساعد الشركات الصغيرة بالإمارات والسعودية على البيع عبر نون وأمازون، وإعداد برامج المحاسبة والفوترة الإلكترونية، وربط الأنظمة ببعضها. استشارة مجانية. |
> | `/en/` | Marketplace, ERP & CRM Setup for SMBs in UAE & Saudi \| D3 | We help small businesses in the UAE and Saudi Arabia sell on noon and Amazon, set up accounting and CRM systems, and connect them together. Free consultation. |
> | `/ar/noon-amazon` | إدارة متجر نون وأمازون: إطلاق ورفع منتجات وإدارة شهرية | نفتح حساب البائع، نرفع الكتالوج بالعربي والإنجليزي، وندير الأسعار والمخزون والطلبات شهرياً على نون وأمازون في الإمارات والسعودية. |
> | `/en/noon-amazon` | noon & Amazon Seller Setup and Store Management \| D3 | Seller account setup, bilingual catalogue upload, pricing and inventory management for noon and Amazon sellers across the UAE and Saudi Arabia. |
> | `/ar/accounting-erp` | برنامج محاسبة وإدارة شركة للمنشآت الصغيرة بالإمارات والسعودية | نساعدك تختار برنامج الحسابات والفواتير والمخزون المناسب لحجم شركتك، ونشرف على التركيب ونقل البيانات وتدريب فريقك. |
> | `/ar/e-invoicing-uae` | الفوترة الإلكترونية في الإمارات: ماذا تفعل شركتك قبل ٢٠٢٧ | شرح مبسّط لمتطلبات الفوترة الإلكترونية الإماراتية، المواعيد حسب حجم الشركة، ومعنى مزوّد الخدمة المعتمد، وكيف تجهّز نظامك المحاسبي. |
> | `/ar/crm` | برنامج إدارة العملاء والمبيعات مع ربط واتساب \| D3 | إعداد Zoho أو HubSpot، تنظيم العملاء وقمع المبيعات، وربط الـCRM مع واتساب والبريد وقنوات عملك، مع تدريب الفريق. |
> | `/ar/automation` | أتمتة العمليات وربط الأنظمة للشركات الصغيرة | نربط متجرك ونظامك المحاسبي والـCRM ببعضهم، وننقل البيانات تلقائياً، ونؤتمت الإشعارات والتقارير عبر واتساب والبريد. |
> | `/ar/websites` | تصميم المواقع والمتاجر الإلكترونية: Shopify وسلة وNext.js | متاجر إلكترونية ومواقع شركات وصفحات هبوط، مع ربط الدفع والشحن وواتساب والتحليلات حسب احتياج مشروعك. |
>
> (English equivalents for accounting-erp/crm/automation/websites were not separately specified — Phase 1 mirrors the Arabic meta intent into idiomatic English, kept under the char limits.)
>
> ### On-page rules
> - Primary keyword in `<h1>` and within the first 100 words.
> - `<h2>` per major section, secondary keywords live there naturally.
> - Every page links to ≥2 sibling service pages with descriptive anchor text (not "click here").
> - Every service page links to `/ar/faq` and the contact CTA — **Phase 1 note:** `/ar/faq` doesn't exist yet (Phase 2), so Phase 1 pages link only to sibling services + the contact CTA and omit the FAQ link until it ships, to avoid dead links.
> - Descriptive `alt` text in the page's language (not `alt="D3"`).
> - Lowercase, hyphenated URLs, no query params.
>
> ### Structured data (JSON-LD)
> - Site-wide `ProfessionalService` (name, url, image, email, telephone, areaServed UAE+KSA, address Dubai/AE, knowsLanguage ar/en, hasOfferCatalog with the 5 services).
> - Per service page: `Service` with `provider` referencing the above.
> - Any page with a FAQ block: `FAQPage` (only markup Q&As actually visible on the page).
> - Blog articles: `Article` with dates/author/inLanguage.
> - `BreadcrumbList` on all non-home routes.
>
> ### Vendor logo disclaimer (below any vendor logo grid, ~12px muted)
> - AR: `أسماء المنتجات والعلامات التجارية المذكورة ملك لأصحابها. ذكرها هنا يشير إلى خبرتنا في العمل عليها ولا يعني شراكة أو اعتماد رسمي.`
> - EN: `All product names and trademarks are the property of their respective owners. Their appearance here indicates hands-on experience, not partnership or official endorsement.`
>
> ### Technical checklist
> - [ ] sitemap.xml with both language trees + `<xhtml:link>` alternates
> - [ ] robots.txt pointing at sitemap
> - [ ] self-referencing canonical on every page
> - [ ] Fonts: subset AR+Latin, max 3 weights, self-hosted, `font-display:swap`, preload body weight only (currently 11 woff2 files — cut it)
> - [ ] Drop React entirely — only interactivity is tabs + language toggle
> - [ ] Lazy-load below-fold images, explicit width/height (no CLS)
> - [ ] OG + Twitter card tags per page, per-language OG image
> - [ ] Favicon set
> - [ ] Analytics (Plausible or GA4) with goals on form submit + WhatsApp click
> - [ ] 404 page in both languages
> - [ ] Search Console + Bing Webmaster, submit sitemap
> - [ ] Google Business Profile for Dubai
>
> ### Implementation order
> 1. Un-bundle to plain routes + head metadata + hreflang ← unblocks everything
> 2. Homepage AR/EN with correct title/meta/schema
> 3. `/ar/e-invoicing-uae` + `/en/` version ← highest ROI, time-limited
> 4. Five service pages
> 5. FAQ + About + case studies
> 6. Blog long-tail, one article/week

## 3. Content inventory extracted from the bundle (source of truth for Phase 1 copy)

All AR/EN pairs below are 1:1 translations already present in the original bundle (`docs/superpowers/specs/assets/d3-bundle-extract/extracted_template.html`). Phase 1 tasks copy this verbatim into the new page bodies (reflowed to match each route's H1/keyword target from §2), rather than rewriting from scratch.

### Nav labels
- AR: الخدمات (#services) · المنتجات (#pricing) · تواصل (#contact) · toggle button → "English"
- EN: Services (#services) · Products (#pricing) · Contact (#contact) · toggle button → "العربية"
- Logo: img `D3.` wordmark + label "Digital Business Solutions" (EN) / "Digital Business Solutions" (kept in English even on AR nav, per original)

### Hero
- AR badge: `خبرة ٨ سنوات · الإمارات والسعودية` — EN badge: `8 years of experience · UAE & KSA`
- AR H1: `نساعد الشركات الصغيرة والمتوسطة تبيع أونلاين، وتنظّم مبيعاتها، وتربط أنظمتها ببعض.`
- EN H1: `We help small and mid-sized businesses sell online, organize their sales, and connect their systems together.`
- AR body: `خبرة ٨ سنوات في بيع حلول ERP وCRM في الإمارات، مع خبرة تقنية عملية في التجارة الإلكترونية، أتمتة الكتالوجات، ونقل البيانات بين الأنظمة.`
- EN body: `8 years selling ERP and CRM solutions in the UAE, with hands-on technical experience in e-commerce, catalog automation, and data migration between systems.`
- CTAs: primary → WhatsApp (`تواصل عبر WhatsApp` / `Talk on WhatsApp`), secondary → `#pricing` (`شوف المنتجات` / `See products`)

### Services (4) — AR / EN, each has 3 sub-points except CRM/Automation/Websites which have 3 flat paragraphs
1. **نون وأمازون / Noon & Amazon** (Marketplace)
   - إطلاق/Launch: `من فتح حساب البائع والتحقق، إلى إعداد المتجر ورفع الكتالوج وتجهيز المنتجات للبيع — عربي وإنجليزي، صور بمواصفات المنصة، SKU وفاريانتس.` / `From seller account opening and verification to store setup, catalog upload, and getting products ready to sell — Arabic and English, platform-spec images, SKUs and variants.`
   - إدارة شهرية/Monthly management: `تحديث الأسعار والمخزون، متابعة الطلبات والمرتجعات، ومراقبة أداء المنتجات بتقرير شهري.` / `Price and inventory updates, order and return handling, and product performance monitoring with a monthly report.`
   - نمو/Growth: `تحسين صفحات المنتجات، العروض والإعلانات، وتحليل المنافسين والأداء.` / `Product page optimization, promotions and ads, plus competitor and performance analysis.`
2. **إعداد وربط / Setup & integration** (CRM)
   - `إعداد Zoho أو HubSpot وتنظيم العملاء والـLeads وقمع المبيعات.` / `Zoho or HubSpot setup, organizing customers, Leads, and the sales funnel.`
   - `أتمتة المتابعة وإنشاء لوحات تقارير تساعدك تعرف أين تذهب مبيعاتك.` / `Follow-up automation and reporting dashboards so you know where your sales are going.`
   - `ربط الـCRM مع أدوات وقنوات العمل التي تستخدمها الشركة.` / `Connecting the CRM with the tools and channels your business already uses.`
3. **أتمتة العمليات / Operations automation** (Business Automation)
   - `ربط المتجر والـCRM والأنظمة مع بعضها.` / `Connecting the store, the CRM, and your systems to each other.`
   - `نقل البيانات تلقائيًا بين الأنظمة وتقليل العمل اليدوي.` / `Moving data automatically between systems and cutting manual work.`
   - `أتمتة الـWorkflows والإشعارات والتقارير عبر WhatsApp والبريد الإلكتروني وغيرها.` / `Automating Workflows, notifications, and reports over WhatsApp, email, and more.`
4. **مواقع / Websites**
   - `متاجر إلكترونية على Shopify.` / `E-commerce stores on Shopify.`
   - `مواقع شركات وLanding Pages باستخدام Next.js.` / `Company websites and Landing Pages built with Next.js.`
   - `ربط الدفع والشحن وWhatsApp والتحليلات حسب احتياج المشروع.` / `Payment, shipping, WhatsApp, and analytics integrations as the project needs.`

### Products / Pricing (3 cards)
1. **ERP** — `برامج حسابية وإدارة الشركة` / `Accounting & business management software`
   AR: `برنامج واحد يجمع الحسابات والفواتير والمخزون والمشتريات، بدل ملفات الإكسل المتفرقة. نساعدك تختار البرنامج المناسب لحجم شركتك ونشرف على التركيب والتدريب. (يُعرف تقنيًا بـ ERP)`
   EN: `One program that holds your accounts, invoices, inventory, and purchasing instead of scattered spreadsheets. We help you pick the right one for your company size and oversee setup and training. (known technically as ERP)`
   Providers: Odoo, Zoho, SAP Business One, Oracle NetSuite
2. **CRM** — `برامج إدارة العملاء والمبيعات` / `Customer & sales management software`
   AR: `برنامج يحفظ كل عميل ومكالمة وعرض سعر في مكان واحد، ويذكّر فريقك بالمتابعة ويعطيك تقرير عن المبيعات. (يُعرف تقنيًا بـ CRM)`
   EN: `A program that keeps every customer, call, and quote in one place, reminds your team to follow up, and gives you a sales report. (known technically as CRM)`
   Providers: Zoho CRM, HubSpot, Salesforce
3. **HR** — `برامج إدارة الموظفين والرواتب` / `Staff & payroll software` — **homepage only, no dedicated route in Phase 1**
   AR: `برنامج ينظّم ملفات الموظفين والرواتب والإجازات والحضور والانصراف، ويصدر الكشوفات تلقائيًا. (يُعرف تقنيًا بـ HR)`
   EN: `A program that organizes staff files, payroll, leave, and attendance, and issues payslips automatically. (known technically as HR)`
   Providers: Zoho People, Bayzat, ZenHR
   Footnote AR: `لكل برنامج أكثر من شركة مزوّدة، والسعر يعتمد على البرنامج وعدد المستخدمين وحجم العمل المطلوب. تواصل معنا ونرشّح لك الأنسب بدون التزام.`
   Footnote EN: `Each program comes from several providers, and pricing depends on the program, user count, and scope of work. Talk to us and we'll recommend the best fit — no obligation.`

### Tools/Stack (5 tabbed categories)
1. المتاجر والمنصات / Stores & platforms: Amazon, Noon, Shopify, Salla, WooCommerce, Zid
2. برامج حسابية / Accounting: Odoo, Zoho Books, SAP Business One, Oracle NetSuite, QuickBooks, Xero
3. إدارة العملاء / CRM: Zoho CRM, HubSpot, Salesforce, Pipedrive
4. الموظفين والرواتب / HR: Zoho People, Bayzat, ZenHR, Odoo HR
5. الأتمتة والربط / Automation: Zapier, Make, n8n, WhatsApp API, Google Sheets, REST APIs

Intro AR: `نختار لك الأداة المناسبة من بين أدوات مجرّبة، ونتولى الإعداد والربط والتدريب.`
Intro EN: `We choose the right tool for you from proven options, and handle setup, integration, and training.`
**Every one of these grids needs the §2 vendor disclaimer directly beneath it — the old bundle didn't have one.**

### Process (4 stages)
1. الدراسة/Discovery: فهم احتياج الشركة / مراجعة الوضع الحالي / ترشيح الحل المناسب / تقدير التكلفة والمدة — Understanding your needs / Reviewing the current setup / Recommending the right fit / Cost and timeline estimate
2. الإعداد/Setup: تجهيز الحسابات والبيانات / تصميم سير العمل / ضبط الصلاحيات / ربط القنوات — Accounts and data prep / Workflow design / Permissions setup / Channel integrations
3. التنفيذ/Delivery: التركيب والربط / نقل البيانات / اختبار كامل / تعديل حسب الملاحظات — Installation and integration / Data migration / Full testing / Adjustments from feedback
4. التشغيل/Operation: تدريب الفريق / متابعة أول شهر / تقارير دورية / دعم وصيانة — Team training / First-month follow-up / Regular reporting / Support and maintenance

### CTA banner
AR: `تحتاج مساعدة؟` / `استشارة مجانية — نحدد احتياجك ونرشّح الحل` → button `ابدأ الآن` → `https://cal.com/d3moo/30min`
EN: `Need help?` / `Free consultation — we scope your need and recommend a fit` → button `Start now`

### Contact
- WhatsApp card: `+971 509733299` → `https://wa.me/971509733299`
- Email card: `d3@d3moo.is-a.dev`
- Availability AR: `متاحون من الأحد إلى الخميس · نرد خلال يوم عمل.` EN: `Sunday to Thursday · we reply within one business day.`
- Form fields (AR/EN): Name/الاسم, Company/اسم الشركة, WhatsApp number/رقم WhatsApp, a "what do you need" select with the 6 services + "something else", optional note textarea, submit button. **Note:** original `onSubmit` just does `window.open('https://wa.me/971509733299')` — there's no real form backend. Phase 1 keeps this behavior (mailto/wa.me handoff) rather than inventing a fake backend.
- Floating WhatsApp button, bottom-left (AR is RTL so "left" = start side in the original — confirm placement reads naturally in both directions).

### Footer
`© 2026 D3 · جميع الحقوق محفوظة` / `© 2026 D3 · All rights reserved`, footer logo (same PNG as nav).

## 4. Architecture decisions (made with the user during scoping)

- **Build system: Jekyll**, native to GitHub Pages — no local build step required for GitHub's own deploy, but Ruby 3.3.8 + Jekyll 4.4.1 + Bundler 4.0.18 were installed locally in this environment specifically so plans can be verified with a real `jekyll build`/`jekyll serve` before pushing.
- Content lives as Markdown/HTML with front matter under `ar/` and `en/`; shared chrome (nav, footer, head/SEO, disclaimer, CTA banner) lives in `_includes/`; site-wide constants (phone, email, cal link, nav labels) live in `_data/site.yml`.
- GitHub Pages cannot do a real server-side `Accept-Language` 302 (static hosting, no server logic) — root `/index.html` instead ships a tiny static page with a `<meta http-equiv="refresh">` defaulting to `/ar/` plus a same-tick JS override to `/en/` when the browser's language is English. This satisfies the brief's intent ("defaulting to /ar/") within GH Pages' constraints.
- `jekyll-sitemap` plugin was considered but dropped in favor of a small hand-written `sitemap.xml` (12 known URLs) — the plugin can't emit the required per-URL `<xhtml:link>` hreflang alternates without fighting its template override mechanism, and for only 12 URLs a plain Liquid loop is simpler and easier to verify correct.
- **OG image is a known Phase 1 limitation.** There's no real product photography or dashboard screenshots in the source content (the original bundle used gray placeholder boxes everywhere) — Phase 1 ships the navy logo PNG as a single shared `og:image`/`twitter:image` for every page rather than inventing per-page social-share art or fabricating screenshots. Revisit with real photography once available; this is not a Phase 1 blocker since it doesn't affect on-page SEO, only social-share card appearance.
- Fonts: **drop Archivo entirely.** It's declared via `@font-face` in the bundle (3 files, weight 800, vietnamese/latin-ext/latin subsets) but grep confirms it's never referenced by any real page element's `font-family` — every element sets `Tajawal, sans-serif` or inherits it. The only place "Archivo" appears applied is the bundler's own throwaway loading-screen SVG, which isn't page content. Keep all 4 Tajawal weights (400/500/700/800 — all four are genuinely used: 500 on the hero badge, others on body/headings/nav) in both subsets (arabic/latin) = 8 files. Cuts 11 font files to 8, and removes an entire unused typeface rather than just trimming subsets.

## 5. Phase split

The full brief spans far more than one cohesive, independently-testable deliverable (per the writing-plans skill's scope check). Split:

- **Phase 1** (this plan): Jekyll scaffold, shared includes/layout/schema/disclaimer, homepage (AR+EN), the 5 service pages that already have source copy (noon-amazon, accounting-erp, crm, automation, websites — AR+EN), root redirect, robots.txt, sitemap, asset pipeline (logo + trimmed fonts), CSS, and the vanilla-JS tab/lang-toggle replacing React. Ships a complete, deployable, SEO-correct bilingual site.
- **Phase 2** (separate plan, not yet written): `/ar/e-invoicing-uae` (blocked on independently verifying the AED 50M / 1 July 2027 / 31 March 2027 / PINT AE facts against an official source — do not draft this content from memory), `/about`, `/faq`, blog articles, analytics wiring, Search Console/Bing/GBP setup (mostly manual, non-code).
