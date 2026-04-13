---
section: 13
title: "Screenshot Capture Brief"
project: "homedoc"
status: draft
generated: "2026-04-07T00:00:00Z"
---

# HomeDoc — Screenshot Capture Brief

## A. Pre-Capture Verification

- **Current branch:** `claude/pandotic-content-plan-3kh1e` (26 commits ahead of main)
- **Build status:** Not verified — run `npm run dev` to start local dev server at http://localhost:5173
- **Environment:** Requires `.env` file with Supabase credentials and optional API keys (Google Maps, RentCast, etc.)
- **Data state:** Screenshots require a populated demo account with home data, appliances, documents, and risk reports. Check if demo credentials exist in `.env` or Supabase dashboard.
- **Uncertainty:** Cannot confirm running product state from code alone. Demo data availability needs verification.

## B. Capture Priorities

| Priority | Page/Flow | Business Story | Suitable For |
|----------|-----------|----------------|-------------|
| 1 | Home Dashboard (My Home) | "Your entire home at a glance" | Website hero, case study |
| 2 | Wildfire Risk Assessment | "Know your risks from 5 sources" | Case study, deck, widget demo |
| 3 | Document Extraction Review | "AI reads, you approve" | Case study, features section |
| 4 | Solar/Energy Calculator | "Calculate your savings instantly" | Website, widget demo |
| 5 | FireShield Dashboard | "From assessment to certification" | Case study, B2B pitch |
| 6 | Onboarding Wizard | "Set up your home in minutes" | Case study, video b-roll |
| 7 | TCO Calculator | "See the true 25-year cost" | Features, calculator demo |
| 8 | Widget Embed Preview | "Embed intelligence anywhere" | Partner pitch, deck |
| 9 | Admin API Dashboard | "Full operational visibility" | Internal, tech pitch |
| 10 | Emergency Plan Export | "Be prepared, PDF-ready" | Features section |

## C. Shot-by-Shot Instructions

### Shot 1: Home Dashboard Hero
- **Filename:** `homedoc-dashboard-hero.png`
- **What to open:** `/app` or `/my-home`
- **Pre-capture actions:** Ensure demo home has 5+ appliances, risk scores visible, recent activity showing. Expand any collapsed sections.
- **Capture type:** Full-page with sidebar visible
- **What to emphasize:** The breadth of data — appliances, systems, risk indicators, maintenance status
- **What to avoid:** Empty states, loading spinners, placeholder text
- **Usage:** Public — website hero, case study header

### Shot 2: Wildfire Risk Composite
- **Filename:** `wildfire-risk-composite.png`
- **What to open:** `/home-risk-reports` or `/risks-environment`
- **Pre-capture actions:** Navigate to wildfire risk section. Ensure risk scores are loaded from cache or API.
- **Capture type:** Focused on risk summary cards + map if available
- **What to emphasize:** Multiple data sources contributing to a single composite score
- **What to avoid:** "No data" states, error messages
- **Usage:** Public — case study, risk feature section

### Shot 3: AI Document Extraction Review
- **Filename:** `document-extraction-review.png`
- **What to open:** Document upload/review flow (find via document management section)
- **Pre-capture actions:** Upload a sample utility bill or inspection report. Wait for extraction to complete. Show the review UI with extracted fields.
- **Capture type:** Focused on extraction results with field-level review options
- **What to emphasize:** AI-extracted data alongside the source document, approve/edit controls
- **What to avoid:** Sensitive financial data, real customer info
- **Usage:** Public — case study, features section

### Shot 4: Solar Calculator
- **Filename:** `solar-calculator-projections.png`
- **What to open:** `/calculators` → Solar Calculator tab
- **Pre-capture actions:** Enter a ZIP code, adjust system size if needed, let calculations render
- **Capture type:** Full calculator view with results showing 25-year projections
- **What to emphasize:** Interactive inputs, savings numbers, ROI timeline
- **What to avoid:** Default/empty state before calculation
- **Usage:** Public — website, widget demo, case study

### Shot 5: FireShield Certification Pipeline
- **Filename:** `fireshield-certification-pipeline.png`
- **What to open:** `/fireshield-home` or `/fireshield-assessment`
- **Pre-capture actions:** Ensure a demo certification is in progress with multiple stages completed
- **Capture type:** Dashboard view showing the stage pipeline
- **What to emphasize:** The multi-stage workflow — stages completed, current stage, upcoming stages
- **What to avoid:** Empty pipeline, no active certification
- **Usage:** Public — case study, B2B pitch

### Shot 6: Smart Onboarding
- **Filename:** `onboarding-property-autofill.png`
- **What to open:** `/onboarding` (may need a new/test account)
- **Pre-capture actions:** Enter an address. Wait for RentCast auto-fill and Street View to load. Show the pre-filled property data with emerald badges.
- **Capture type:** Focused on the property data step with auto-filled fields visible
- **What to emphasize:** Auto-filled fields with source badges, Street View image, data richness
- **What to avoid:** API errors, "data unavailable" states
- **Usage:** Public — case study, features section

