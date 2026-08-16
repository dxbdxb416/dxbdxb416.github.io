# D3 Site — Keyword Audit (Phase 1: home + 5 service pages, AR + EN)

Governs Tasks 5–10 of `docs/superpowers/plans/2026-08-16-d3-phase1-jekyll-core-site.md`. AR and EN are independent indexes (different search results, different language markets) — uniqueness is enforced separately within each, not across the two.

**Rules applied:**
- One primary keyword per page → drives `<title>`, the single `<h1>`, and the first ~100 words.
- No primary keyword, or its *distinctive* component words, is reused as another page's primary (generic audience/geo modifiers — `للشركات الصغيرة`/`small business`/`UAE`/`Dubai` — are excluded from this check; the brief itself lists them as cross-cutting modifiers meant to combine with everything, not page-distinguishing terms).
- 5 secondary keywords per page (within the 4–8 range), one per `<h2>`.
- No secondary keyword phrase repeats across pages, in either direction (a phrase used as a secondary on page A cannot appear as a secondary — or primary — on page B).
- Internal links to a page use that page's primary keyword as anchor text.

## AR pages

| Keyword | Page | Role | Intent |
|---|---|---|---|
| حلول رقمية للشركات الصغيرة | `/ar/` | primary | informational/brand |
| خدمات رقمية للشركات الصغيرة بالإمارات والسعودية | `/ar/` | secondary (H2: الخدمات) | commercial |
| برامج إدارة الأعمال للشركات الصغيرة | `/ar/` | secondary (H2: المنتجات) | commercial |
| أنظمة وأدوات إدارة الأعمال في الإمارات | `/ar/` | secondary (H2: الأدوات) | informational |
| خطوات تنفيذ مشروع رقمي للشركة | `/ar/` | secondary (H2: كيف نشتغل) | informational |
| استشارة مجانية لأتمتة الأعمال | `/ar/` | secondary (H2: تواصل) | commercial |
| إدارة متجر نون وأمازون | `/ar/noon-amazon/` | primary | commercial |
| فتح حساب بائع في نون | `/ar/noon-amazon/` | secondary (H2: فتح حساب البائع والتحقق) | informational |
| رفع منتجات على نون وأمازون | `/ar/noon-amazon/` | secondary (H2: رفع الكتالوج وتجهيز المنتجات) | commercial |
| تحديث الأسعار والمخزون في نون | `/ar/noon-amazon/` | secondary (H2: الإدارة الشهرية للمتجر) | commercial |
| تحسين صفحات المنتجات وزيادة المبيعات | `/ar/noon-amazon/` | secondary (H2: تحسين الأداء والنمو) | commercial |
| شروط البيع على نون في السعودية | `/ar/noon-amazon/` | secondary (H2: شروط البيع والمستندات المطلوبة) | informational |
| برنامج محاسبة للشركات الصغيرة | `/ar/accounting-erp/` | primary | commercial |
| نظام إدارة مخزون ومشتريات | `/ar/accounting-erp/` | secondary (H2: إدارة المخزون والمشتريات) | commercial |
| ربط النظام المحاسبي مع منصة فاتورة | `/ar/accounting-erp/` | secondary (H2: التوافق مع الفوترة الإلكترونية) | commercial |
| نظام ERP للشركات الصغيرة والمتوسطة | `/ar/accounting-erp/` | secondary (H2: اختيار نظام ERP المناسب) | commercial |
| برنامج محاسبة معتمد من هيئة الزكاة | `/ar/accounting-erp/` | secondary (H2: التوافق مع متطلبات هيئة الزكاة) | informational |
| تدريب الفريق على البرنامج المحاسبي | `/ar/accounting-erp/` | secondary (H2: التركيب والتدريب) | commercial |
| ربط CRM مع واتساب | `/ar/crm/` | primary | commercial |
| برنامج إدارة عملاء عربي | `/ar/crm/` | secondary (H2: تنظيم بيانات العملاء والـLeads) | commercial |
| قمع المبيعات ومتابعة العروض | `/ar/crm/` | secondary (H2: قمع المبيعات ومتابعة عروض الأسعار) | commercial |
| أتمتة متابعة العملاء | `/ar/crm/` | secondary (H2: أتمتة المتابعة والتذكير) | commercial |
| تقارير ولوحات مبيعات | `/ar/crm/` | secondary (H2: لوحات التقارير وتحليل المبيعات) | informational |
| CRM للشركات الصغيرة في السعودية | `/ar/crm/` | secondary (H2: خيارات مناسبة للسوق السعودي) | commercial |
| أتمتة العمليات وربط الأنظمة | `/ar/automation/` | primary | commercial |
| ربط المتجر الإلكتروني مع برنامج المحاسبة | `/ar/automation/` | secondary (H2: ربط المتجر بالمحاسبة والـCRM) | commercial |
| نقل البيانات بين الأنظمة تلقائيًا | `/ar/automation/` | secondary (H2: نقل البيانات وتقليل العمل اليدوي) | commercial |
| أتمتة الإشعارات والتقارير الدورية | `/ar/automation/` | secondary (H2: أتمتة الإشعارات والتقارير) | commercial |
| تقليل الأخطاء اليدوية في العمليات | `/ar/automation/` | secondary (H2: لماذا تحتاج شركتك للأتمتة) | informational |
| أدوات الأتمتة Zapier وMake | `/ar/automation/` | secondary (H2: الأدوات التي نستخدمها) | informational |
| تصميم المواقع والمتاجر الإلكترونية | `/ar/websites/` | primary | commercial |
| سلة أو زد أيهما أفضل | `/ar/websites/` | secondary (H2: اختيار منصة متجرك: سلة أم زد) | informational |
| تصميم متجر إلكتروني على شوبيفاي | `/ar/websites/` | secondary (H2: متاجر Shopify للعلامات التجارية) | commercial |
| تصميم موقع شركة احترافي | `/ar/websites/` | secondary (H2: مواقع الشركات وصفحات الهبوط) | commercial |
| ربط بوابات الدفع والشحن | `/ar/websites/` | secondary (H2: ربط الدفع والشحن بمتجرك) | commercial |
| تهيئة المتجر الإلكتروني لمحركات البحث | `/ar/websites/` | secondary (H2: تهيئة متجرك لمحركات البحث) | informational |

