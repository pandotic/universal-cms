/**
 * Hardcoded editorial content for framework guide pages.
 */

export const WHICH_FRAMEWORK_INTRO = `With 19 active ESG frameworks, standards, and regulations — and more on the way — figuring out which ones apply to your organization can feel overwhelming. The answer depends on three things: where you operate, what type of organization you are, and what your stakeholders expect.

This guide cuts through the complexity. Find your situation below and see exactly which frameworks are mandatory, which are strongly recommended, and which are optional but valuable.`;

export const JURISDICTION_DECISION_TREE = [
  {
    jurisdiction: "European Union",
    scenarios: [
      {
        companyType: "Large EU public company (500+ employees)",
        mandatory: ["eu-csrd", "esrs", "eu-taxonomy"],
        recommended: ["gri-standards", "cdp", "ghg-protocol"],
        notes:
          "CSRD reporting under ESRS is being phased in from 2024. EU Taxonomy alignment is required for eligible activities. SFDR applies if you offer financial products.",
      },
      {
        companyType: "EU-listed SME",
        mandatory: ["eu-csrd", "esrs"],
        recommended: ["gri-standards", "ghg-protocol"],
        notes:
          "Simplified ESRS standards are available for listed SMEs. CSRD requirements phase in from 2026 for this group.",
      },
      {
        companyType: "EU financial institution",
        mandatory: ["eu-csrd", "esrs", "sfdr", "eu-taxonomy"],
        recommended: ["tcfd", "pcaf", "cdp", "issb-ifrs-s1-s2"],
        notes:
          "SFDR requires sustainability risk disclosure for financial products. PCAF is the standard for financed emissions. TCFD recommendations are embedded in ISSB standards.",
      },
    ],
  },
  {
    jurisdiction: "United States",
    scenarios: [
      {
        companyType: "SEC-registered public company",
        mandatory: ["sec-climate-rule"],
        recommended: [
          "ghg-protocol",
          "tcfd",
          "issb-ifrs-s1-s2",
          "cdp",
          "gri-standards",
          "sbti",
        ],
        notes:
          "The SEC Climate Disclosure Rule requires climate-related disclosures. Many companies also report voluntarily to CDP, adopt ISSB/GRI, and set SBTi targets to meet investor expectations.",
      },
      {
        companyType: "California-based large company",
        mandatory: ["california-sb-253-261", "sec-climate-rule"],
        recommended: ["ghg-protocol", "cdp", "sbti"],
        notes:
          "SB 253 requires GHG emissions disclosure (Scopes 1, 2, and 3) for companies with revenue over $1B. SB 261 requires climate risk reporting. Both build on GHG Protocol methodology.",
      },
      {
        companyType: "US private company",
        mandatory: [],
        recommended: [
          "ghg-protocol",
          "cdp",
          "gri-standards",
          "sbti",
          "issb-ifrs-s1-s2",
        ],
        notes:
          "No mandatory ESG reporting for private companies yet, but voluntary disclosure is increasingly expected by investors, customers, and supply chain partners.",
      },
    ],
  },
  {
    jurisdiction: "India",
    scenarios: [
      {
        companyType: "Top 1,000 listed companies by market cap",
        mandatory: ["brsr"],
        recommended: ["gri-standards", "ghg-protocol", "cdp"],
        notes:
          "BRSR (Business Responsibility and Sustainability Reporting) is mandatory for the top 1,000 listed entities. It draws on GRI and is evolving toward ISSB alignment.",
      },
    ],
  },
  {
    jurisdiction: "Global / Any jurisdiction",
    scenarios: [
      {
        companyType: "Any company setting climate targets",
        mandatory: [],
        recommended: ["ghg-protocol", "sbti", "cdp", "tcfd"],
        notes:
          "GHG Protocol is the foundation for emissions measurement. SBTi validates science-based targets. CDP is the primary disclosure mechanism. TCFD (now folded into ISSB) frames climate risk.",
      },
      {
        companyType: "Any company reporting on nature/biodiversity",
        mandatory: [],
        recommended: ["tnfd", "cdp", "gri-standards"],
        notes:
          "TNFD provides the leading framework for nature-related risk disclosure. CDP has added nature/biodiversity questionnaires. GRI covers biodiversity through specific topic standards.",
      },
      {
        companyType: "Company wanting broad sustainability reporting",
        mandatory: [],
        recommended: [
          "gri-standards",
          "issb-ifrs-s1-s2",
          "cdp",
          "ghg-protocol",
        ],
        notes:
          "GRI is the most widely adopted voluntary standard globally (10,000+ organizations). ISSB provides the investor-focused baseline. Together they cover both impact and financial materiality.",
      },
    ],
  },
];

