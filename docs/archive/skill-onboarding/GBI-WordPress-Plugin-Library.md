# GBI WordPress Plugin Library & Maintenance Guide

## Source Site: Home Energy Planner (likely — based on solar/power calculators)
*This plugin list should be audited per site — each GBI site may have a different set.*

---

## Plugin Inventory by Category

### SEO & Internal Linking (Core — Used by `content-publisher` + `site-maintenance` skills)

| Plugin | Status | Version | Auto-Update | Role in Workflow | Notes |
|--------|--------|---------|-------------|-----------------|-------|
| **Rank Math SEO** | Active | 1.0.264.1 | On | Primary SEO plugin. Set keywords, meta descriptions, schema, sitemaps | PAID (Pro) — Core tool |
| **Rank Math SEO PRO** | Active | 3.0.107 | — | Pro features: analytics, custom schema, news/video sitemaps | PAID — Core tool |
| **Linksy** | Active | 1.1.56 | On | AI-powered internal linking, keyword extraction | PAID — Core tool. **UPDATE AVAILABLE → 1.1.83** |
| **Linksy Pilot** | Active | 1.0.33 | On | AI keyphrase generation, paragraph rewriting for link insertion | PAID — Core tool. **UPDATE AVAILABLE → 1.0.36** |
| **Linkbot** | Active | 1.2.0 | On | Automated internal linking via JS snippet | Possible overlap with Linksy — **REVIEW: do you need both?** |
| **Broken Link Checker** | Active | 2.4.7 | On | Find/fix broken links (Cloud + Local modes) | Free — replaces/complements AISEO for broken links |

### Page Builder & Design (Core — Site Structure)

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **Elementor** | Active | 3.35.5 | On | Primary page builder | PAID (Pro) — Cannot deactivate (dependency) |
| **Elementor Pro** | Active | 3.35.1 | On | Theme builder, popups, forms, WooCommerce | PAID — Core tool |
| **Elementor TOC Widget** | Active | 1.0.0 | — | Table of Contents for posts | Free add-on |
| **Exclusive Addons Elementor** | Active | 2.7.9.8 | On | Additional Elementor widgets | Free |
| **Exclusive Addons Elementor Pro** | Active | 1.5.9.3 | Off | Premium Elementor widgets | PAID. **UPDATE AVAILABLE → 1.5.9.4** |
| **Exclusive WebGL** | Active | 1.0.0 | — | WebGL effects for Elementor | Niche — is this used? |
| **Astra Pro** | Active | 4.12.2 | — | Theme enhancement add-on | PAID — Core theme |

### Crocoblock Suite (Dynamic Content)

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **JetElements** | Active | 2.7.12.1 | On | Content modules for Elementor | PAID. **UPDATE AVAILABLE → 2.8.0.2** (scheduled in 2hrs) |
| **JetEngine** | Active | 3.7.8 | On | Custom post types, taxonomies, meta boxes | PAID. **UPDATE AVAILABLE → 3.8.5** (scheduled in 2hrs) |
| **JetMenu** | Active | 2.4.17 | On | Mega menu builder | PAID. **UPDATE AVAILABLE → 2.4.18** (scheduled in 2hrs) |
| **JetSmartFilters** | Active | 3.7.0 | On | AJAX filters for dynamic listings | PAID. **UPDATE AVAILABLE → 3.7.4.1** (scheduled in 2hrs) |

### Content & Publishing (Used by `content-publisher` skill)

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **PublishPress Authors** | Active | 4.11.0 | Off | Multiple/guest authors on posts | Core for bylined articles. **UPDATE AVAILABLE → 4.12.0** |
| **Post Type Switcher** | Active | 4.0.1 | On | Change post types | Utility |
| **Pages with Category and Tag** | Active | 0.9.0 | On | Add categories/tags to pages | Utility |
| **Advanced Sidebar Menu** | Inactive | — | On | Dynamic menus by parent/child | **INACTIVE — consider deleting** |
| **Bulk Page Creator** | Active | 1.1.4 | On | Batch create pages | Utility — one-time use? |
| **Bulk Post Category Creator** | Active | 1.7 | On | Batch create categories | Utility — one-time use? |
| **WordPress Importer** | Active | 0.9.5 | On | Import WP export files | Migration utility |
| **TablePress** | Active | 3.2.7 | On | Embed tables in posts | Content tool |
| **WPCode Lite** | Active | 2.3.4 | On | Add code snippets to header/footer | Utility |

