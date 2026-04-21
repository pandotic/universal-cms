---
section: 8
title: "Standout Features"
project: "homedoc"
status: draft
generated: "2026-04-07T00:00:00Z"
---

# HomeDoc — Standout Features

## 1. Multi-Model AI Document Extraction

**What it does:** Upload any of 8 home document types — utility bills, appliance labels, warranties, insurance policies, inspection reports, receipts, contractor bids, or test results — and HomeDoc extracts structured data automatically using the AI model best suited for each type.

**User impact:** No manual data entry. A homeowner uploads a photo of an appliance nameplate and gets make, model, serial number, BTU rating, and fuel type extracted and linked to their inventory. A 50-page inspection report becomes a categorized list of findings with severity ratings and recommended projects.

**Business impact:** This is the flywheel that populates the entire platform. Every uploaded document feeds the appliance inventory, risk profile, maintenance schedule, and warranty tracker. The more documents a user uploads, the more intelligent their home profile becomes.

**Differentiation:** Four AI services, each selected for its strengths: Google Gemini Flash for fast, cheap extraction ($0.001/call); GPT-4o for complex multi-part reasoning (inspection reports with 5-part output); Google Vision for OCR on physical labels; Unstructured.io for multi-page PDF preprocessing. Per-call cost tracking and a human review gate before database persistence.

**Extensible?** Highly. The extraction pipeline, prompt registry, and review-before-persist pattern can be applied to any domain that processes heterogeneous documents — insurance, legal, healthcare, property management.

---

## 2. 5-Source Composite Wildfire Risk Scoring

**What it does:** Aggregates wildfire risk data from five independent federal and state sources — FEMA National Risk Index, NIFC Historical Fire Perimeters, USGS Wildland Hazard Potential, NOAA Real-Time Weather, and CAL FIRE Fire Hazard Severity Zones — into a single composite risk score for any property.

**User impact:** No single data source tells the full wildfire story. FEMA provides national risk indices but misses local severity. NOAA has current weather but no historical context. CAL FIRE maps are California-only. HomeDoc combines them all so homeowners get the most complete picture available.

**Business impact:** Wildfire risk is the gateway to the FireShield certification workflow, contractor referrals, and mitigation projects — a natural upsell path from awareness to action.

**Differentiation:** Multi-source composite scoring with per-source caching at different intervals (NOAA weather: 6 hours; FEMA NRI: 90 days; CAL FIRE zones: 365 days). The caching architecture minimizes API costs while maintaining appropriate freshness for each data type.

**Extensible?** The composite scoring + multi-tier caching pattern applies to any domain that needs to aggregate multiple data sources with different freshness requirements — commercial property risk, supply chain risk, insurance underwriting.

---

## 3. FireShield Wildfire Defense Certification

**What it does:** Manages the complete lifecycle of wildfire home defense — from initial property assessment through contractor-managed mitigation work to IBHS (Insurance Institute for Business and Home Safety) certification. An 11-stage pipeline tracks: inquiry, assessment scheduling, assessment completion, proposal delivery, acceptance, work scheduling, work progress, work completion, inspection scheduling, inspection pass, and certification submission.

**User impact:** Wildfire-certified homes can qualify for insurance discounts and increased property value. The workflow coordinates between the homeowner, assessment contractors, installation contractors, and inspectors — replacing phone calls and spreadsheets with a structured pipeline.

**Business impact:** FireShield creates a three-sided marketplace: homeowners get certified, contractors get qualified leads, and the platform captures the coordination layer. The 11-stage pipeline creates persistent engagement.

**Differentiation:** End-to-end certification workflow management is rare. Most wildfire tools stop at risk assessment. HomeDoc carries through to mitigation planning, contractor coordination, work documentation (before/during/after photos), and IBHS submission — the full cycle.

**Extensible?** The multi-stage certification pipeline pattern applies to any professional certification or compliance workflow — energy audits, accessibility compliance, green building certification, code compliance.