export const CONVERGENCE_CLUSTERS = [
  {
    name: "The EU Ecosystem",
    narrative:
      "The EU has built the world's most comprehensive mandatory ESG reporting system. CSRD is the directive that mandates reporting. ESRS are the detailed standards companies must follow. EU Taxonomy defines which economic activities count as 'sustainable.' SFDR applies the same logic to financial products. CSDDD adds supply chain due diligence requirements. These five frameworks form an integrated regulatory architecture — you can't understand one without the others.",
    frameworkSlugs: ["eu-csrd", "esrs", "eu-taxonomy", "sfdr", "csddd"],
  },
  {
    name: "The Global Convergence",
    narrative:
      "For years, GRI and SASB operated as competing standards. In 2023, the ISSB (under the IFRS Foundation) absorbed SASB and built on TCFD to create IFRS S1 and S2. Meanwhile, GRI and ISSB signed a cooperation agreement to ensure interoperability. The result: GRI covers impact materiality (your effect on the world), while ISSB covers financial materiality (the world's effect on your finances). Together, they form a 'double materiality' baseline — the same concept the EU codified in ESRS.",
    frameworkSlugs: [
      "gri-standards",
      "issb-ifrs-s1-s2",
      "sasb-standards",
      "tcfd",
    ],
  },
  {
    name: "The Climate Chain",
    narrative:
      "Climate reporting has its own ecosystem. GHG Protocol provides the accounting methodology for measuring emissions (Scopes 1, 2, 3). CDP is the primary disclosure platform (backed by 700+ investors). SBTi validates that emissions reduction targets align with climate science. TCFD (now folded into ISSB) frames how climate risks affect financial performance. These four form a chain: measure → disclose → target → integrate into financial risk.",
    frameworkSlugs: ["ghg-protocol", "cdp", "sbti", "tcfd"],
  },
  {
    name: "Nature & Emerging Frameworks",
    narrative:
      "TNFD extends the TCFD model to nature and biodiversity — covering dependencies and impacts on ecosystems, not just climate. Launched in 2023, it's the fastest-growing new framework. ISO 14001 and ISO 14064 provide management system and GHG accounting standards respectively. PCAF standardizes how financial institutions measure financed emissions. These frameworks address the gaps that first-generation climate standards didn't cover.",
    frameworkSlugs: ["tnfd", "iso-14001", "iso-14064", "pcaf"],
  },
];

export const MANDATORY_VS_VOLUNTARY_INTRO = `The ESG reporting landscape is undergoing a fundamental shift. What was once entirely voluntary is rapidly becoming mandatory — especially in the EU, and increasingly in the US and Asia.

Understanding this distinction matters because it determines your compliance obligations, your timeline, and your risk exposure. Mandatory frameworks carry legal consequences for non-compliance. Voluntary frameworks signal leadership and meet stakeholder expectations — but missing them won't land you in regulatory trouble.

Here's how the landscape breaks down.`;

export const MANDATORY_EDITORIAL = `These frameworks carry legal or regulatory compliance requirements. Non-compliance can result in penalties, enforcement actions, or loss of market access. If a regulation applies to your organization, compliance is not optional.

Key trend: The scope of mandatory reporting is expanding rapidly. CSRD alone will bring ~50,000 companies into scope by 2028 — many of which have never reported on sustainability before.`;

export const VOLUNTARY_EDITORIAL = `These frameworks are adopted by choice — but "voluntary" doesn't mean "unimportant." Many voluntary standards are becoming de facto requirements driven by investor expectations, customer demands, and supply chain pressure. Companies that don't report to CDP, for example, may lose access to capital from the 700+ institutional investors that use CDP data.

Key trend: The line between voluntary and mandatory is blurring. TCFD was voluntary until ISSB absorbed it into mandatory disclosure standards. CDP questionnaires increasingly align with regulatory requirements. GRI's standards are referenced in CSRD/ESRS.`;

