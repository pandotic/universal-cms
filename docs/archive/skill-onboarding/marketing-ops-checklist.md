# Virtual Marketing Department — Complete Activity Checklist

**Version:** 2.0 (consolidated)
**Status:** Planning artifact — companion to `marketing-ops-master-spec.md`
**Owner:** Dan / GBI / Pandotic

**Purpose:** All-inclusive "if we do everything" inventory of marketing activities, the specialized agent that owns each one, and the pre-built platforms/tools each agent uses. This is the maximalist scope — phasing happens in the master spec.

**Format:** Activities grouped by department. Each activity lists owner agent, frequency, applicable brand types, and tool stack.

**Brand type codes:**
- `STUDIO` = Pandotic studio site itself
- `PRODUCT` = Pandotic studio product (SPEED, BidSmart, HomeDoc, LeadSmart, ThinkAlike, StudyPuppy, FireShield Defense)
- `STANDALONE` = GBI personal / independent brand (SafeMama, Thermostating, HomeEP, HMB, ESGsource, etc.)
- `CLIENT` = Pandotic client deployment (Riffle CM, POS360, Archer Review)
- `LOCAL` = Local services (FireShield)
- `ALL` = Applies to every brand

---

## Department 1: Office of the Marketing Director

### Marketing Director (Coordinator)
The single agent that orchestrates all other agents. Reads brand state, plans the week, dispatches tasks, surfaces conflicts, escalates to human. Doesn't execute — only plans and routes.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 1.1 | Quarterly marketing plan generation per brand | Quarterly | ALL except CLIENT | Claude Code, Supabase, MKT1 frameworks |
| 1.2 | Weekly priorities and task dispatch | Weekly | ALL | Custom orchestration |
| 1.3 | Cross-brand conflict detection (avoid same-week launches) | Weekly | ALL | Custom |
| 1.4 | Budget allocation tracking per brand | Monthly | ALL | Supabase |
| 1.5 | OKR setting and tracking | Quarterly | ALL except CLIENT | Custom |
| 1.6 | Brand health scoring | Daily | ALL | Custom dashboard |
| 1.7 | Escalation queue management (what needs human approval) | Daily | ALL | QA queue |
| 1.8 | Playbook selection (studio vs studio_product vs standalone vs client vs local) | Per task | ALL | Custom logic |
| 1.9 | Budget vs. results reporting | Monthly | ALL | Custom |
| 1.10 | Channel mix optimization recommendations | Quarterly | ALL except CLIENT | Custom |

---

## Department 2: Content & Creative

### Editorial Director (Department Head)
Owns the content calendar, brand voice enforcement, content strategy.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 2.1 | Editorial calendar maintenance per brand | Weekly | ALL except CLIENT | hub_content_pipeline |
| 2.2 | Brand voice guideline storage and updates | As needed | ALL | hub_brand_voice_briefs |
| 2.3 | Content gap analysis vs competitors | Monthly | ALL except CLIENT | Apify MCP, custom |
| 2.4 | Topic ideation from trends + keyword research | Weekly | ALL except CLIENT | Brave Search MCP, Apify |
| 2.5 | Content brief generation for writers | Per piece | ALL except CLIENT | Custom |
| 2.6 | Cross-brand content theme coordination | Monthly | STUDIO + PRODUCT | Custom |
| 2.7 | Seasonal content planning (holidays, industry events) | Quarterly | ALL except CLIENT | Custom |
| 2.8 | Content QA against brand voice | Per piece | ALL except CLIENT | Skeptical Reviewer |

### Long-Form Writer
Blog posts, guides, whitepapers, case studies, landing pages, ebooks.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 2.9 | Blog post drafting (1500-3000 words) | 2-5x/week per brand | ALL except CLIENT | Claude API |
| 2.10 | Pillar content / ultimate guides | Monthly | ALL except CLIENT | Claude API |
| 2.11 | Whitepapers and ebooks | Quarterly | ALL except CLIENT | Claude API |
| 2.12 | Case study writing | As wins occur | ALL (case studies for clients FROM client work go to STUDIO/Pandotic) | Claude API |
| 2.13 | Landing page copy | Per launch | ALL except CLIENT | Claude API |
| 2.14 | Founder/about page narratives | One-time per brand | ALL except CLIENT | Claude API |
| 2.15 | Product description writing | Per product | PRODUCT, STANDALONE | Claude API |
| 2.16 | Comparison pages (X vs Y) | Per opportunity | PRODUCT | Claude API |

