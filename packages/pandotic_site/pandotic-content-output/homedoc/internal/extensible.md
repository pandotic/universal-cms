---
section: 10
title: "Extensible Capabilities"
project: "homedoc"
status: draft
generated: "2026-04-07T00:00:00Z"
---

# HomeDoc — Extensible Capabilities (Internal Only)

## Capability Mapping

### 1. Multi-Model AI Document Extraction

**What it does in this project:** Routes 8 home document types to 4 AI services based on cost and complexity, with human review before database persistence.

**What's generalizable:** A document processing pipeline that matches AI models to document types, with cost tracking, caching, and human-in-the-loop review.

**Other use cases:**
- Insurance claims processing (medical bills, damage photos, repair estimates, adjuster reports)
- Legal document intake (contracts, filings, correspondence, evidence)
- Healthcare records management (lab results, imaging reports, prescriptions, insurance EOBs)
- Commercial property management (leases, inspection reports, utility bills, maintenance records)
- Financial document processing (invoices, receipts, bank statements, tax forms)

**Client types:** Insurance companies, law firms, healthcare providers, property management companies, accounting firms.

**Adaptation effort:** Medium — the extraction pipeline, review UI, and cost tracking infrastructure are reusable. New document types require prompt engineering and schema definition (1-2 days per type).

**Engagement angle:** Prototype sprint (2-3 weeks) to demonstrate extraction quality on client's specific document types, followed by full build.

---

### 2. Multi-Source Composite Risk Scoring

**What it does in this project:** Aggregates wildfire risk from 5 federal/state data sources with per-source caching at different intervals.

**What's generalizable:** A pattern for combining heterogeneous data sources with different freshness requirements into a single composite score.

**Other use cases:**
- Commercial real estate risk assessment (environmental, structural, market, regulatory)
- Supply chain risk monitoring (geopolitical, weather, logistics, supplier financial health)
- Insurance underwriting intelligence (property, environmental, claims history, neighborhood)
- Agricultural risk assessment (weather, soil, market, pest/disease)
- Fleet vehicle risk scoring (driver behavior, maintenance history, route conditions, weather)

**Client types:** Insurance companies, commercial real estate firms, supply chain operators, agricultural companies.

**Adaptation effort:** Medium — the composite scoring engine and tiered caching architecture are reusable. New data sources require API integration and scoring weight calibration (1-2 weeks per source).

**Engagement angle:** Workshop to identify relevant data sources + prototype sprint to demonstrate composite scoring on client's domain.

---

### 3. Embeddable Widget Ecosystem

**What it does in this project:** 17+ standalone widgets with email gates, lead capture, webhook delivery, domain whitelisting, and analytics.

**What's generalizable:** A distribution infrastructure that turns any modular feature into an embeddable, lead-generating widget with enterprise controls.

**Other use cases:**
- SaaS product-led growth (embed calculators, assessments, or tools on partner sites)
- Financial services (embeddable loan calculators, retirement planners, insurance quote tools)
- Health and wellness (embeddable health assessments, symptom checkers, fitness calculators)
- Education technology (embeddable skill assessments, practice tools, progress trackers)
- Real estate (embeddable property valuations, neighborhood scores, mortgage calculators)

**Client types:** Any SaaS company wanting partner distribution, any industry with a calculator or assessment tool.

**Adaptation effort:** Low-Medium — the widget infrastructure (embedding, lead capture, webhooks, analytics, domain whitelisting) is fully reusable. New widget content requires building the specific tool (varies by complexity).

**Engagement angle:** Bolt-on engagement — add widget distribution to an existing product in 2-4 weeks.

---

### 4. Admin-Configurable Integration Registry

**What it does in this project:** New external APIs are added via database migration and auto-surface in the admin dashboard with health checks, cost tracking, and usage metrics.

**What's generalizable:** A configuration-driven API management layer that makes adding new integrations an ops task, not a dev task.

**Other use cases:**
- Multi-vendor data platforms (add new data providers without code deployment)
- Marketplace platforms (add new payment, shipping, or communication providers)
- IoT platforms (add new device types or sensor feeds without code changes)
- Analytics platforms (add new data connectors without engineering work)

**Client types:** Platform companies, marketplace operators, IoT companies, data aggregators.

**Adaptation effort:** Low — the registry pattern, admin dashboard auto-generation, and health monitoring are directly reusable.

**Engagement angle:** Architecture consultation + implementation sprint (1-2 weeks).

---

### 5. Multi-Stage Certification Workflow

**What it does in this project:** FireShield's 11-stage pipeline from inquiry to IBHS wildfire certification, coordinating homeowners, contractors, and inspectors.

**What's generalizable:** A multi-party, multi-stage workflow engine with status tracking, document management, and stakeholder coordination.

**Other use cases:**
- Energy audit certification (home energy rating, HERS scoring, certification)
- Accessibility compliance (assessment, remediation, inspection, certification)
- Green building certification (LEED, Energy Star, Passive House)
- Code compliance (permit application, inspection, approval, certificate of occupancy)
- Professional licensing (application, exam, review, approval, renewal)

**Client types:** Certification bodies, government agencies, compliance platforms, professional associations.

**Adaptation effort:** Medium — the pipeline stages, status tracking, and document management are reusable. Stage definitions and business rules need customization (2-4 weeks).

**Engagement angle:** Full build engagement with clear scope defined by the certification stages.

---

### 6. Climate-Zone-Aware Environmental Modeling

**What it does in this project:** Calculates energy costs, electrification readiness, and system lifecycle costs adjusted for IECC climate zones, occupancy, and building characteristics.

**What's generalizable:** A location-aware calculation engine that adjusts outputs based on environmental, demographic, and building parameters.

**Other use cases:**
- Commercial building energy modeling
- Agricultural yield prediction by microclimate
- Insurance premium optimization by location-specific risk
- Utility demand forecasting by service territory
- Real estate valuation adjustments by climate exposure

**Client types:** Utilities, insurance companies, real estate platforms, agricultural technology companies.

**Adaptation effort:** Medium-High — the zone-based modeling framework is reusable, but new domains require their own factor tables and calculation logic (4-8 weeks).

**Engagement angle:** Full build or prototype sprint depending on client's existing data assets.

---

## Synthesis: Pandotic Capability Map

### Capability Clusters as Offerings

**1. "Intelligent Document Processing" offering**
Capabilities: Multi-model extraction + human review + cost tracking
Engagement: 2-4 week prototype, 6-8 week production build
Strongest proof: 8 document types, 4 AI models, field correction tracking

**2. "Composite Intelligence" offering**
Capabilities: Multi-source scoring + tiered caching + dynamic modeling
Engagement: 3-4 week prototype, 8-12 week production build
Strongest proof: 5-source wildfire composite, climate-zone energy modeling

**3. "Widget Distribution Platform" offering**
Capabilities: Embeddable widgets + lead capture + webhook delivery + analytics
Engagement: 2-4 week bolt-on to existing product
Strongest proof: 17+ widget types, enterprise controls

**4. "Workflow Automation" offering**
Capabilities: Multi-stage pipelines + stakeholder coordination + certification tracking
Engagement: 4-8 week build depending on complexity
Strongest proof: 11-stage FireShield pipeline

### Strongest "We've Already Built This" Story
The document extraction pipeline — it's tangible, demonstrable, and solves a universal problem. Every organization processes documents. The multi-model approach and human review pattern are immediately credible to technical evaluators.

### Capability Gaps
- No voice/speech integration (could be valuable for field inspectors)
- No real-time collaboration features (multiple users editing simultaneously)
- No ML model training on correction data (correction tracking exists but doesn't feed back into model improvement yet)
