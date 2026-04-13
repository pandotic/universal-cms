---
section: 12
title: "Technical Differentiators"
project: "homedoc"
status: draft
generated: "2026-04-07T00:00:00Z"
---

# HomeDoc — Technical Differentiators (Outward-Facing)

## 1. AI That's Engineered, Not Just Integrated

HomeDoc doesn't use AI as a feature checkbox. It uses four distinct AI services, each selected for a specific job: a fast, cost-efficient model for simple document extraction, a reasoning model for complex multi-part analysis, a vision model for physical label reading, and a preprocessing service for multi-page PDFs. Every extraction passes through a human review step before it's committed to the database, and every API call is cost-tracked in real time. The result is an AI pipeline that's operationally transparent, financially predictable, and quality-controlled — not a black box that "uses AI."

## 2. Data Architecture Built for Real-World Complexity

Most home platforms store property data in flat tables with national-average assumptions. HomeDoc's data architecture reflects how homes actually work: appliances are the atomic unit, and maintenance, warranty, energy, electrification, and risk analysis all flow from that inventory. Environmental modeling is climate-zone-aware, with heating intensity factors that range from 1.8x in Alaska to 0.2x in Florida. Risk scoring aggregates five independent data sources, each cached at intervals that match its freshness requirements. The architecture was designed for the messy reality of home data — not for a demo with clean inputs.

## 3. Platform, Not Just Product

HomeDoc is architected as a distribution platform, not just a consumer application. Its 14 feature modules follow a standardized manifest system that enables any module to be deployed standalone, embedded as a widget on a partner's website, or bundled with other modules for a specific use case. The widget infrastructure includes domain whitelisting, email-gated lead capture, webhook delivery, and per-widget analytics. Adding a new external API integration requires only a database migration — no code deployment. This means partners can configure, deploy, and extend the platform without engineering involvement.

## 4. Operational Maturity from Day One

HomeDoc ships with the operational infrastructure that most platforms add retroactively: per-API cost tracking and health monitoring, rate limiting at the edge function level, credential rotation auditing, user activity logging, bug reporting pipelines, and a comprehensive admin dashboard with 95+ management components. The cache-first architecture means the platform degrades gracefully when external APIs are unavailable — cached data serves users while the system retries upstream services. This isn't a prototype that needs to be hardened for production; it was built for production from the start.

## 5. Security and Isolation at the Database Level

Data isolation between organizations isn't enforced by application code — it's enforced by PostgreSQL Row-Level Security policies at the database level. This means a misconfigured API endpoint or a logic bug in the application layer can't leak data across tenants. All AI API keys are stored server-side in Supabase edge functions; no API credentials are ever exposed in the browser. The dual auth pattern (user-scoped clients for RLS enforcement, service-role clients for administrative operations) ensures that every database query respects the current user's access permissions automatically.