### Copywriter
Short-form everything. Different muscle than long-form.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 2.17 | Email subject line variants | Per send | ALL except CLIENT | Claude API |
| 2.18 | Social post captions | Daily | ALL except CLIENT | Claude API |
| 2.19 | Ad copy variants (headline, body, CTA) | Per campaign | ALL except CLIENT | Claude API |
| 2.20 | CTA copy testing | Per landing page | ALL except CLIENT | Claude API |
| 2.21 | Microcopy (button text, tooltips, error messages) | Per product update | PRODUCT | Claude API |
| 2.22 | Push notification copy | Per send | PRODUCT | Claude API |
| 2.23 | SMS copy | Per send | LOCAL, PRODUCT | Claude API |
| 2.24 | Product Hunt launch copy | Per launch | PRODUCT | Claude API |

### Repurposing Specialist
The highest-leverage agent. Atomizes one piece into many.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 2.25 | Blog post → 5-10 social posts | Per blog | ALL except CLIENT | Claude API |
| 2.26 | Blog post → newsletter section | Per blog | ALL except CLIENT | Claude API |
| 2.27 | Long-form → LinkedIn article | Per piece | ALL except CLIENT | Claude API |
| 2.28 | Podcast appearance → 3-5 blog posts | Per appearance | ALL except CLIENT | Claude API + Whisper |
| 2.29 | Research data → infographic prompts | Per study | ALL except CLIENT | Claude API + image gen |
| 2.30 | Webinar → blog series + clips + quotes | Per event | ALL except CLIENT | Claude API |
| 2.31 | Customer testimonial → social proof posts | As collected | ALL except CLIENT | Claude API |
| 2.32 | Long thread → carousel deck | Per thread | ALL except CLIENT | Claude API + Templated |
| 2.33 | Quote graphics from any content | Per piece | ALL except CLIENT | Templated + Unsplash |

### Graphics Orchestrator
Image generation, brand-consistent visuals, template management. Stock + overlay default.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 2.34 | Brand kit setup per brand | One-time | ALL except CLIENT | Canva Pro (manual) |
| 2.35 | Templated.io template setup per brand (8 templates) | One-time | ALL except CLIENT | Templated.io |
| 2.36 | Social post graphics | Daily | ALL except CLIENT | Templated + Unsplash/Pexels |
| 2.37 | Blog post header images | Per blog | ALL except CLIENT | Templated + Unsplash/Pexels |
| 2.38 | Infographics from data | Per data study | ALL except CLIENT | Templated, Canva |
| 2.39 | Carousel decks (Instagram, LinkedIn) | Per concept | STANDALONE, STUDIO | Templated, Canva |
| 2.40 | Quote graphics | Per quote | ALL except CLIENT | Templated |
| 2.41 | Founder/team headshots styling | One-time | ALL except CLIENT | Image gen or photographer |
| 2.42 | Email header images | Per campaign | ALL except CLIENT | Templated |
| 2.43 | Press kit visual assets | One-time + updates | ALL except CLIENT | Canva, Templated |
| 2.44 | Pitch deck visuals | Per launch | PRODUCT, STANDALONE | Canva, Cowork |
| 2.45 | Short-form video / Reels generation | Weekly | STANDALONE | TBD (defer) |
| 2.46 | AI image generation (when use_ai_generation = true) | Per piece | PRODUCT mostly | DALL-E 3 / Imagen / Flux |

---

## Department 3: Distribution & Growth

