---
section: 3
title: "Website Case Study"
project: "homedoc"
status: draft
generated: "2026-04-07T00:00:00Z"
---

# HomeDoc: Turning the Chaos of Homeownership into Clarity

## AI-Powered Home Intelligence for Owners, Contractors, and Partners

### The Challenge

Homeownership comes with an avalanche of complexity that most people never anticipated. Warranty documents sit in a drawer. Maintenance reminders live in someone's head. Insurance policies are filed and forgotten. Risk exposures — wildfire, flood, water contamination — go unassessed until it's too late.

The average homeowner manages dozens of appliances, hundreds of documents, and an opaque web of environmental risks, utility costs, and contractor relationships — with no central system to organize any of it. The result: missed maintenance, wasted energy, uninformed decisions, and costly surprises.

For contractors and home service professionals, the fragmentation is just as painful. Client data is scattered across CRMs, spreadsheets, and email chains. There's no reliable way to deliver ongoing value to customers between service calls, no easy way to help homeowners understand what they actually need.

### The Solution

Pandotic designed and built HomeDoc — a comprehensive home intelligence platform that uses AI to extract, analyze, and organize everything about a home. Rather than asking homeowners to manually enter data, HomeDoc reads their documents, scores their risks, tracks their systems, and plans their maintenance.

The platform serves three distinct audiences through a single architecture: homeowners managing their properties, professionals managing their clients, and platform partners embedding home intelligence into their own products.

### What It Does

HomeDoc starts with a smart onboarding flow that auto-fills property data from public records via RentCast — square footage, year built, HVAC type, heating fuel, and more — validated against a Street View image of the home. Default appliances are pre-selected based on the property profile. Within minutes, a homeowner has a structured digital inventory of their home.

From there, the platform branches into specialized intelligence modules:

**Document Intelligence** — Upload a utility bill, appliance label, warranty, insurance policy, inspection report, receipt, bid, or test result, and HomeDoc's AI extraction pipeline reads it. The system uses Google Gemini Flash for fast, cost-efficient extraction of simple documents, GPT-4o for complex multi-part inspection analysis, Google Vision for appliance nameplate OCR, and Unstructured.io for preprocessing multi-page PDFs. Every extraction passes through a user review step before persisting to the database — AI proposes, human approves.

**Risk Intelligence** — HomeDoc aggregates wildfire risk from five federal and state data sources (FEMA NRI, NIFC Historical, USGS Wildland Hazard, NOAA Weather, and CAL FIRE FHSZ), each cached at appropriate intervals from six hours to one year. It also assesses flood zones, earthquake risk, crime statistics, and climate risk — all tied to the property's exact location.

**Energy Intelligence** — Four standalone calculators (solar, battery, wind, community solar) provide instant ROI projections with editable assumptions. A Total Cost of Ownership engine compares 17 HVAC systems across 8 types and 3 tiers, with federal and state incentive lookup, climate-zone-aware energy modeling, and 25-year cost projections. An electrification roadmap scores a home's readiness for gas-to-electric conversion.

**Maintenance Intelligence** — Automated maintenance schedules tied to each appliance, with reminders based on system age, usage patterns, and manufacturer recommendations. Service history tracking creates a complete record of every repair and upgrade.

### Key Features

1. **Multi-Model AI Document Extraction** — Eight document types processed by four AI services, each selected for its strengths: fast and cheap (Gemini Flash), complex reasoning (GPT-4o), visual recognition (Google Vision), or document preprocessing (Unstructured.io). Per-call cost tracking ensures operational visibility.

2. **5-Source Composite Wildfire Risk Scoring** — The only system that aggregates FEMA, NIFC, USGS, NOAA, and CAL FIRE data into a single composite score with intelligent multi-tier caching. No single federal source tells the full story — HomeDoc combines them.