export const COMPLIANCE_TIMELINE = [
  { year: "2024", event: "CSRD reporting begins for largest EU companies (first reports due 2025)", framework: "eu-csrd" },
  { year: "2024", event: "SEC Climate Rule finalized for large accelerated filers", framework: "sec-climate-rule" },
  { year: "2025", event: "CSRD Phase 2: extends to large companies (250+ employees)", framework: "eu-csrd" },
  { year: "2025", event: "California SB 253/261 reporting begins for companies over $1B revenue", framework: "california-sb-253-261" },
  { year: "2026", event: "CSRD Phase 3: extends to listed SMEs", framework: "eu-csrd" },
  { year: "2026", event: "CSDDD due diligence obligations begin for largest companies", framework: "csddd" },
  { year: "2027", event: "ISSB standards expected to become mandatory in several jurisdictions", framework: "issb-ifrs-s1-s2" },
];

export const WHICH_FRAMEWORK_FAQS = [
  {
    question: "How many ESG frameworks exist?",
    answer:
      "There are over 600 ESG-related reporting provisions worldwide, but the core frameworks that most organizations need to consider number around 15–20. The most widely adopted include GRI, ISSB (IFRS S1/S2), CSRD/ESRS, CDP, GHG Protocol, SBTi, and TCFD. Which ones apply to you depends on your jurisdiction, company type, and industry.",
  },
  {
    question: "Do I need to comply with all ESG frameworks?",
    answer:
      "No. Most organizations are subject to 1–3 mandatory frameworks based on their jurisdiction and size, and may voluntarily adopt 2–4 additional standards. For example, a large EU company must comply with CSRD/ESRS and EU Taxonomy, but may voluntarily report to CDP and set SBTi targets. The key is identifying which are legally required vs. strategically valuable.",
  },
  {
    question: "What is the difference between ESG frameworks and standards?",
    answer:
      "A framework provides the overall structure and principles for ESG reporting (e.g., TCFD, which outlines four pillars: governance, strategy, risk management, and metrics). A standard provides the specific, detailed disclosure requirements within that structure (e.g., ESRS, which specifies exactly what data points to report). In practice, the terms are often used interchangeably.",
  },
  {
    question: "Which ESG framework is most widely used globally?",
    answer:
      "GRI (Global Reporting Initiative) is the most widely adopted voluntary ESG reporting standard, used by over 10,000 organizations worldwide. For climate-specific disclosure, CDP is the most widely used platform with 23,000+ companies disclosing. ISSB (IFRS S1/S2) is emerging as the global baseline for investor-focused sustainability disclosure.",
  },
  {
    question: "What ESG frameworks apply to private companies?",
    answer:
      "Most mandatory ESG frameworks currently apply to public companies and large enterprises. Private companies generally don't have mandatory ESG reporting obligations unless they meet specific size thresholds (e.g., CSRD applies to large EU private companies with 250+ employees). However, private companies increasingly face pressure from investors, customers, and supply chain partners to report voluntarily using frameworks like GRI, CDP, and GHG Protocol.",
  },
  {
    question: "How do I start if I've never done ESG reporting?",
    answer:
      "Start with GHG Protocol to measure your carbon emissions — it's free, widely recognized, and foundational to almost every other framework. Then determine your mandatory obligations using our jurisdiction guide above. Next, consider voluntary CDP disclosure if your investors or customers request it. For a comprehensive first report, GRI provides the most flexible and widely accepted structure.",
  },
];

