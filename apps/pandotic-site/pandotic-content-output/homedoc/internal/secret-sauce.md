---
section: 9
title: "Secret Sauce / Internal Capability Notes"
project: "homedoc"
status: draft
generated: "2026-04-07T00:00:00Z"
---

# HomeDoc — Secret Sauce (Internal Only)

## A. Technical Capability Inventory

### 1. Multi-Model AI Orchestration

**What it is:** A document extraction pipeline that routes different document types to different AI models based on cost, capability, and complexity. Google Gemini 2.0 Flash handles 7 document types (utility bills, appliance labels, receipts, insurance, warranties, test results, bids) at ~$0.001/call. GPT-4o handles inspection reports requiring complex 5-part output with severity normalization at ~$0.01/call. Google Vision handles OCR for physical appliance nameplates. Unstructured.io preprocesses multi-page PDFs into markdown before any AI model processes them.

**Why it's powerful:** Most "AI-powered" platforms use a single model for everything — overpaying for simple tasks and underperforming on complex ones. This approach optimizes both cost and quality by matching model capability to task complexity.

**What's unique about Pandotic's implementation:** The prompt registry is document-type-specific — each extraction type has tailored prompts, expected output schemas, and validation rules. The Unstructured.io preprocessing step is critical: a 50-page PDF fed directly to an LLM produces unreliable results, but converting it to structured markdown first yields dramatically better extraction.

**Complexity hidden from the user:** Model selection, preprocessing decisions, prompt construction, response parsing, confidence scoring, cost tracking, and caching — all invisible. The user just uploads a file and reviews the results.

### 2. Human-in-the-Loop Extraction Pipeline

**What it is:** Every AI extraction result is cached in `extraction_results_cache` (30-day TTL) and presented in a review UI. The user can approve, correct, or reject each extracted field before it persists to the database. Field corrections are tracked in `extraction_field_corrections`.

**Why it's powerful:** This pattern solves the trust problem with AI extraction. Users don't have to blindly accept AI output, and the system generates correction data that reveals extraction quality patterns.

**What's unique:** The cache-review-persist architecture means extraction errors never pollute the database. The correction tracking creates a de facto quality metrics system without building a separate analytics pipeline.

**Complexity hidden:** Cache management, TTL enforcement, field-level diff tracking, and the seamless transition from "AI proposed this" to "user confirmed this" in the database.

### 3. Multi-Source Composite Risk Scoring with Tiered Caching

**What it is:** Wildfire risk aggregated from 5 independent data sources, each cached at its own interval: FEMA NRI (90 days), NIFC Historical (90 days), USGS Wildland Hazard (365 days), NOAA Weather (6 hours), CAL FIRE FHSZ (365 days). Per-source caches feed a composite cache. County-level aggregation means one API call can serve hundreds of users.

**Why it's powerful:** Tiered caching is the only architecture that balances data freshness with cost. Weather data needs to be fresh (6 hours). Historical fire maps don't change often (365 days). A flat caching policy either overpays for stale data or under-refreshes dynamic data.

**What's unique:** The composite scoring logic weighs sources differently — a high NOAA weather risk during fire season is weighted more heavily than a moderate FEMA national index. The county-level aggregation strategy means the marginal cost of adding a new user in an already-cached county is zero.

**Complexity hidden:** Source-specific API calls, per-source caching with different TTLs, composite score calculation, county-level aggregation, fallback logic when individual sources are unavailable.

### 4. Inspection Report Severity Normalization

**What it is:** The `extract-inspection` edge function processes home inspection reports from 5+ inspection software platforms (Spectora, HomeGauge, Horizon, Palm-Tech, and others) and normalizes their findings into a unified severity scale: safety_hazard, deficiency, maintenance_item, monitor, informational. The extraction produces a 5-part output: home attributes, systems, findings, fix-it items, and recommended projects.

**Why it's powerful:** Inspection reports from different platforms use different terminology, structures, and severity classifications. Without normalization, the same roof issue might be "Major Defect" in one report and "Monitor" in another.

**What's unique:** The 5-part output structure (attributes → systems → findings → fix-its → projects) creates a natural pipeline from "what the inspector found" to "what the homeowner should do." Related findings are automatically grouped into project recommendations.

**Complexity hidden:** Platform detection, severity mapping tables, finding deduplication, project grouping logic, and the multi-step reasoning required to go from raw report text to structured, actionable output.

### 5. Admin-Configurable API Integration Registry

**What it is:** All external API integrations are stored in the `api_integrations` database table with configuration, credentials, health status, and usage tracking. Adding a new API requires only a database migration — no code deployment. The admin dashboard auto-surfaces new integrations with health checks, usage metrics, and cost monitoring.

**Why it's powerful:** In most platforms, adding a new API integration requires code changes, deployment, and dashboard updates. HomeDoc's registry pattern makes new integrations a configuration change, not a development project.