### Growth Director (Department Head)

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 3.1 | Distribution strategy per content piece | Per piece | ALL except CLIENT | Custom |
| 3.2 | Channel mix optimization | Monthly | ALL except CLIENT | Custom |
| 3.3 | Cross-channel campaign coordination | Per campaign | ALL except CLIENT | Custom |
| 3.4 | Syndication strategy | Weekly | ALL except CLIENT | Custom |

### Social Media Manager

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 3.5 | Per-brand social calendar maintenance | Weekly | ALL except CLIENT | Vista Social / Publer / Followr |
| 3.6 | Post scheduling across platforms | Daily | ALL except CLIENT | Social tool API |
| 3.7 | Platform-specific adaptation (LinkedIn vs X vs IG) | Per post | ALL except CLIENT | Claude API + social tool |
| 3.8 | Hashtag research and rotation | Weekly | ALL except CLIENT | Social tool + Claude |
| 3.9 | Best time to post analysis | Monthly | ALL except CLIENT | Social tool analytics |
| 3.10 | Comment monitoring and triage | Daily | ALL except CLIENT | Social tool inbox |
| 3.11 | DM monitoring per brand | Daily | ALL except CLIENT | Social tool / native |
| 3.12 | Engagement actions (likes, follows, replies) on target accounts | Daily | ALL except CLIENT | Manual + agent suggestions |
| 3.13 | Trend monitoring per niche | Daily | ALL except CLIENT | Apify, Brave Search MCP |
| 3.14 | Reels / short-form video posting | Weekly | STANDALONE | Social tool |
| 3.15 | Story posting (IG, FB) | Daily | STANDALONE | Social tool |
| 3.16 | Cross-promotion between studio and product accounts | Per launch | STUDIO + PRODUCT | Social tool |
| 3.17 | Social listening for brand mentions | Daily | ALL except CLIENT | Brand24 alt or Apify |

### PR Strategist

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 3.18 | Quarterly PR strategy per brand | Quarterly | ALL except CLIENT | Custom + Press Ranger |
| 3.19 | Manufactured milestone planning ("look bigger") | Quarterly | PRODUCT, STANDALONE | Custom |
| 3.20 | Press release drafting | Per milestone | ALL except CLIENT | Press Ranger AI + Claude |
| 3.21 | Press release distribution | Per release | ALL except CLIENT | Press Ranger wholesale |
| 3.22 | Journalist relationship building | Ongoing | ALL except CLIENT | Press Ranger DB + CRM |
| 3.23 | HARO / Featured.com / Help a B2B Writer monitoring | Daily | ALL except CLIENT | Featured.com (existing skill) |
| 3.24 | Quote pitch submissions to journalist requests | Daily | ALL except CLIENT | Featured.com outbound |
| 3.25 | Media mention monitoring | Daily | ALL except CLIENT | Press Ranger + Apify |
| 3.26 | "As featured in" badge harvesting | Per pickup | ALL except CLIENT | Custom |
| 3.27 | Award submission identification and writing | Quarterly | ALL except CLIENT | Custom |
| 3.28 | Speaking opportunity / CFP submissions | Monthly | ALL except CLIENT | Custom |
| 3.29 | Press kit maintenance | Quarterly | ALL except CLIENT | Custom + Notion |
| 3.30 | Embargo coordination for big launches | Per launch | PRODUCT | Custom |
| 3.31 | AI search indexing via Press Ranger | Per major release | PRODUCT, STANDALONE | Press Ranger |