export const MANDATORY_VS_VOLUNTARY_FAQS = [
  {
    question: "What is mandatory ESG reporting?",
    answer:
      "Mandatory ESG reporting refers to sustainability disclosure requirements that carry legal or regulatory obligations. Non-compliance can result in fines, enforcement actions, or loss of market access. Examples include CSRD in the EU (requiring ~50,000 companies to report under ESRS), the SEC Climate Rule in the US, and BRSR in India. These are not optional — if your organization falls within scope, you must comply.",
  },
  {
    question: "Is ESG reporting mandatory in the United States?",
    answer:
      "It depends on your company type and location. The SEC Climate Disclosure Rule requires public companies to disclose climate-related risks and GHG emissions. California's SB 253 and SB 261 require large companies operating in California to disclose emissions and climate risks. For most US private companies, ESG reporting remains voluntary — though this is changing rapidly.",
  },
  {
    question: "What happens if you don't comply with mandatory ESG reporting?",
    answer:
      "Consequences vary by regulation. Under CSRD, non-compliance can result in financial penalties set by EU member states, and auditors may qualify their opinions. The SEC can pursue enforcement actions including fines. California SB 253/261 violations carry administrative penalties. Beyond legal consequences, non-compliance creates reputational risk and can affect access to capital.",
  },
  {
    question: "Are voluntary ESG frameworks becoming mandatory?",
    answer:
      "Yes, this is a clear trend. TCFD was voluntary until its recommendations were incorporated into the mandatory ISSB standards. GRI's standards are referenced in CSRD/ESRS. CDP questionnaires increasingly align with regulatory requirements. SBTi targets are becoming conditions for financing from major banks. The direction of travel is unmistakable: today's voluntary standards frequently become tomorrow's regulations.",
  },
  {
    question: "What is the CSRD and who does it apply to?",
    answer:
      "The Corporate Sustainability Reporting Directive (CSRD) is the EU's mandatory sustainability reporting law. It applies to: all large EU companies (250+ employees, €40M+ turnover, or €20M+ total assets), EU-listed SMEs, and non-EU companies with significant EU revenue (€150M+). Implementation is phased from 2024–2028, ultimately covering approximately 50,000 companies.",
  },
  {
    question: "Should private companies do voluntary ESG reporting?",
    answer:
      "Increasingly, yes. Even without legal obligations, voluntary ESG reporting helps attract investment (ESG-focused AUM exceeded $30 trillion), win enterprise customers who require supply chain sustainability data, attract talent (especially Gen Z workers), reduce risk by identifying environmental and social vulnerabilities early, and prepare for regulations that are likely coming. Start with GHG Protocol and CDP — they're low-cost and highly recognized.",
  },
];

export const HOW_FRAMEWORKS_CONNECT_FAQS = [
  {
    question: "How are GRI and ISSB related?",
    answer:
      "GRI and ISSB signed a cooperation agreement to ensure their standards work together. GRI focuses on impact materiality (how your organization affects the world), while ISSB focuses on financial materiality (how sustainability issues affect your finances). Together, they provide a 'double materiality' view — the same concept the EU codified in ESRS. If you report using both, you get comprehensive coverage of ESG impacts from all angles.",
  },
  {
    question: "What happened to TCFD and SASB?",
    answer:
      "Both have been absorbed into the ISSB framework. The TCFD (Task Force on Climate-related Financial Disclosures) recommendations are fully incorporated into IFRS S2 (Climate). SASB's industry-specific standards inform the industry guidance for ISSB. The TCFD formally dissolved in 2023 after the ISSB took over monitoring. Companies previously reporting under TCFD or SASB should transition to ISSB/IFRS S1 and S2.",
  },
  {
    question: "Do I need to report under every framework in a cluster?",
    answer:
      "No. Frameworks within a cluster share common concepts and data points, which means work done for one significantly reduces the effort for others. For example, if you already report to GRI, approximately 60–70% of your data points map to ESRS requirements. The key is to identify your anchor framework (usually the mandatory one) and map existing work to related standards rather than starting fresh.",
  },
  {
    question: "How does the EU regulatory ecosystem fit together?",
    answer:
      "The EU has five interconnected frameworks: CSRD is the directive requiring companies to report. ESRS are the detailed reporting standards developed by EFRAG. EU Taxonomy defines which activities are 'environmentally sustainable.' SFDR requires financial market participants to disclose sustainability risks of their products. CSDDD requires supply chain due diligence. They reference each other extensively — for instance, ESRS requires disclosure of EU Taxonomy alignment.",
  },
  {
    question: "What is the climate chain and why does it matter?",
    answer:
      "The 'climate chain' refers to four frameworks that work together as a pipeline: GHG Protocol provides the methodology for measuring emissions. CDP is the platform for disclosing that data to investors. SBTi validates that your reduction targets align with climate science. ISSB (formerly TCFD) integrates climate risk into financial reporting. Understanding this chain helps you see that these aren't competing frameworks — they're sequential steps in comprehensive climate management.",
  },
];

export const HOW_FRAMEWORKS_CONNECT_INTRO = `ESG frameworks don't exist in isolation — they form an interconnected web where standards reference each other, regulations build on voluntary frameworks, and regional rules align with global baselines.

Understanding these connections is essential for two reasons. First, it prevents duplicate effort: if you already report to GRI, you've done much of the work needed for ESRS. Second, it helps you prioritize: instead of tackling 19 frameworks independently, you can identify the clusters that matter for your situation and work through them systematically.`;