### Shot 7: TCO Calculator Comparison
- **Filename:** `tco-calculator-comparison.png`
- **What to open:** `/tco`
- **Pre-capture actions:** Select current system (e.g., gas furnace) and proposed system (e.g., heat pump). Enter property details. Let calculation complete.
- **Capture type:** Results view showing cumulative cost chart + savings summary
- **What to emphasize:** Side-by-side cost comparison, payback year, incentive impact
- **What to avoid:** Default state before system selection
- **Usage:** Public — features, calculator demo

### Shot 8: Embeddable Widget
- **Filename:** `embeddable-widget-preview.png`
- **What to open:** Any widget route (e.g., `/widgets/solar-calculator` or `/widgets/wildfire-risk`)
- **Pre-capture actions:** Enter a ZIP code or address. Show results rendering in widget-mode (compact, no sidebar).
- **Capture type:** Widget view as it would appear embedded on a partner site
- **What to emphasize:** Compact, branded, standalone appearance
- **What to avoid:** Full app chrome around the widget
- **Usage:** Public — partner pitch, product page

### Shot 9: Admin API Dashboard
- **Filename:** `admin-api-dashboard.png`
- **What to open:** `/admin` → API management section
- **Pre-capture actions:** Ensure API integrations are visible with health status, usage metrics, and cost data
- **Capture type:** Dashboard view showing multiple API integrations
- **What to emphasize:** Health status indicators, cost tracking, usage metrics across APIs
- **What to avoid:** API keys or credentials visible in the UI
- **Usage:** Internal / tech pitch only — do not publish API key areas

### Shot 10: Emergency Plan
- **Filename:** `emergency-plan-overview.png`
- **What to open:** `/emergency-plan`
- **Pre-capture actions:** Ensure demo has a populated emergency plan with hazards, communication plan, and exit routes
- **Capture type:** Dashboard/overview showing plan sections
- **What to emphasize:** Comprehensiveness — multiple plan sections, tasks, contacts
- **What to avoid:** Empty plan state
- **Usage:** Public — features section

## D. Capture Quality Rules

- Use 1440x900 or 1920x1080 viewport consistently
- Prefer light mode (dark mode only if it's a selling point)
- Use realistic, non-sensitive demo data throughout
- No console errors visible
- No loading spinners or skeleton states in final captures
- No "Lorem ipsum", "TODO", or placeholder text
- No sensitive data (real addresses, financial info, API keys)
- Verify all captured pages are fully loaded and interactive

## E. Marketing Readiness Flags

Watch for and avoid:
- [ ] Incomplete UI (partially rendered components)
- [ ] Placeholder text ("Lorem ipsum", "TODO", "Coming soon")
- [ ] Fake metrics that could be misleading
- [ ] Internal terminology not meaningful to users
- [ ] Console errors visible in captures
- [ ] Loading spinners or skeleton states
- [ ] Broken buttons or non-functional links
- [ ] Outdated branding or inconsistent styling

## F. Top 5 Must-Have Captures

### 1. Home Dashboard Hero
- **What:** `/my-home` with a fully populated home profile
- **Why:** This is the first impression — it shows the breadth and depth of the platform at a glance
- **Where:** Website hero image, case study header, pitch deck opening slide
- **Risk:** Requires populated demo data. Empty state would be counterproductive.

### 2. Wildfire Risk Composite
- **What:** Risk report showing composite scoring from multiple sources
- **Why:** The multi-source approach is HomeDoc's most differentiated technical feature
- **Where:** Case study inline, risk module marketing, deck slide on data intelligence
- **Risk:** Requires a property location with meaningful risk data. Low-risk areas won't be compelling.

### 3. AI Document Extraction Review
- **What:** Extraction review UI showing AI-proposed data with approve/edit controls
- **Why:** This is the most tangible demonstration of "AI that helps, not replaces"
- **Where:** Case study inline, features section, AI capability showcase
- **Risk:** Requires a successful extraction with realistic data. API keys needed for live extraction.

### 4. Solar Calculator with Results
- **What:** Solar calculator showing 25-year savings projections
- **Why:** Calculators are the most accessible, immediately understandable feature
- **Where:** Website, widget demo, partner pitch
- **Risk:** Low risk — calculators work client-side with no API dependency.

### 5. TCO Comparison Chart
- **What:** Side-by-side HVAC comparison with cumulative cost curves
- **Why:** The visual of two cost curves crossing (payback year) is immediately compelling
- **Where:** Features section, product page, deck slide on energy intelligence
- **Risk:** Low risk — all client-side calculations. Needs property input for context.