### SEO Specialist

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 3.32 | Keyword research per brand | Monthly | ALL except CLIENT | Apify MCP, Brave Search |
| 3.33 | Content gap analysis vs SERP competitors | Monthly | ALL except CLIENT | Apify |
| 3.34 | On-page SEO (title, meta, headers) | Per piece | ALL except CLIENT | Custom + CMS |
| 3.35 | Schema markup generation | Per page type | ALL except CLIENT | Custom (Brand Profile Builder generates JSON-LD) |
| 3.36 | Internal linking suggestions | Weekly | STANDALONE, STUDIO | Custom (or Linksy on WordPress) |
| 3.37 | Technical SEO audits | Quarterly | ALL except CLIENT | Apify + custom |
| 3.38 | Core Web Vitals monitoring | Weekly | ALL except CLIENT | PageSpeed Insights API |
| 3.39 | XML sitemap maintenance | Auto | ALL except CLIENT | CMS native |
| 3.40 | Robots.txt and indexation monitoring | Weekly | ALL except CLIENT | Custom |
| 3.41 | GEO (AI search) optimization for content | Per piece | ALL except CLIENT | Custom + Press Ranger AI indexing |
| 3.42 | Featured snippet optimization | Per piece | ALL except CLIENT | Custom |
| 3.43 | SERP rank tracking | Daily | ALL except CLIENT | Apify or DataForSEO |
| 3.44 | Brand SERP monitoring (own the first page) | Weekly | ALL except CLIENT | Apify, Brave |

### Link Builder
Backlink acquisition across all categories. Reads from `hub_link_opportunities`, writes to `hub_link_submissions`.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 3.45 | Featured.com outbound submissions | Daily | ALL except CLIENT | Featured.com skill |
| 3.46 | Tier 1 social profile creation (LinkedIn, X, FB, GitHub, YouTube) | One-time per brand | ALL except CLIENT | Claude in Chrome |
| 3.47 | Tier 2 social profile creation (Crunchbase, Product Hunt, AngelList, IG, Pinterest) | One-time per brand | ALL except CLIENT | Claude in Chrome |
| 3.48 | Tier 3 social profile creation (Medium, Substack, Reddit, Quora, etc.) | One-time per brand | ALL except CLIENT | Claude in Chrome |
| 3.49 | General directory submissions (Yelp, BBB, Foursquare, Hotfrog, Manta) | Weekly | ALL except CLIENT | Claude in Chrome |
| 3.50 | Industry-specific directory submissions | Weekly | ALL except CLIENT | Claude in Chrome |
| 3.51 | Local citation building | One-time + maintenance | LOCAL | BrightLocal |
| 3.52 | Broken link building | Monthly | ALL except CLIENT | Apify + Claude |
| 3.53 | Resource page outreach | Monthly | ALL except CLIENT | Claude + CRM |
| 3.54 | Guest post outreach | Monthly | ALL except CLIENT | Custom |
| 3.55 | Competitor backlink analysis | Monthly | ALL except CLIENT | Apify or Ahrefs API |
| 3.56 | Link reclamation (unlinked mentions) | Weekly | ALL except CLIENT | Press Ranger + Brave |
| 3.57 | HARO-style quote building | Daily | ALL except CLIENT | Featured.com |
| 3.58 | Pandotic studio interlinking maintenance | Per product update | STUDIO + PRODUCT | Custom + CMS |
| 3.59 | Link liveness monitoring | Weekly | ALL except CLIENT | Custom HTTP checker |
| 3.60 | URL shortener setup (Bitly, Rebrandly) | One-time per brand | ALL except CLIENT | Manual |
| 3.61 | Wayback Machine archiving | Per major release | ALL except CLIENT | Manual |

---

## Department 4: Relationships & Outreach

### Head of Partnerships (Department Head)

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 4.1 | Relationship CRM maintenance | Daily | ALL | Supabase + Attio? |
| 4.2 | Warming activity tracking | Weekly | ALL | Custom |
| 4.3 | Co-marketing partnership identification | Monthly | ALL except CLIENT | Custom |
| 4.4 | Joint webinar / co-content negotiation | Quarterly | ALL except CLIENT | Custom |
| 4.5 | Cross-promotion swap coordination | Monthly | ALL except CLIENT | Custom |

### Influencer Researcher

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 4.6 | Tier 1/2/3 influencer list building per brand | One-time + monthly refresh | ALL except CLIENT | Apify + manual |
| 4.7 | Influencer scoring (engagement, fit, audience overlap) | Per add | ALL except CLIENT | Apify + custom |
| 4.8 | "Top X List" content production (e.g., Top 30 ESG voices) | Quarterly per brand | ALL except CLIENT | Custom |
| 4.9 | Influencer warming engagement tracking | Daily | ALL except CLIENT | Custom CRM |
| 4.10 | Outreach pitch drafting | Per outreach | ALL except CLIENT | Claude API |
| 4.11 | Affiliate program management | Ongoing | STANDALONE | Custom |
| 4.12 | Influencer content rights tracking | Per collab | ALL except CLIENT | Custom |
| 4.13 | UGC discovery and rights requests | Weekly | STANDALONE | Apify + manual |