3. **FireShield Wildfire Defense Certification** — An 11-stage workflow from initial inquiry through IBHS certification, with contractor coordination, mitigation planning, work documentation, inspection scheduling, and renewal management.

4. **Total Cost of Ownership Calculator** — 17 HVAC systems with federal (IRA 25C/25D) and state incentive lookup, climate-zone-adjusted energy cost modeling, and year-by-year cost projections. Designed to expand to windows, insulation, solar, and batteries.

5. **Embeddable Widget Ecosystem** — 17+ standalone widgets that partners can embed on their websites with custom branding, email gates for lead capture, and webhook delivery to Make or Zapier. Domain whitelisting and analytics included.

6. **Smart Onboarding with Public Records Auto-Fill** — RentCast integration populates property data from public records, Street View shows the home, and 11 default appliances are pre-configured. Minutes from signup to a fully populated home profile.

### Why It Works Better

Most home management tools ask homeowners to do the work — enter data, remember schedules, research risks, compare contractors. HomeDoc inverts this model. AI reads your documents. Public data scores your risks. Algorithms plan your maintenance. The homeowner reviews and approves rather than researching and entering.

The multi-model AI approach is not a marketing label — it's an engineering decision. Gemini Flash handles a utility bill extraction for $0.001. GPT-4o applies the reasoning needed for a 50-page inspection report at $0.01. Google Vision reads a blurry appliance nameplate. Unstructured.io turns a multi-page PDF into structured markdown before any AI touches it. Each model does what it's best at.

The wildfire risk system exemplifies the same philosophy. No single data source captures the full picture — FEMA NRI provides national risk indices, NIFC tracks historical fire perimeters, USGS models wildland fire potential, NOAA delivers real-time weather conditions, and CAL FIRE maps fire hazard severity zones. HomeDoc's composite scoring weighs them all, cached at intervals that balance freshness with cost.

### Business Impact

HomeDoc transforms the homeowner experience from reactive to proactive — catching risks before they become emergencies, surfacing maintenance before systems fail, and providing data-driven comparisons before costly upgrades.

For contractors and professionals, the platform creates a persistent digital relationship with every client. The contractor portal provides client management, bid tools, referral networks, and white-label widget deployment — turning a service visit into an ongoing advisory relationship.

For platform partners, embeddable widgets generate qualified leads through email-gated risk assessments, energy calculations, and property intelligence — complete with webhook delivery for CRM integration.

### Responsible AI and Guardrails

HomeDoc's AI extraction pipeline includes deliberate human-in-the-loop checkpoints. Every AI extraction result is cached and presented to the user for review before it's written to the database. Field-level corrections are tracked, creating a feedback loop that documents where AI gets it right and where it needs oversight.

All external API calls are cost-tracked and rate-limited. The platform admin dashboard shows per-API health status, usage metrics, and cost trends. Server-side edge functions handle all AI calls — no API keys are exposed in the browser.

Inspection report analysis normalizes severity ratings across five different inspection software platforms (Spectora, HomeGauge, Horizon, Palm-Tech, and others), ensuring consistent risk assessment regardless of which tool the inspector used.

### Pandotic's Role

Pandotic designed the full product architecture, built the frontend application (React, TypeScript, Vite, TailwindCSS), the backend data layer (Supabase with 121 database migrations and 33 serverless edge functions), and the AI extraction pipeline. The modular architecture — 14 independent feature modules with standardized manifests — enables both rapid feature development and standalone deployment of individual capabilities.

### What's Next

HomeDoc is a platform designed to grow. The TCO calculator is architected to expand beyond HVAC into windows, insulation, solar, and battery storage. The widget system can package any module for partner distribution. The admin-configurable API registry means new data sources can be added with a database migration — no code deployment required.

If your organization helps people manage, protect, or improve their homes, HomeDoc is the intelligence layer that makes it possible at scale.

*Interested in learning more? [Get in touch](https://pandotic.ai/contact) to see HomeDoc in action.*