**AR conflict check:** 6 primaries, 30 secondaries, 36 rows — every phrase is a unique string. Shared *distinctive* head-words across different pages' phrases (`إدارة`, `ربط`, `متجر`, `برنامج`) always sit in different compound phrases pointing at different, non-competing search intents (e.g. `ربط CRM مع واتساب` on the CRM page vs `ربط المتجر الإلكتروني مع برنامج المحاسبة` on the automation page — different objects being connected, matching the brief's own §2 table which lists these as separate targets for separate routes). No two rows collide. **Resolved, no conflicts.**

## EN pages

| Keyword | Page | Role | Intent |
|---|---|---|---|
| digital solutions for small businesses UAE | `/en/` | primary | informational/brand |
| digital services for SMBs in the UAE and Saudi Arabia | `/en/` | secondary (H2: Services) | commercial |
| business management software for small companies | `/en/` | secondary (H2: Products) | commercial |
| business tools and systems used in the UAE | `/en/` | secondary (H2: Tools we use) | informational |
| steps to implement a digital project | `/en/` | secondary (H2: How we work) | informational |
| free consultation for business automation | `/en/` | secondary (H2: Contact) | commercial |
| noon and Amazon store management | `/en/noon-amazon/` | primary | commercial |
| noon seller account setup | `/en/noon-amazon/` | secondary (H2: Seller account opening and verification) | commercial |
| bilingual catalogue upload for noon and Amazon | `/en/noon-amazon/` | secondary (H2: Catalogue upload and product setup) | commercial |
| pricing and inventory management for online sellers | `/en/noon-amazon/` | secondary (H2: Monthly price and inventory management) | commercial |
| product page optimization for marketplaces | `/en/noon-amazon/` | secondary (H2: Growth and performance optimization) | commercial |
| amazon.ae seller services | `/en/noon-amazon/` | secondary (H2: Amazon.ae seller support) | commercial |
| accounting software for small business Dubai | `/en/accounting-erp/` | primary | commercial |
| inventory and purchasing management software | `/en/accounting-erp/` | secondary (H2: Inventory and purchasing management) | commercial |
| Odoo implementation Dubai | `/en/accounting-erp/` | secondary (H2: Choosing the right ERP system) | commercial |
| small business ERP system UAE | `/en/accounting-erp/` | secondary (H2: ERP for growing companies) | commercial |
| accounting software data migration | `/en/accounting-erp/` | secondary (H2: Setup, data migration, and training) | commercial |
| e-invoicing ready accounting software | `/en/accounting-erp/` | secondary (H2: Staying ready for e-invoicing requirements) | informational |
| CRM setup with WhatsApp integration | `/en/crm/` | primary | commercial |
| Zoho CRM implementation Dubai | `/en/crm/` | secondary (H2: Zoho and HubSpot setup) | commercial |
| sales pipeline management software | `/en/crm/` | secondary (H2: Organizing leads and the sales pipeline) | commercial |
| follow-up automation for sales teams | `/en/crm/` | secondary (H2: Automated follow-ups and reminders) | commercial |
| sales reporting dashboards | `/en/crm/` | secondary (H2: Reporting and sales dashboards) | informational |
| HubSpot setup Saudi Arabia | `/en/crm/` | secondary (H2: CRM options for the Saudi market) | commercial |
| business process automation and system integration | `/en/automation/` | primary | commercial |
| connect online store to accounting software | `/en/automation/` | secondary (H2: Connecting your store, CRM, and accounting) | commercial |
| automated data transfer between systems | `/en/automation/` | secondary (H2: Moving data automatically) | commercial |
| WhatsApp Business API setup UAE | `/en/automation/` | secondary (H2: Automated notifications over WhatsApp and email) | commercial |
| reduce manual work with workflow automation | `/en/automation/` | secondary (H2: Why your business needs automation) | informational |
| Zapier and Make consultant Dubai | `/en/automation/` | secondary (H2: The tools we use) | informational |
| website and online store design | `/en/websites/` | primary | commercial |
| Salla or Zid which is better | `/en/websites/` | secondary (H2: Choosing your online store platform) | informational |
| Shopify developer Dubai | `/en/websites/` | secondary (H2: Shopify stores for growing brands) | commercial |
| company website design | `/en/websites/` | secondary (H2: Company websites and landing pages) | commercial |
| payment and shipping integration for online stores | `/en/websites/` | secondary (H2: Connecting payments and shipping) | commercial |
| SEO for online stores | `/en/websites/` | secondary (H2: Preparing your store for search) | informational |