### Podcast Booker

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 4.14 | Relevant podcast identification per brand | Monthly | ALL except CLIENT | Press Ranger podcast DB |
| 4.15 | Episode-level pitch matching | Weekly | ALL except CLIENT | Custom + Claude |
| 4.16 | Pitch drafting with brand-specific angle | Per pitch | ALL except CLIENT | Claude API |
| 4.17 | Outreach tracking and follow-up | Daily | ALL except CLIENT | Custom CRM |
| 4.18 | Booking calendar coordination | Per booking | ALL except CLIENT | Calendly + Google Calendar |
| 4.19 | Pre-interview prep document generation | Per booking | ALL except CLIENT | Claude API |
| 4.20 | Post-interview asset harvesting (transcript, clips, quotes) | Per appearance | ALL except CLIENT | Whisper + Claude |
| 4.21 | Hosting your own podcast (when ready) | Weekly | STUDIO, eventually STANDALONE | Riverside + Descript |
| 4.22 | Guest sourcing for own podcast | Weekly | STUDIO | Custom |

### Community Manager

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 4.23 | Community identification per brand (Reddit, Discord, Slack, forums) | One-time + quarterly | ALL except CLIENT | Manual + Apify |
| 4.24 | Daily community monitoring (read-only) | Daily | ALL except CLIENT | Apify + RSS |
| 4.25 | Engagement opportunity surfacing | Daily | ALL except CLIENT | Custom |
| 4.26 | Reply drafting (human approval required) | Daily | ALL except CLIENT | Claude API |
| 4.27 | Reddit AMA coordination | Quarterly | PRODUCT | Custom |
| 4.28 | LinkedIn group participation | Weekly | ALL except CLIENT | Manual + agent suggestions |
| 4.29 | Slack community participation (Indie Hackers, etc.) | Daily | STUDIO | Manual |
| 4.30 | Building owned community (if ready) | Ongoing | STANDALONE | Circle, Discord, Substack |

---

## Department 5: Email & Owned Audience

### Email Marketing Manager

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 5.1 | Email platform setup per brand | One-time | ALL except CLIENT | Beehiiv (free) or ConvertKit |
| 5.2 | Newsletter signup form deployment | One-time | ALL except CLIENT | Native CMS or embed |
| 5.3 | Lead magnet creation | Per brand | ALL except CLIENT | Claude + Templated |
| 5.4 | Welcome sequence drafting | One-time per brand | ALL except CLIENT | Claude API |
| 5.5 | Weekly/biweekly newsletter production | Weekly | ALL except CLIENT | Claude API |
| 5.6 | Drip campaigns (nurture sequences) | Per funnel | PRODUCT | Claude API |
| 5.7 | Segmented broadcast emails | Per launch | ALL except CLIENT | Beehiiv segments |
| 5.8 | A/B testing subject lines | Per send | ALL except CLIENT | Native |
| 5.9 | Deliverability monitoring | Weekly | ALL except CLIENT | Mail-Tester, Postmark |
| 5.10 | List hygiene (bounces, unsubs, re-engagement) | Monthly | ALL except CLIENT | Native |
| 5.11 | Cold email outreach (where appropriate) | Per campaign | ALL except CLIENT | Instantly or Smartlead |
| 5.12 | Transactional email optimization | Per template | PRODUCT | Postmark, Resend |

---

## Department 6: Original Research & Authority