### Affiliate & Monetization (Used by `content-publisher` skill)

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **Affiliatable** | Active | 2.6 | On | Sync Affiliatable dashboard with WP | PAID — Affiliate management |
| **Grow for WP** | Active | 1.5.3 | On | Content sharing/engagement tool | Mediavine? Check if active |

*Note: Lasso (mentioned in scope doc) is NOT installed on this site. Should it be?*

### Site-Specific Tools (Home Energy Planner)

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **Solar Calculator** | Active | 1.1.4 | Off | PV system yield/savings calculator | Site-specific |
| **Power Calculator** | Active | 1.0 | — | Power load/inverter/solar sizing | Site-specific |
| **ConvertCalculator** | Active | 2.0.7 | On | No-code calculators and forms | Site-specific interactive tools |
| **US Map** | Active | 2.7 | — | Interactive US state map | Site-specific |
| **Solar Wizard Lite** | Inactive | 1.2.5 | Off | Solar estimate calculator | **INACTIVE — replaced by Solar Calculator? Delete?** |
| **US Regional Map** | Inactive | 2.7 | Off | Regional US map | **INACTIVE — consider deleting** |

### Analytics (Used by `analytics-reviewer` skill)

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **Plausible Analytics** | Active | 2.5.0 | Off | Privacy-friendly analytics | Alternative to GA4. **UPDATE AVAILABLE → 2.5.6** |

*Note: GA4 is used via Looker Studio per the scope doc. Plausible is an additional layer.*

### Forms & Contact

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **Contact Form 7** | Active | 6.1.5 | On | Contact forms | Standard |
| **WPForms Lite** | Inactive | 1.9.9.3 | Off | Drag & drop form builder | **INACTIVE — using CF7 instead? Delete?** |

### Security & Backup

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **UpdraftPlus** | Active | 1.26.1 | Off | Backup & restore | Core — keep. **Enable auto-updates?** |
| **Security Optimizer** | Inactive | 1.5.9 | On | SiteGround security suite | **INACTIVE — should this be active?** |

### Performance

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **Image optimization by Optimole** | Inactive | 4.2.1 | On | Image compression/CDN | **INACTIVE — consider activating for page speed** |
| **Speed Optimizer** | Inactive | 7.7.7 | On | SiteGround caching/performance | **INACTIVE — should this be active?** |

### Hosting / Setup (SiteGround)

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **SiteGround Central** | Inactive | 3.3.1 | — | SiteGround onboarding | **INACTIVE — safe to delete** |
| **One Click Demo Import** | Inactive | 3.4.0 | On | Import demo content | **INACTIVE — safe to delete (one-time use)** |

### Integrations & Automation

| Plugin | Status | Version | Auto-Update | Role | Notes |
|--------|--------|---------|-------------|------|-------|
| **Zapier for WordPress** | Inactive | 1.5.3 | Off | Auto-share posts, create from Mailchimp, etc. | **INACTIVE — could be useful for automation. Review.** |

---

## Immediate Action Items

### Updates Needed NOW (6 plugins)

| Plugin | Current | Available | Risk |
|--------|---------|-----------|------|
| Linksy | 1.1.56 | **1.1.83** | Medium — SEO tool, test after update |
| Linksy Pilot | 1.0.33 | **1.0.36** | Medium — companion to Linksy |
| Exclusive Addons Pro | 1.5.9.3 | **1.5.9.4** | Low — minor update |
| PublishPress Authors | 4.11.0 | **4.12.0** | Medium — affects author display |
| Plausible Analytics | 2.5.0 | **2.5.6** | Low — analytics only |
| JetElements/Engine/Menu/Filters | Various | Various | Auto-updating in 2 hours |

### Plugins to Review for Deletion (7 inactive)

| Plugin | Why Consider Deleting |
|--------|----------------------|
| Advanced Sidebar Menu | Inactive, likely unused |
| Solar Wizard Lite | Inactive, replaced by Solar Calculator |
| US Regional Map | Inactive, US Map is active |
| WPForms Lite | Inactive, using Contact Form 7 |
| SiteGround Central | Onboarding tool, no longer needed |
| One Click Demo Import | One-time setup tool |
| Image optimization by Optimole | Inactive — but consider ACTIVATING instead |

