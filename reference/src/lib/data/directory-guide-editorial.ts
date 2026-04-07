/**
 * Hardcoded editorial content for directory/ecosystem guide pages.
 */

export const ECOSYSTEM_INTRO = `The ESG ecosystem can seem like an alphabet soup of acronyms and organizations. But beneath the complexity, there's a clear structure. Every organization in the ecosystem falls into one of three functional layers — and understanding these layers is the key to making sense of it all.

Think of it like a building: Layer 1 sets the rules, Layer 2 measures performance against those rules, and Layer 3 provides the tools and services to actually do the work. Once you see this structure, the entire ecosystem clicks into place.`;

export const LAYER_NARRATIVES = {
  "rules-standards": {
    title: "Layer 1: Who Makes the Rules?",
    narrative:
      "At the foundation of the ESG ecosystem are the standard-setting organizations and regulators. These are the bodies that define what companies must or should disclose — from the GRI and ISSB setting global reporting standards, to the EU's EFRAG developing ESRS, to the SEC mandating climate disclosures in the US. Without this layer, there would be no common language for ESG reporting.",
    practitionerNote:
      "Start here. Before choosing tools or hiring consultants, you need to know which standards and regulations apply to your organization. See our Framework Guides for help with this.",
  },
  "data-measurement": {
    title: "Layer 2: Who Measures Performance?",
    narrative:
      "Once the rules are set, someone needs to measure how well companies are performing. This layer includes ESG data and ratings providers (like MSCI, Sustainalytics, and S&P Global), carbon accounting platforms (like Persefoni and Watershed), and data infrastructure providers. These organizations collect, analyze, score, and distribute the ESG data that investors, regulators, and companies rely on.",
    practitionerNote:
      "If you're a company being rated, understanding this layer helps you manage your ESG data proactively. If you're an investor, these are your primary data sources.",
  },
  "implementation-services": {
    title: "Layer 3: Who Helps You Implement?",
    narrative:
      "This is where the rubber meets the road. Layer 3 includes the reporting software platforms that help you compile disclosures, the consulting firms that advise on strategy and compliance, the supply chain tools that manage Scope 3 data, and the assurance providers that verify your reports. These organizations turn rules and data into actionable programs.",
    practitionerNote:
      "Most organizations need at least one tool from this layer. The question is which ones — and that depends on your size, complexity, and reporting obligations.",
  },
};

export const TECH_STACK_INTRO = `Building an ESG program isn't a one-tool problem. Even a small company typically needs at least 2-3 tools: something to measure emissions, something to compile reports, and something to verify the results. Larger organizations may need a dozen or more specialized platforms working together.

The good news: you don't need everything on day one. Start with the foundations and build out as your program matures. This guide shows you what to prioritize based on your company size and reporting obligations.`;

export const STARTER_STACKS = [
  {
    companySize: "SME (Under 250 employees)",
    editorial:
      "Keep it simple. You likely don't have mandatory reporting obligations yet (unless you're EU-listed), but proactive disclosure builds credibility with customers and investors. Start with free tools and a single reporting platform.",
    priorities: [
      "Free GHG Protocol training to understand emissions basics",
      "One carbon accounting tool with SME-friendly pricing",
      "Voluntary CDP disclosure to get ahead of supply chain requests",
      "A basic reporting template (many platforms offer free tiers)",
    ],
    categoryIds: ["carbon-accounting", "reporting-software"],
  },
  {
    companySize: "Mid-Market (250–5,000 employees)",
    editorial:
      "At this size, you're likely in scope for CSRD (if EU-based) or facing pressure from customers and investors. You need more robust data collection, multi-framework reporting, and possibly third-party assurance.",
    priorities: [
      "Carbon accounting platform with Scope 3 capabilities",
      "ESG reporting software supporting ESRS, GRI, or ISSB",
      "Supply chain data collection tool (if you have complex supply chains)",
      "An ESG data provider subscription for benchmarking",
      "Assurance-ready processes (start planning for limited assurance)",
    ],
    categoryIds: [
      "carbon-accounting",
      "reporting-software",
      "supply-chain",
      "esg-data-ratings",
    ],
  },
  {
    companySize: "Enterprise (5,000+ employees)",
    editorial:
      "Large enterprises need a comprehensive, integrated tech stack. You're almost certainly subject to mandatory reporting in at least one jurisdiction. Your challenges are data collection across business units, multi-framework alignment, supply chain visibility, and assurance readiness.",
    priorities: [
      "Enterprise carbon accounting platform with ERP integration",
      "Multi-framework reporting software (CSRD, SEC, GRI, ISSB)",
      "ESG data infrastructure for aggregation and APIs",
      "Supply chain sustainability platform for Scope 3 and due diligence",
      "Consulting support for strategy and gap analysis",
      "Verification and assurance engagement",
    ],
    categoryIds: [
      "carbon-accounting",
      "reporting-software",
      "data-infrastructure",
      "supply-chain",
      "consulting",
      "verification",
    ],
  },
];