### Research Analyst

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 6.1 | Annual industry research report per brand | Annually | ALL except CLIENT | Custom + Claude |
| 6.2 | Quarterly mini-studies | Quarterly | ALL except CLIENT | Custom |
| 6.3 | Survey design and distribution | Per study | ALL except CLIENT | Typeform / Tally |
| 6.4 | Data analysis from internal sources | Per study | ALL except CLIENT | Claude Code + Python |
| 6.5 | Public data scraping for studies | Per study | ALL except CLIENT | Apify MCP |
| 6.6 | Report writing and design | Per study | ALL except CLIENT | Claude + Canva/Cowork |
| 6.7 | Press release coordinating with research | Per study | ALL except CLIENT | Press Ranger |
| 6.8 | Citation tracking for research | Ongoing | ALL except CLIENT | Brave Search + Apify |
| 6.9 | "State of [industry]" annual franchise | Annually | ALL except CLIENT | Custom |

---

## Department 7: Operations & Intelligence

### Head of Marketing Ops (Department Head)

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 7.1 | Credential vault management | Ongoing | ALL | Supabase Vault or 1Password |
| 7.2 | Browser session persistence per brand | Ongoing | ALL | Playwright storage states |
| 7.3 | API key rotation | Quarterly | ALL | Custom |
| 7.4 | Agent run audit log review | Daily | ALL | hub_agent_runs dashboard |
| 7.5 | QA queue management | Daily | ALL | Custom dashboard |
| 7.6 | Cost tracking per brand | Monthly | ALL | Custom |
| 7.7 | Tool subscription management | Ongoing | ALL | Custom |

### Analyst

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 7.8 | Brand health dashboard (real-time) | Continuous | ALL | hub_properties + React |
| 7.9 | Weekly performance reports per brand | Weekly | ALL except CLIENT | Claude + Cowork |
| 7.10 | Monthly executive summary across all brands | Monthly | ALL | Cowork |
| 7.11 | Conversion tracking setup | One-time per brand | ALL except CLIENT | Rybbit / PostHog |
| 7.12 | Attribution modeling (where leads come from) | Monthly | ALL except CLIENT | Custom |
| 7.13 | Cohort analysis for products | Monthly | PRODUCT | Custom |
| 7.14 | Anomaly detection (sudden traffic drop, link loss) | Daily | ALL except CLIENT | Custom |
| 7.15 | Competitor performance benchmarking | Monthly | ALL except CLIENT | Apify |
| 7.16 | Rybbit content site analytics aggregation | Weekly | STANDALONE, STUDIO | Rybbit API |
| 7.17 | PostHog SaaS product analytics | Weekly | PRODUCT | PostHog API |

### Customer Voice Researcher

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 7.18 | Chatwoot ticket pattern analysis | Weekly | ALL | Chatwoot API + Claude |
| 7.19 | Review monitoring across G2, Capterra, etc. | Daily | PRODUCT | Apify |
| 7.20 | Testimonial extraction from positive interactions | Weekly | ALL | Claude |
| 7.21 | Feature request synthesis for product team | Weekly | PRODUCT | Custom |
| 7.22 | Customer pain point reports | Monthly | ALL | Claude |
| 7.23 | NPS / CSAT collection and analysis | Quarterly | ALL | Chatwoot, Delighted |
| 7.24 | Voice of customer quotes for marketing use | Weekly | ALL except CLIENT | Claude |

### Skeptical Reviewer

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 7.25 | Universal content QA checks | Per piece | ALL except CLIENT | Claude API |
| 7.26 | Content-type-specific QA checks | Per piece | ALL except CLIENT | Claude API |
| 7.27 | Image QA (AI artifacts, brand match, copyright) | Per image | ALL except CLIENT | Claude vision |
| 7.28 | Confidence scoring | Per piece | ALL except CLIENT | Custom |
| 7.29 | Learning loop processing (human override capture) | Continuous | ALL except CLIENT | hub_qa_learning_log |
| 7.30 | Per-brand calibration tuning | Weekly initially, monthly later | ALL except CLIENT | Custom |