---

## 4. Smart Onboarding with Public Records Auto-Fill

**What it does:** When a homeowner enters their address, HomeDoc calls the RentCast API to pull public property records — square footage, bedrooms, bathrooms, year built, lot size, construction type, HVAC type, heating fuel, last sale price, and more. A Google Street View image confirms the property. Eleven default appliances are pre-configured based on the property profile, with fuel types auto-detected where available.

**User impact:** Instead of manually entering 20+ fields, the homeowner reviews and corrects pre-filled data. The onboarding experience takes minutes, not an afternoon. Emerald badges mark API-sourced fields, with full manual override available.

**Business impact:** Onboarding completion rate is critical for a data-heavy platform. Auto-fill dramatically reduces friction and produces richer initial profiles, which drives engagement with downstream features (maintenance, risk, energy analysis).

**Differentiation:** The combination of public records, street view confirmation, and auto-configured appliances with fuel type detection creates an onboarding experience that feels intelligent. The fallback to full manual entry ensures the platform works everywhere, not just where RentCast has data.

**Extensible?** Public records auto-fill is valuable for any property-adjacent application — insurance, real estate, property management, lending, home warranty.

---

## 5. Total Cost of Ownership (TCO) Calculator

**What it does:** Compares the lifetime cost of home system upgrades — starting with 17 HVAC systems across 8 types (gas furnace+AC, heat pump, mini-split, etc.) and 3 quality tiers (good/better/best). The engine calculates climate-zone-adjusted energy costs, applies federal incentives (IRA 25C/25D, HEEHRA) and state programs, models year-by-year costs with inflation and energy price escalation, and identifies the payback year and lifetime ROI.

**User impact:** Homeowners making a major system purchase can see the true 25-year cost — not just the sticker price. A heat pump that costs more upfront might save $15,000 over its lifetime after incentives and energy savings. The TCO calculator makes this visible.

**Business impact:** TCO analysis drives informed purchasing decisions and positions HomeDoc as the trusted advisor before a major spend. The BidSmart integration means a homeowner can go from TCO analysis to contractor bid comparison in one flow.

**Differentiation:** All calculations are client-side (no API dependency, no latency). The equipment database, incentive lookup, and climate-zone energy modeling are comprehensive enough to produce credible results without requiring a professional energy audit. Designed for vertical expansion into windows, insulation, solar, and batteries.

**Extensible?** The TCO calculation engine, incentive lookup, and comparison framework are domain-agnostic. The same pattern works for fleet vehicles, commercial equipment, enterprise software licensing — any major purchase with operating costs, incentives, and lifecycle considerations.

---

## 6. Embeddable Widget Ecosystem

**What it does:** Any of HomeDoc's 17+ standalone modules — solar calculator, wildfire risk, water safety, crime risk, flood risk, air quality, climate risk, power reliability, energy report, and more — can be deployed as an embeddable iframe widget on partner websites. Each widget supports custom branding, an email gate for lead capture, event tracking (view, input, result, email, CTA click), and webhook delivery to Make or Zapier.

**User impact:** Partners — contractors, real estate agents, insurance brokers, utility companies — can offer home intelligence tools on their own websites without building anything. A contractor's site shows a solar calculator. A real estate listing includes wildfire risk. An insurance agent's page features a water safety analysis.

**Business impact:** Widgets turn HomeDoc from a consumer product into a B2B distribution platform. Every widget impression is a potential lead, captured via email gate and delivered via webhook. Domain whitelisting and per-widget analytics create an enterprise-grade deployment model.

**Differentiation:** The breadth (17+ widget types) and the infrastructure (domain whitelisting, event tracking, webhook delivery, white-label branding, email gates) create a widget system that's a product in itself — not just an embed code.

**Extensible?** The widget deployment infrastructure — domain whitelisting, event tracking, lead capture, webhook delivery — is completely domain-agnostic. Any SaaS product with modular features could use this pattern for partner distribution.