**EN conflict check:** same structure, 36 unique rows, no exact-phrase duplicates. `CRM` recurs across the CRM page's own rows only (expected — it's that page's whole subject) and once inside `e-invoicing ready accounting software` has no CRM overlap; `store`/`WhatsApp` recur across noon-amazon/websites/automation but in non-competing compounds for the same reason as the AR set. **Resolved, no conflicts.**

## Internal anchor text convention (applies everywhere in Tasks 5–10)

Any link from one of these 12 pages to another of these 12 pages uses the target page's **primary keyword** as the visible anchor text — not a short UI label. Concretely:

- Homepage → service pages: the 4 service-link cards' visible title text becomes the primary keyword phrase (`إدارة متجر نون وأمازون`, `ربط CRM مع واتساب`, `أتمتة العمليات وربط الأنظمة`, `تصميم المواقع والمتاجر الإلكترونية`), and the 2 product-card "Details" links (ERP card → accounting-erp, CRM card → crm) use `برنامج محاسبة للشركات الصغيرة` / `ربط CRM مع واتساب` respectively instead of a generic "التفاصيل ←" / "Details →".
- Service page → sibling service pages (`sibling_links` front matter): label text becomes each sibling's primary keyword, not the short category name used in the first draft of the plan.
- In-page anchors (`#services`, `#pricing`, `#contact` in the nav) are wayfinding within the same document, not backlinks to another page's content — they keep their short UI labels; this rule doesn't apply to them.