### Compliance Officer

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 7.31 | FTC disclosure checking on affiliate content | Per piece | STANDALONE | Custom |
| 7.32 | GDPR/privacy policy checking | One-time + updates | ALL except CLIENT | Custom |
| 7.33 | Accessibility audit (WCAG) | Per page | ALL except CLIENT | axe-core, Lighthouse |
| 7.34 | Brand voice violation detection | Per piece | ALL except CLIENT | Claude API |
| 7.35 | Trademark conflict checking on new content | Per piece | ALL except CLIENT | Claude + USPTO API |
| 7.36 | Cookie banner / consent compliance | One-time per brand | ALL except CLIENT | Cookiebot or custom |
| 7.37 | Email CAN-SPAM compliance | Per send | ALL except CLIENT | Custom |
| 7.38 | Image rights / licensing tracking | Per asset | ALL except CLIENT | Custom |
| 7.39 | FERPA compliance review (SPEED-specific) | Per release | PRODUCT (SPEED only) | Manual + Claude |

---

## Department 8: Customer Support (Cross-Cutting)

### Support Operations
Unified customer service infrastructure across all brands.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 8.1 | Chatwoot self-hosted deployment | One-time | ALL | Chatwoot + DigitalOcean |
| 8.2 | Per-brand widget deployment on sites | One-time per brand | ALL except CLIENT | Chatwoot accounts |
| 8.3 | Per-brand AI chatbot training (Captain) | One-time + updates | ALL except CLIENT | Chatwoot Captain |
| 8.4 | Knowledge base per brand | Ongoing | ALL except CLIENT | Chatwoot help center |
| 8.5 | Inbound ticket triage and routing | Daily | ALL except CLIENT | Chatwoot |
| 8.6 | Auto-response for common questions | Continuous | ALL except CLIENT | Chatwoot Captain |
| 8.7 | Human escalation queue | Daily | ALL except CLIENT | Chatwoot |
| 8.8 | Email support inbox unification | Continuous | ALL except CLIENT | Chatwoot email channel |
| 8.9 | Social DM unification | Continuous | ALL except CLIENT | Chatwoot social channels |
| 8.10 | WhatsApp / SMS support (where relevant) | Continuous | LOCAL | Chatwoot WhatsApp |
| 8.11 | CSAT collection per resolved ticket | Per ticket | ALL except CLIENT | Chatwoot native |

---

## Department 9: Website & Conversion Operations

### Web Operations
For brands where the fleet platform manages the CMS.

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 9.1 | CMS content publishing | Daily | marketing_and_cms brands | WordPress MCP / universal-cms |
| 9.2 | Schema markup deployment | Per page | marketing_and_cms | Custom (from Brand Profile Builder) |
| 9.3 | Redirect management | As needed | marketing_and_cms | Netlify / WordPress |
| 9.4 | A/B test setup and monitoring | Per test | ALL except CLIENT | PostHog, GrowthBook |
| 9.5 | Landing page deployment | Per launch | ALL except CLIENT | Framer / Webflow / Astro / universal-cms |
| 9.6 | Form submission monitoring | Daily | ALL except CLIENT | Custom |
| 9.7 | Conversion funnel monitoring | Weekly | ALL except CLIENT | Rybbit / PostHog |
| 9.8 | Site speed optimization | Monthly | ALL except CLIENT | Lighthouse |
| 9.9 | Broken link detection on own site | Weekly | ALL except CLIENT | Screaming Frog or custom |
| 9.10 | Heatmap analysis | Monthly | STANDALONE | Microsoft Clarity (free) |

---

## Department 10: Legal & Business Foundation

### Business Foundation
"Look like a real business" infrastructure (mostly one-time setups).

| # | Activity | Frequency | Brands | Tools |
|---|---|---|---|---|
| 10.1 | Privacy policy generation | One-time per brand | ALL except CLIENT | Termly or Iubenda |
| 10.2 | Terms of service generation | One-time per brand | ALL except CLIENT | Termly |
| 10.3 | Cookie policy + consent banner | One-time per brand | ALL except CLIENT | Cookiebot |
| 10.4 | Real domain email setup (hello@brand.com) | One-time | ALL except CLIENT | Google Workspace or Fastmail |
| 10.5 | About / team page narratives | One-time | ALL except CLIENT | Custom |
| 10.6 | Press kit page assembly | One-time | ALL except CLIENT | Custom |
| 10.7 | Trademark filing tracking | One-time + monitoring | High-value brands | USPTO + custom |
| 10.8 | Wikipedia presence (long-term goal) | One-time | Big brands only | Manual |
| 10.9 | Logo / brand mark trademark | One-time | High-value brands | Custom |
| 10.10 | Annual entity compliance reminders | Annually | ALL | Custom |