export const ECOSYSTEM_FAQS = [
  {
    question: "What is the ESG ecosystem?",
    answer:
      "The ESG ecosystem is the network of organizations that create, measure, and implement environmental, social, and governance standards. It includes three layers: standard-setters and regulators (Layer 1) who define reporting rules, data and ratings providers (Layer 2) who measure and score company performance, and implementation tools and services (Layer 3) like reporting software, consulting firms, and assurance providers that help organizations do the work.",
  },
  {
    question: "What are the three layers of the ESG ecosystem?",
    answer:
      "Layer 1 (Rules & Standards) includes organizations like GRI, ISSB, EFRAG, and the SEC that set the frameworks and regulations defining what companies must disclose. Layer 2 (Data & Measurement) includes ESG data providers like MSCI, Sustainalytics, and S&P Global, plus carbon accounting platforms. Layer 3 (Implementation & Services) includes reporting software, consulting firms, supply chain tools, and assurance providers that help companies operationalize their ESG programs.",
  },
  {
    question: "How many ESG data providers are there?",
    answer:
      "There are over 600 ESG data products globally, but the market is dominated by a handful of major providers: MSCI ESG, Sustainalytics (Morningstar), S&P Global, ISS ESG, Bloomberg ESG, and CDP. These providers use different methodologies, which is why ESG ratings from different providers often disagree. Understanding the differences helps you choose the right data sources for your needs.",
  },
  {
    question: "What is the difference between ESG ratings and ESG reporting?",
    answer:
      "ESG reporting is what companies do — disclosing their environmental, social, and governance performance using frameworks like GRI, ISSB, or ESRS. ESG ratings are what data providers do — analyzing company disclosures and other data sources to score and rank companies on ESG performance. Reporting is input; ratings are output. Companies can influence their ratings by improving both their actual ESG performance and the quality of their disclosures.",
  },
  {
    question: "Do I need all three layers to have an ESG program?",
    answer:
      "Yes, in some form. Every ESG program needs to understand its obligations (Layer 1), measure performance (Layer 2), and implement solutions (Layer 3). But the tools within each layer scale with company size. An SME might use free GHG Protocol guidance, a simple spreadsheet, and a basic reporting template. An enterprise might need multiple specialized platforms across all three layers working together as an integrated tech stack.",
  },
];

export const TECH_STACK_FAQS = [
  {
    question: "What tools do I need for ESG reporting?",
    answer:
      "At minimum, most companies need three types of tools: (1) a carbon accounting platform to measure GHG emissions across Scopes 1, 2, and 3; (2) a reporting/disclosure platform to compile reports aligned with frameworks like CSRD/ESRS, GRI, or ISSB; and (3) data collection capabilities to gather ESG data from across business units, facilities, and supply chain partners. Larger companies may also need supply chain sustainability tools, ESG data subscriptions, and assurance services.",
  },
  {
    question: "How much does an ESG tech stack cost?",
    answer:
      "Costs vary dramatically by company size. SMEs can start with free tools (GHG Protocol spreadsheets, free CDP disclosure) and a basic reporting platform for $5,000–$20,000/year. Mid-market companies typically spend $50,000–$200,000/year on carbon accounting, reporting software, and data subscriptions. Enterprise organizations may spend $500,000+ annually on a full tech stack including multiple platforms, consulting, and assurance. The cost of non-compliance (fines, reputational damage, lost contracts) typically far exceeds software investment.",
  },
  {
    question: "Should I buy one platform or multiple best-of-breed tools?",
    answer:
      "It depends on your complexity. A single integrated platform works well for organizations with straightforward reporting needs (1–2 frameworks, limited supply chain complexity). Multiple best-of-breed tools work better for complex enterprises that need deep capabilities in carbon accounting, multi-framework reporting, and supply chain management. The trend is toward platform consolidation, but few single vendors excel across all ESG functions yet.",
  },
  {
    question: "What ESG tools should a small company start with?",
    answer:
      "Start with: (1) GHG Protocol's free calculation tools for basic emissions measurement; (2) CDP disclosure — it's free to report and signals commitment to investors; (3) a simple reporting platform with SME-friendly pricing (many offer free tiers or starter plans); (4) GRI's free online standards as your reporting framework. Total initial investment can be under $10,000/year. Scale up as your program matures and regulatory requirements expand.",
  },
  {
    question: "How do I integrate ESG tools with existing systems?",
    answer:
      "Key integration points include: ERP systems (SAP, Oracle) for financial and operational data; HR platforms for workforce metrics (diversity, training, health & safety); utility management systems for energy and water consumption; procurement systems for supply chain data; and accounting software for financial alignment. Look for ESG platforms with pre-built connectors or robust APIs. Poor integration is the top cause of ESG reporting delays.",
  },
];