**What's unique:** The `api_call_tracking` table logs every call with endpoint, response time, cost, and cache hit status. The admin dashboard shows real-time health status, cost trends, and quota usage per integration. Credential rotation is tracked via `api_credentials_audit`.

**Complexity hidden:** Automatic health check scheduling, cost aggregation, quota monitoring, credential rotation tracking, and the dashboard rendering logic that auto-generates UI for any registered integration.

### 6. Dynamic Environmental Modeling

**What it is:** The electrification service (`electrificationService.ts`, 1,268 lines) calculates gas usage, electrification readiness, and conversion costs using dynamic climate zone factors. Alaska's heating intensity factor is 1.8x; Florida's is 0.2x. Gas usage is distributed across end-uses (space heating 45%, water heating 25%, cooking 8%, etc.) and adjusted for household occupancy.

**Why it's powerful:** Generic calculators use national averages. HomeDoc's climate-zone-aware modeling produces dramatically more accurate estimates for homes in extreme climates — where the decision to electrify has the highest financial stakes.

**What's unique:** The model combines IECC climate zones with appliance-specific efficiency ratings, occupant count adjustments, and age-based degradation factors. A 15-year-old furnace in Minneapolis is modeled very differently from a 5-year-old furnace in Phoenix.

**Complexity hidden:** Climate zone lookup from ZIP, heating/cooling load factor tables, appliance efficiency degradation curves, occupant adjustment formulas, and the interaction effects between multiple simultaneous electrification upgrades.

### 7. Edge Function Architecture

**What it is:** 33 independent Supabase edge functions running on Deno, with shared utilities for CORS handling, authentication (user-scoped + service role), request logging, and rate limiting. All AI calls, property lookups, and risk aggregation run server-side.

**Why it's powerful:** Edge functions keep API keys out of the browser, enforce rate limiting at the server level, and enable RLS-enforced data access patterns. Each function deploys independently, so a change to the extraction pipeline doesn't affect the risk scoring service.

**What's unique:** The shared `_shared/` directory provides standardized patterns (CORS, auth, logging, rate limiting) that ensure every function follows the same security and observability model. The rate limiter implementation prevents abuse without blocking legitimate usage.

**Complexity hidden:** Per-function deployment, shared dependency management across Deno modules, CORS preflight handling for cross-origin widget requests, and the dual auth pattern (user-scoped for RLS, service role for admin operations).

### 8. Enterprise Multi-Tenancy with RLS

**What it is:** Row-Level Security policies at the PostgreSQL level enforce data isolation between organizations. Organization-scoped widgets, branding, and access controls are configured per-tenant. Group admin panels provide organization-level management.

**Why it's powerful:** RLS at the database level means data isolation is enforced regardless of application code bugs. A misconfigured API endpoint can't leak data across organizations because the database itself prevents it.

**What's unique:** The multi-tenancy model supports three distinct access patterns: direct homeowner access, professional-managed access (contractors viewing client homes), and organization-scoped access (group admins managing multiple properties). White-label branding is per-organization.

**Complexity hidden:** RLS policy composition (user roles + organization membership + property access grants), the interaction between user-scoped Supabase clients and service-role clients, and the access control inheritance from organizations to group members to managed homes.

---

## B. Architecture Decisions Worth Noting

1. **Cache-first, API-second:** Every external API call checks the cache first. Cache TTLs are domain-specific (weather: 6h, property records: 30d, geological data: 365d). This isn't just cost optimization — it's a design philosophy that the platform should work even when external APIs are down.

2. **Right model for the right task:** The decision to use 4 AI models instead of one was an engineering choice, not a marketing one. Gemini Flash processes a utility bill for $0.001; GPT-4o would cost 10x more for the same task. GPT-4o handles inspection reports that Gemini Flash would produce unreliable results for. Each model earns its slot.

3. **Review before persist:** The deliberate separation of extraction (AI-generated, cached) from persistence (user-approved, in database) is an architectural guardrail. It means the database is a curated dataset, not a raw AI output dump.

4. **Modules as products:** The 14-module architecture with standardized manifests means any module can be deployed standalone, embedded as a widget, or bundled with other modules. This isn't just code organization — it's a business architecture that enables partner distribution.

5. **Database-driven configuration:** APIs, widgets, organizations, and module settings are all database-driven. This means the platform can be reconfigured in production without code deployment — critical for a multi-tenant system serving different partner configurations.

6. **County-level aggregation:** Risk data is cached at the county level, not the address level. This means the first user in a county pays the API cost, and every subsequent user in that county gets cached data for free. In dense urban areas, this reduces risk API costs by orders of magnitude.

7. **Appliance-centric data model:** Maintenance, warranty, electrification, TCO, and document extraction all flow from the appliance inventory. This was a deliberate decision to make the appliance the "atom" of the platform — every feature connects to what's physically in the home.