---

## Master Tool/Platform Stack

### Pre-built (subscribe and integrate)

| Tool | Purpose | Cost | Status |
|---|---|---|---|
| Vista Social or Publer Business | Multi-brand social publishing | $21-49/mo or AppSumo LTD | Plug in via API |
| Followr.ai (existing) | Chrome automation, partial brand coverage | Already paying | Keep for covered brands |
| Canva Pro | Brand kits, templates, design (manual) | $15/mo (have) | Plug in for visuals |
| Templated.io | Programmatic image rendering | $29/mo | Net new |
| Unsplash + Pexels APIs | Stock photography | Free | Net new |
| Chatwoot (self-hosted) | Multi-brand customer service | ~$10/mo VPS | Self-host |
| Press Ranger | PR distribution, journalist DB | LTD owned | Already have, has skill |
| Featured.com | Quote pitching, publisher platform | LTD owned | Already have, has skill v2 |
| BrightLocal Citation Builder | Local citations for FireShield | $2/citation | Pay as you go |
| Apify Starter | Web scraping, monitoring, SERP | $29/mo | Plug in via MCP |
| Brave Search MCP | Live web search | Free tier | Plug in via MCP |
| MKT1 MCP Server | Marketing strategy frameworks | Sub fee | Optional |
| Beehiiv (free) | Newsletter platform per brand | Free → $39/mo | Plug in per brand |
| Riverside.fm | Podcast recording (when ready) | $15-29/mo | Future |
| Descript | Podcast/video editing | $15/mo | Future |
| Termly | Privacy/ToS generation | $10/mo | Plug in |
| Google Workspace | Real domain emails | $7/user/mo | Per brand |
| Rybbit Analytics | Content site analytics | Already paying for 10 sites | Already have |
| PostHog (free tier) | SaaS product analytics, A/B testing | Free → paid | Plug in per SaaS product |
| Microsoft Clarity | Heatmaps (free) | Free | Plug in per content brand |
| coreyhaines31/marketingskills | Free Claude Code skills | Free | Fork into project |
| OpenPhone or Google Voice | Per-brand phone numbers (verification) | $10-15/line/mo | Per brand needing phone verification |

### Custom Build (your IP)

- Marketing Director coordinator and playbook engine
- Brand voice storage and enforcement layer (extends `hub_brand_voice_briefs`)
- Brand Profile Builder agent
- Multi-brand orchestration logic (studio vs studio_product vs standalone vs client vs local routing)
- Pandotic studio interlinker
- Featured.com extensions (publisher inbound for SafeMama)
- Influencer relationship CRM (`hub_influencers`)
- Podcast booker pipeline (`hub_podcasts`)
- Top X list builder
- Original research workflow (`hub_research_studies`)
- Skeptical Reviewer with learning loop
- QA queue and dashboard
- Credential vault with relationship-type isolation
- Agent audit log (uses existing `hub_agent_runs`)
- Customer voice → marketing feedback loop
- Brand health scoring algorithm
- Multi-view EntityAdapters for `hub_properties`

---

## Activity Count Summary

**Total activities: ~210**
**Total agent roles: 22** (including 5 department heads + Marketing Director + 5 link-building bonus agents)
**Pre-built tools to integrate: 22**
**Custom components to build: 16**

This is the maximalist scope. Phasing is in `marketing-ops-master-spec.md`.

---

## Companion Document

See `marketing-ops-master-spec.md` for the architecture, schema extensions, agent specs, playbooks, and implementation order.

---

**End of checklist.**