### Plugins to Review for Activation (3 currently off)

| Plugin | Why Consider Activating |
|--------|------------------------|
| Speed Optimizer (SiteGround) | Page speed improvement — free with SiteGround hosting |
| Security Optimizer (SiteGround) | Brute-force protection, login security — free with hosting |
| Zapier for WordPress | Could automate post-to-social workflows before Followr skill is built |

### Overlap/Redundancy Review

| Concern | Plugins | Question |
|---------|---------|----------|
| Internal linking | Linksy + Linksy Pilot + Linkbot | Do you need Linkbot AND Linksy? They overlap. |
| Forms | Contact Form 7 + WPForms Lite (inactive) | CF7 is active — delete WPForms? |
| Broken links | Broken Link Checker + AISEO (external) | BLC is installed — do you also need the AISEO external tool? |
| Analytics | Plausible + GA4/Looker | Using both intentionally, or consolidate? |

---

## Plugin-to-Skill Mapping

### `content-publisher` skill needs to know about:
- **Rank Math SEO / PRO** — Set primary/secondary keywords, meta descriptions, schema
- **Linksy / Linksy Pilot** — Internal linking, keyphrase insertion
- **PublishPress Authors** — Guest author assignment for bylined articles
- **Affiliatable** — Affiliate link integration (replaces Lasso on this site?)
- **Elementor / Pro** — Page builder for post layout
- **TablePress** — For data tables in posts
- **Pages with Category and Tag** — Category/tag assignment

### `site-maintenance` skill needs to know about:
- **Broken Link Checker** — Run scans, fix broken links (built-in, may not need AISEO)
- **UpdraftPlus** — Verify backups are running
- **All plugins with pending updates** — Weekly update check
- **Speed Optimizer / Security Optimizer** — Ensure they're active and configured
- **Optimole** — Image optimization if activated

### `social-promoter` skill could leverage:
- **Zapier for WordPress** — Auto-trigger social posts on publish (bridge to Followr?)
- **Grow for WP** — Content sharing features

---

## Cross-Site Plugin Audit (TODO)

This list is from ONE site. Each GBI site likely has different plugins. To build comprehensive skills, we need to audit:

- [ ] SafeMama — plugins list
- [ ] Help My Boomer — plugins list
- [ ] WildfireProtect — plugins list
- [ ] Thermostating — plugins list
- [ ] FireShield Defense — plugins list
- [ ] ThankBetter — plugins list

**Key questions per site:**
1. Is Lasso installed? (scope doc mentions it but it's not on this site)
2. Is Linksy installed on all sites or just this one?
3. Which sites have Rank Math Pro vs. free?
4. Are Crocoblock plugins (Jet*) on all sites or just HomeEP?
5. Does each site use the same theme (Astra)?

---

## Recommended Plugin Stack (Standard Across All GBI Sites)

Based on the scope doc and this audit, here's what SHOULD be on every site:

### Must-Have (install on all sites)
| Plugin | Purpose |
|--------|---------|
| Rank Math SEO + PRO | SEO management |
| Linksy + Linksy Pilot | Internal linking |
| Broken Link Checker | Link health |
| Elementor + Pro | Page builder |
| Astra Pro | Theme |
| PublishPress Authors | Guest/multiple authors |
| UpdraftPlus | Backups |
| Contact Form 7 | Forms |
| WPCode Lite | Custom code snippets |

### Recommended (install where applicable)
| Plugin | Purpose | Which Sites |
|--------|---------|-------------|
| Affiliatable or Lasso | Affiliate management | SafeMama, HomeEP (product-focused sites) |
| Plausible Analytics | Privacy-friendly analytics | All (complement GA4) |
| Speed Optimizer | Performance | All (SiteGround sites) |
| Security Optimizer | Security | All (SiteGround sites) |
| TablePress | Data tables | Sites with comparison content |
| Grow for WP | Content sharing | All |

### Site-Specific Only
| Plugin | Site |
|--------|------|
| Solar Calculator, Power Calculator, ConvertCalculator | Home Energy Planner |
| US Map | Home Energy Planner |
| Crocoblock (JetEngine, JetElements, etc.) | Only where dynamic content is needed |