export const REPORTING_SOFTWARE_FAQS = [
  {
    question: "What is ESG reporting software?",
    answer:
      "ESG reporting software is a platform that helps organizations collect, manage, analyze, and disclose environmental, social, and governance data aligned with reporting frameworks like CSRD/ESRS, GRI, ISSB, CDP, and SEC requirements. These platforms automate data collection from across the organization, map data to multiple framework requirements simultaneously, generate disclosure-ready reports, and maintain audit trails for assurance.",
  },
  {
    question: "What should I look for in ESG reporting software?",
    answer:
      "The six key evaluation criteria are: (1) Framework coverage — does it support the specific standards you need (CSRD/ESRS, GRI, ISSB, CDP, SEC)? (2) Data collection — can it gather data from across your organization via integrations and workflows? (3) Audit trail and assurance readiness — critical for CSRD compliance. (4) System integrations — ERP, HR, and utility system connectors. (5) Multi-entity and scalability support. (6) Total cost of ownership including implementation and training.",
  },
  {
    question: "How much does ESG reporting software cost?",
    answer:
      "Pricing varies widely. SME-focused platforms start at $5,000–$15,000/year. Mid-market solutions typically cost $30,000–$100,000/year. Enterprise platforms with full framework coverage, advanced integrations, and multi-entity support range from $100,000–$500,000+/year. Most vendors use subscription pricing, though some charge per framework, per entity, or per user. Always factor in implementation costs, which can equal 50–100% of the first year's license fee.",
  },
  {
    question: "What is the best ESG reporting software?",
    answer:
      "There is no single 'best' platform — the right choice depends on your company size, reporting obligations, existing tech stack, and budget. For enterprise CSRD compliance, look at platforms with strong ESRS support and EU presence. For US companies focused on voluntary disclosure, CDP-integrated platforms may be sufficient. For companies needing multi-framework coverage, prioritize platforms that map data across standards automatically. Use our Solution Finder and Compare tools to evaluate options for your specific situation.",
  },
  {
    question: "Can I use Excel or Google Sheets for ESG reporting?",
    answer:
      "Spreadsheets work for very early-stage programs or small companies with simple reporting needs. However, they become problematic as programs mature because they lack audit trails (critical for CSRD assurance), can't map data across multiple frameworks automatically, make multi-person data collection error-prone, don't scale across business units, and create version control issues. Most companies outgrow spreadsheets within 1–2 reporting cycles.",
  },
  {
    question: "How long does it take to implement ESG reporting software?",
    answer:
      "Implementation timelines range from 4–6 weeks for SME platforms with simple setups, to 3–6 months for mid-market solutions with moderate complexity, to 6–12+ months for enterprise deployments with ERP integrations, multi-entity rollouts, and historical data migration. Key factors affecting timeline include data source complexity, number of frameworks, organizational readiness, and integration requirements. Plan to run your first reporting cycle in parallel with your old process.",
  },
];

export const REPORTING_SOFTWARE_INTRO = `Choosing ESG reporting software is one of the most consequential decisions in building your sustainability program. The right platform saves hundreds of hours of manual work; the wrong one creates technical debt that's painful to unwind.

The market has matured significantly — there are now dozens of platforms with different strengths, pricing models, and framework coverage. This guide helps you evaluate what matters most for your situation.`;

export const REPORTING_EVALUATION_CRITERIA = [
  {
    criterion: "Framework Coverage",
    description:
      "Does the platform support the specific frameworks you need to report against? CSRD/ESRS, GRI, ISSB, CDP, SEC — the best platforms support multiple frameworks and map data points across them automatically.",
    importance: "critical",
  },
  {
    criterion: "Data Collection",
    description:
      "How does the platform gather data from across your organization? Look for automated data connectors (ERP, HR, utility systems), workflow-based data requests to business units, and bulk upload capabilities.",
    importance: "critical",
  },
  {
    criterion: "Audit Trail & Assurance",
    description:
      "As assurance requirements expand, your reporting platform needs to maintain a complete audit trail — who entered what data, when, with what supporting documentation. This is non-negotiable for companies subject to CSRD.",
    importance: "critical",
  },
  {
    criterion: "Integrations",
    description:
      "Can the platform connect with your existing systems? Key integrations include ERP (SAP, Oracle), HR systems, utility data providers, carbon accounting platforms, and supply chain tools.",
    importance: "high",
  },
  {
    criterion: "Scalability & Multi-Entity",
    description:
      "If you operate across multiple subsidiaries, regions, or brands, the platform needs to support multi-entity reporting with consolidation. This becomes critical as CSRD scope expands.",
    importance: "high",
  },
  {
    criterion: "Pricing Model",
    description:
      "Enterprise contracts, subscription, and usage-based pricing all exist in this market. Understand the total cost of ownership including implementation, training, and ongoing support.",
    importance: "medium",
  },
];
