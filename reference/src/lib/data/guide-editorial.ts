/**
 * Hardcoded editorial content for career guide pages.
 * Framework descriptions, skill elaborations, and role-specific narrative.
 */

export const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  GRI: "The Global Reporting Initiative sets the world's most widely used sustainability reporting standards. Understanding GRI is essential for anyone involved in corporate disclosure.",
  ISSB: "The International Sustainability Standards Board (under the IFRS Foundation) establishes global baseline sustainability disclosure standards. ISSB standards (IFRS S1 & S2) are becoming mandatory in many jurisdictions.",
  CDP: "CDP runs the global environmental disclosure system used by thousands of companies, cities, and financial institutions. Many roles require fluency in CDP questionnaires and scoring.",
  TNFD: "The Taskforce on Nature-related Financial Disclosures provides a framework for organizations to report on nature-related risks and opportunities — an emerging and fast-growing area.",
  "GHG Protocol": "The GHG Protocol provides the most widely used standards for measuring and managing greenhouse gas emissions (Scopes 1, 2, and 3). Core knowledge for any climate-related role.",
  ESRS: "European Sustainability Reporting Standards are the disclosure requirements under the EU's Corporate Sustainability Reporting Directive (CSRD). Critical for anyone working with European companies.",
  PRI: "The Principles for Responsible Investment is the world's leading proponent of responsible investment. Understanding PRI is key for investment professionals integrating ESG.",
  "CFA sustainability education": "The CFA Institute offers specialized sustainability and climate credentials that combine investment analysis rigor with ESG domain knowledge.",
  "GARP SCR": "The Global Association of Risk Professionals' Sustainability and Climate Risk (SCR) certificate focuses on climate risk management — a fast-growing specialty in finance and risk.",
};

export const CAREER_CLUSTERS = [
  {
    name: "Reporting & Compliance",
    description:
      "These roles focus on ESG disclosure, regulatory compliance, and assurance. If you're detail-oriented, comfortable with standards and frameworks, and enjoy translating complex requirements into clear outputs, this track is for you.",
    roleSlugs: [
      "esg-manager",
      "reporting-disclosure-specialist",
      "internal-audit-assurance-professional",
    ],
  },
  {
    name: "Climate & Technical",
    description:
      "These roles dig into the data — GHG accounting, emissions analysis, supply chain measurement, and risk modeling. Ideal if you have an analytical or scientific background and want hands-on technical work.",
    roleSlugs: [
      "climate-carbon-analyst",
      "climate-risk-professional",
      "supply-chain-sustainability-professional",
    ],
  },
  {
    name: "Finance & Strategy",
    description:
      "These roles sit at the intersection of sustainability and business strategy — investment analysis, advisory work, and executive leadership. Best suited for those with finance, consulting, or business backgrounds.",
    roleSlugs: [
      "sustainable-investing-analyst",
      "esg-consultant",
      "cso-executive",
    ],
  },
];

export const TIMELINE_STAGES = [
  {
    label: "Months 1–3",
    title: "Build Your Foundation",
    description:
      "Start with free introductory programs to build ESG literacy. Focus on understanding the major frameworks (GRI, ISSB, GHG Protocol) and the landscape of ESG roles. This is also the time to identify which career cluster interests you most.",
  },
  {
    label: "Months 3–9",
    title: "Specialize and Credential",
    description:
      "Pursue a certification or professional credential aligned with your target role. Most ESG certifications take 2–6 months of self-paced study. Simultaneously, start building practical experience through project work, volunteering, or internal sustainability initiatives at your current employer.",
  },
  {
    label: "Year 1–2",
    title: "Deepen Expertise",
    description:
      "Move into intermediate and advanced programs. Develop expertise in specific frameworks relevant to your role. Build a professional network through industry events, LinkedIn communities, and professional organizations. Consider advanced certifications that demonstrate specialization.",
  },
  {
    label: "Year 2+",
    title: "Lead and Advance",
    description:
      "Take on leadership responsibilities, mentor others entering the field, and pursue executive-level programs if targeting CSO or strategic roles. Stay current with evolving regulations and emerging frameworks like TNFD.",
  },
];

export const CERT_DECISION_TREE = [
  {
    scenario: "You work in finance or investment management",
    recommendations: [
      "CFA Sustainable Investing Certificate",
      "FSA Credential",
    ],
    reasoning:
      "These credentials are recognized by the investment community and combine sustainability knowledge with financial analysis rigor. The CFA certificate is a good starting point; the FSA Credential demonstrates deeper expertise.",
  },
  {
    scenario: "You work in corporate reporting or disclosure",
    recommendations: [
      "GRI Professional Certification",
      "FSA Credential",
    ],
    reasoning:
      "GRI certification is the gold standard for sustainability reporting professionals. The FSA Credential adds depth in financial materiality and ISSB standards, which increasingly overlap with corporate reporting.",
  },
  {
    scenario: "You work in risk management or banking",
    recommendations: [
      "GARP SCR Certificate",
      "CFA Climate Risk Certificate",
    ],
    reasoning:
      "The GARP SCR is purpose-built for risk professionals. The CFA Climate Risk certificate adds climate valuation and investing perspectives that complement enterprise risk management.",
  },
  {
    scenario: "You're on a tight budget or just exploring",
    recommendations: ["Start with free programs first"],
    reasoning:
      "Several high-quality programs are completely free — including offerings from the GHG Protocol, TNFD, and PRI Academy. Build your foundation at no cost, then invest in a credential once you've identified your target role.",
  },
  {
    scenario: "You want broad ESG knowledge for consulting or advisory",
    recommendations: [
      "GRI Professional Certification",
      "ISEP Certificate",
    ],
    reasoning:
      "Consultants need broad framework literacy. GRI certification provides the most widely recognized credential, while the ISEP Certificate covers environmental management fundamentals useful for client advisory work.",
  },
];

export const GETTING_STARTED_INTRO = `The ESG and sustainability field is one of the fastest-growing career areas globally. Whether you're a recent graduate, a finance professional looking to specialize, or a mid-career professional pivoting from another field, there's a clear path forward.

But with dozens of certifications, frameworks, and training programs available, knowing where to start can be overwhelming. This guide cuts through the noise and gives you a practical roadmap based on real career paths and the most respected credentials in the industry.`;

export const ROADMAP_INTRO = `ESG careers aren't linear — they're a network of interconnected roles and specializations. A climate analyst might move into risk management. A reporting specialist might become an ESG manager. A consultant might eventually become a Chief Sustainability Officer.

This roadmap shows the most common career transitions based on how professionals actually move through the field. Use it to understand not just where you are, but where you could go next.`;
