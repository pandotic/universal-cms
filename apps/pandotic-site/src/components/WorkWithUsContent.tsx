"use client";

import { useState, useRef } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import TextReveal from "@/components/TextReveal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ColorSet {
  main: string;
  light: string;
  mid: string;
  text: string;
}

interface EconItem {
  l: string;
  v: string;
}

interface BrewModel {
  name: string;
  tl: string;
  c: keyof typeof COLORS;
  desc: string;
  eco: EconItem[];
}

interface GetNeed {
  b: string;
  p: string;
}

interface Lever {
  l: string;
  n: number;
  v: string;
}

interface Model {
  id: string;
  name: string;
  num: string;
  c: keyof typeof COLORS;
  tl: string;
  one: string;
  gets: GetNeed[];
  needs: GetNeed[];
  levers: Lever[];
  calcFn: (v: number) => EconItem[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

type PathType = "individual" | "company";

const COLORS: Record<string, ColorSet> = {
  teal: { main: "#0d8a6a", light: "#e7f7f2", mid: "#b0e4d0", text: "#0d8a6a" },
  purp: { main: "#6c4fcf", light: "#eee8ff", mid: "#c7b5f5", text: "#6c4fcf" },
  coral: { main: "#c94420", light: "#fdeee8", mid: "#f5baa5", text: "#c94420" },
  amber: { main: "#9a6b0a", light: "#fef6e0", mid: "#f5dfa0", text: "#9a6b0a" },
  gray: { main: "#6b6b82", light: "#e8ecf4", mid: "#c4c4d0", text: "#6b6b82" },
};

const BREW_LABELS: Record<string, string[]> = {
  budget: ["$0", "$5\u201315K", "~$25K", "$25\u201350K", "$75K+"],
  effort: ["None", "Light", "Some", "Significant", "Full-time"],
  risk: ["Minimal", "Low", "Moderate", "High", "All-in"],
  domain: ["None", "Basic", "Some", "Deep", "Expert"],
};

// Path-specific slider config
const SLIDER_CONFIG: Record<PathType, { budget: { label: string; desc: string; left: string; right: string }; effort: { label: string; desc: string; left: string; right: string }; risk: { label: string; desc: string; left: string; right: string }; domain: { label: string; desc: string; left: string; right: string } }> = {
  individual: {
    budget: { label: "Capital you can invest", desc: "How much are you ready to put into building a business?", left: "$0", right: "$75K+" },
    effort: { label: "Your role", desc: "How hands-on do you want to be day-to-day?", left: "Just invest", right: "I'll run it" },
    risk: { label: "Risk tolerance", desc: "Predictable service fee or bet on equity upside?", left: "Predictable", right: "Bet big" },
    domain: { label: "Your industry expertise", desc: "How deep is your knowledge of the industry you want to build in?", left: "I'm learning", right: "15+ year vet" },
  },
  company: {
    budget: { label: "Project budget", desc: "What's allocated for this build?", left: "$0", right: "$75K+" },
    effort: { label: "Your team's involvement", desc: "How involved will your team be in the build?", left: "Hands-off", right: "Embedded" },
    risk: { label: "Risk tolerance", desc: "Fixed deliverable or shared-upside model?", left: "Fixed scope", right: "Shared upside" },
    domain: { label: "Domain complexity", desc: "How specialized is the problem you're solving?", left: "Straightforward", right: "Highly regulated" },
  },
};

// Path-specific brew taglines
const BREW_TAGLINES: Record<PathType, string[]> = {
  individual: [
    "Know someone who needs this? Get paid for the intro.",
    "Get a running product for your market \u2014 fast",
    "Sell into your network. We build the tech. Split the revenue.",
    "Fund the build, get first-mover advantage",
    "Your expertise + our tech = your company",
  ],
  company: [
    "Send us deal flow. Earn 10\u201320% per closed deal.",
    "Launch on a proven platform instead of building from zero",
    "Turn your customer relationships into a recurring tech revenue stream",
    "Get it built below market cost \u2014 we keep the platform for other verticals",
    "Spin out a product from your institutional knowledge",
  ],
};

const BREW_MODELS: BrewModel[] = [
  { name: "Just make introductions", tl: "Referral partner", c: "gray",
    desc: "You know people who need what we build. Make an intro, we handle everything else, you earn 10\u201320% per closed deal. Zero risk, zero commitment.",
    eco: [{ l: "You pay", v: "$0" }, { l: "You earn", v: "10\u201320%/deal" }, { l: "Your effort", v: "One email" }] },
  { name: "License our platform", tl: "Platform license", c: "teal",
    desc: "We\u2019ve already built the hard parts. You license the platform, we customize it for your market, and you run with it. Fastest path from idea to product.",
    eco: [{ l: "You pay", v: "$25\u201350K" }, { l: "Timeline", v: "4\u20136 weeks" }, { l: "You own", v: "The business" }] },
  { name: "Sell our product together", tl: "Revenue share", c: "purp",
    desc: "You sell and support through your network. We build and maintain the tech. Revenue splits 50/50 to 70/30 in our favor. Built for industry connectors.",
    eco: [{ l: "You pay", v: "$5\u201315K" }, { l: "You keep", v: "30\u201350%" }, { l: "Your job", v: "Sell + support" }] },
  { name: "Fund the build, get it first", tl: "Funded development", c: "amber",
    desc: "You have budget and a specific problem. We build it on our platform at below-market cost. You get exclusivity in your market. We keep the platform for other verticals.",
    eco: [{ l: "You pay", v: "$25\u201350K" }, { l: "Exclusivity", v: "6\u201312 months" }, { l: "You save", v: "60\u201380%" }] },
  { name: "Be the founder", tl: "Domain expert co-founder", c: "coral",
    desc: "You\u2019ve spent a career in your industry. Bring capital, credibility, and a sales network. We build you a company. You own 40\u201360% equity and run the business.",
    eco: [{ l: "You invest", v: "$25\u201375K" }, { l: "Your equity", v: "40\u201360%" }, { l: "Your role", v: "CEO" }] },
];

function getBrewResult(b: number, e: number, r: number, d: number): number {
  if (b <= 0 && e <= 0) return 0;
  if (e >= 4 && d >= 3 && r >= 3) return 4;
  if (e >= 3 && d >= 2) return 2;
  if (b >= 3 && e <= 2) return 3;
  if (b >= 2 && e <= 1) return 1;
  if (d >= 3 && r >= 3) return 4;
  if (e >= 3) return 2;
  if (b >= 2) return 3;
  return 1;
}

// Path-specific examples for model cards
const MODEL_EXAMPLES: Record<PathType, Record<string, string>> = {
  individual: {
    license: "A career educator wanted to launch a test-prep business. Instead of hiring a dev team, she licensed our learning platform \u2014 adaptive study tools, AI-generated questions, knowledge graphs already built. Custom branded, launched in 6 weeks. She runs the business; we maintain the tech.",
    revshare: "A retired HR executive with deep connections in healthcare staffing wanted passive income from tech without building anything. We had a workforce scheduling AI ready to go. She sells it through her network, handles onboarding calls, keeps 40% of every deal. No code, no overhead.",
    domain: "A former SPED director who spent 20 years in public schools. She knows every district, every pain point, every buyer. We built her an AI-powered IEP compliance platform. She invested $50K, owns 55% equity, and runs the company. We\u2019re the tech co-founder she never had.",
    funded: "An angel investor saw an opportunity in AI-powered home energy audits. He funded $40K of development on our platform, got 12-month exclusivity in the residential market. We kept the platform for commercial buildings. He got a product at a fraction of custom cost.",
    referral: "A management consultant who hears about broken processes in every client engagement. She doesn\u2019t want to build or sell \u2014 she just makes introductions. Three intros last quarter turned into two signed deals. She earned $18K for sending emails.",
  },
  company: {
    license: "A regional tutoring chain needed a standardized testing platform. Custom build quotes came in at $200K+. They licensed our learning platform, we customized it for their curriculum and branding. Launched in 6 weeks at a quarter of the cost. They run it; we keep the lights on.",
    revshare: "A building performance consulting firm wanted to offer a compliance analysis tool to their clients but couldn\u2019t justify a dev team. We\u2019d already built the AI engine. They contributed $15K for customization, sell it through their existing relationships, and keep 35% of every subscription.",
    domain: "A 50-person accounting firm realized their proprietary audit workflow \u2014 refined over 15 years \u2014 could be a product. We built it into an AI-powered platform. The firm invested $75K, owns 50% of the new entity, and sells to other mid-market firms. They went from service company to tech company.",
    funded: "A national nonprofit needed an AI chatbot trained on building codes and energy policy. Full custom build: $300K+. Our proposal: $50K on our existing AI platform, 8 weeks. They got the chatbot for their members. We kept the platform for utility companies and state agencies.",
    referral: "A proptech VC firm sends us deal flow from their portfolio companies that need AI capabilities fast. No formal partnership \u2014 just warm intros when they see a fit. Two referrals closed last quarter. They earned a referral fee on each without lifting a finger.",
  },
};

// Ballpark tiers for the slider
interface BallparkTier {
  label: string;
  value: number;
  individual: string;
  company: string;
}

const BALLPARK_TIERS: BallparkTier[] = [
  { label: "Quick tool", value: 50000,
    individual: "A focused tool that solves one problem well \u2014 a calculator, an assessment, a matchmaker. Your first product.",
    company: "Automate a manual workflow \u2014 document intake, approval routing, a reporting dashboard. The thing your team does in spreadsheets today." },
  { label: "Customer portal", value: 150000,
    individual: "A branded platform your customers log into \u2014 with dashboards, AI features, and your domain expertise built in.",
    company: "A customer-facing portal with auth, dashboards, and data visualization. Replaces a legacy system or manual process." },
  { label: "Full product", value: 250000,
    individual: "A real SaaS business \u2014 multi-tenant, AI workflows, billing, user management. The product you sell.",
    company: "A production SaaS product \u2014 multi-tenant, AI-powered workflows, admin controls. Something you\u2019d launch to market." },
  { label: "AI platform", value: 500000,
    individual: "A platform business \u2014 multiple AI agents, integrations, marketplace dynamics. The company you run.",
    company: "Coordinated AI agents, third-party integrations, compliance features, analytics. A platform your business runs on." },
  { label: "Enterprise system", value: 1000000,
    individual: "Enterprise-grade product \u2014 multi-org, regulatory compliance, advanced AI pipelines. The kind of thing that gets acquired.",
    company: "Enterprise-grade \u2014 custom AI pipelines, multi-org architecture, advanced security, regulatory compliance. The big build." },
];

const BEST_FOR: Record<PathType, Record<string, string>> = {
  individual: {
    license: "Entrepreneurs who need a product for their market, fast.",
    revshare: "Industry connectors who can sell through their network.",
    domain: "Career-changers with deep expertise and capital.",
    funded: "Investors who want first-mover advantage at below-market cost.",
    referral: "Connectors who hear problems and know the right people.",
  },
  company: {
    license: "Organizations with budget who need a product fast.",
    revshare: "Service firms turning expertise into recurring tech revenue.",
    domain: "Companies spinning out institutional knowledge into a product.",
    funded: "Companies with budget and a clear problem to solve.",
    referral: "Strategic partners who send deal flow.",
  },
};

const MODELS: Model[] = [
  { id: "license", name: "License our platform", num: "01", c: "teal",
    tl: "You get a product. We customize it. You run with it.",
    one: "We\u2019ve already built the hard parts \u2014 intelligent document analysis, AI-powered comparison engines, adaptive learning systems, interactive dashboards. Instead of starting from zero, you license our existing platform and we customize it for your market, your branding, your users.",
    gets: [
      { b: "Production-ready platform", p: "Working product with auth, dashboards, AI workflows, and admin controls already built and tested." },
      { b: "Your brand, your domain", p: "Custom branding, your URL, configured for your use case. Looks like your product from day one." },
      { b: "6-month maintenance", p: "Bug fixes and minor adjustments included. You\u2019re not alone the day we hand it over." },
    ],
    needs: [
      { b: "Clear use case", p: "Your users, their workflow, what \u2018done\u2019 looks like. A 30-minute call usually covers it." },
      { b: "48-hour feedback loops", p: "We move fast. Slow review cycles derail everything." },
      { b: "Your content and data", p: "Branding assets, sample data, user scenarios. We build the engine \u2014 you fuel it." },
    ],
    levers: [{ l: "Upfront cost", n: 3, v: "$25\u201350K" }, { l: "Your effort", n: 1, v: "Low" }, { l: "Your risk", n: 1, v: "Low" }, { l: "Your upside", n: 2, v: "Own the business" }],
    calcFn: v => [
      { l: "You pay", v: `$${Math.round(v * 0.15 / 1000)}K \u2013 $${Math.round(v * 0.2 / 1000)}K` },
      { l: "You save vs. scratch", v: `$${Math.round(v * 0.8 / 1000)}K \u2013 $${Math.round(v * 0.85 / 1000)}K` },
      { l: "IP", v: "You license, we own platform" },
      { l: "Timeline", v: "4\u20136 weeks" },
      { l: "Ongoing cost", v: "$2\u20135K/yr maintenance" },
      { l: "Your risk", v: "Low \u2014 working product day one" },
    ] },
  { id: "revshare", name: "Revenue share partner", num: "02", c: "purp",
    tl: "You bring the customers. We build the tech. Revenue flows to both.",
    one: "You have an established network and people who take your calls. We have the product. You sell and support through your relationships, keep 30\u201350% of every dollar, and never touch code.",
    gets: [
      { b: "Product to sell on day one", p: "Working product with your co-branding. Start selling into your network immediately." },
      { b: "30\u201350% of every sale", p: "Recurring revenue on every customer you bring and retain. Compounds over time." },
      { b: "We handle the tech", p: "Maintenance, bugs, features, hosting, security. You never worry about uptime." },
    ],
    needs: [
      { b: "Proven ability to close", p: "Past sales track record in your industry. Not just \u2018knowing people\u2019 \u2014 getting contracts signed." },
      { b: "Front-line support", p: "You handle customer questions (L1). We handle platform issues (L2)." },
      { b: "Skin in the game", p: "$5\u201315K upfront to co-fund customization. Aligns incentives from day one." },
    ],
    levers: [{ l: "Upfront cost", n: 1, v: "$5\u201315K" }, { l: "Your effort", n: 4, v: "High \u2014 sell + support" }, { l: "Your risk", n: 2, v: "Moderate" }, { l: "Your upside", n: 4, v: "30\u201350% recurring" }],
    calcFn: v => [
      { l: "You pay upfront", v: `$${Math.round(v * 0.04 / 1000)}K \u2013 $${Math.round(v * 0.06 / 1000)}K` },
      { l: "You save vs. scratch", v: `$${Math.round(v * 0.94 / 1000)}K+` },
      { l: "Revenue split", v: "You keep 30\u201350% per sale" },
      { l: "Your job", v: "Sell, onboard, support customers" },
      { l: "Our job", v: "Build, maintain, improve the tech" },
      { l: "Your risk", v: "Moderate \u2014 income tied to sales" },
    ] },
  { id: "domain", name: "Be the founder", num: "03", c: "coral",
    tl: "You bring expertise, network, and capital. We build you a company.",
    one: "You\u2019ve spent 10+ years in your industry. You know the pain, the buyers, and have the credibility. What you don\u2019t have is a product. We build it. You run the company. Think of it like a franchise \u2014 except you get a custom AI-powered business built on your expertise.",
    gets: [
      { b: "A company, not just a product", p: "Custom software, your branding, your GTM. You\u2019re the CEO. We\u2019re the tech partner." },
      { b: "40\u201360% equity", p: "Co-founding a business. Equity based on your capital, domain value, and sales commitment." },
      { b: "Ongoing development", p: "Not a one-time build. We continue developing and improving as the business grows." },
    ],
    needs: [
      { b: "Development capital ($25\u201375K)", p: "Your investment in a business you\u2019ll own. Seed money, not a vendor payment." },
      { b: "Deep domain expertise", p: "Regulations, workflows, buying triggers, industry language. You shape every feature." },
      { b: "You sell and service it", p: "Your network, credibility, and customer relationships. Everything customer-facing." },
    ],
    levers: [{ l: "Upfront cost", n: 4, v: "$25\u201375K" }, { l: "Your effort", n: 5, v: "You run the business" }, { l: "Your risk", n: 4, v: "High \u2014 co-founder" }, { l: "Your upside", n: 5, v: "40\u201360% equity" }],
    calcFn: v => [
      { l: "You invest", v: `$${Math.round(v * 0.1 / 1000)}K \u2013 $${Math.round(v * 0.3 / 1000)}K` },
      { l: "Your equity", v: "40\u201360% of the company" },
      { l: "Our equity", v: "40\u201360% of the company" },
      { l: "Your job", v: "CEO \u2014 sell, service, grow" },
      { l: "Our job", v: "CTO \u2014 build, maintain, scale" },
      { l: "Your risk", v: "High \u2014 you\u2019re a co-founder" },
    ] },
  { id: "funded", name: "Fund the build", num: "04", c: "amber",
    tl: "You pay for dev. You get it first. We keep the platform for other markets.",
    one: "You have budget and a specific problem. We build the solution customized for you at below-market cost, because we keep the underlying platform. You\u2019re funding creation of a tool you\u2019ll use, at a fraction of what scratch-build would cost.",
    gets: [
      { b: "Below-market cost", p: "We retain platform IP, so we\u2019re investing too. You benefit from shared motivation." },
      { b: "6\u201312 month exclusivity", p: "First-mover in your market. We won\u2019t license to direct competitors during the window." },
      { b: "Reference customer status", p: "We feature your success. We\u2019re invested in making you look great." },
    ],
    needs: [
      { b: "Budget ($25\u201350K)", p: "Milestone-based. 50% upfront typical. Covers customization + 6-month maintenance." },
      { b: "Clear requirements", p: "Paid discovery ($2.5\u20135K) if complex. Then decisions in days, not weeks." },
      { b: "Real users from day one", p: "Building something you\u2019ll use \u2014 not a prototype for a pitch deck." },
    ],
    levers: [{ l: "Upfront cost", n: 3, v: "$25\u201350K" }, { l: "Your effort", n: 2, v: "Moderate" }, { l: "Your risk", n: 2, v: "Moderate" }, { l: "Your upside", n: 3, v: "First-mover + savings" }],
    calcFn: v => [
      { l: "You pay", v: `$${Math.round(v * 0.1 / 1000)}K \u2013 $${Math.round(v * 0.2 / 1000)}K` },
      { l: "You save vs. scratch", v: `$${Math.round(v * 0.8 / 1000)}K \u2013 $${Math.round(v * 0.9 / 1000)}K` },
      { l: "Why cheaper?", v: "We keep platform IP \u2014 shared investment" },
      { l: "Exclusivity", v: "6\u201312 months in your vertical" },
      { l: "Maintenance", v: "6 months included" },
      { l: "Your risk", v: "Moderate \u2014 shared IP model" },
    ] },
  { id: "referral", name: "Just make the intro", num: "05", c: "gray",
    tl: "Know someone who needs this? Point them our way. Get paid when they sign.",
    one: "You don\u2019t want to sell, support, or invest. You just know people. For every customer you introduce who signs, you earn 10\u201320% of the first year\u2019s value.",
    gets: [
      { b: "Get paid for introductions", p: "10\u201320% of first-year value or flat fee. Paid on close." },
      { b: "Zero commitment", p: "One email. We handle everything else." },
    ],
    needs: [
      { b: "A warm introduction", p: "Specific intro to someone with a real problem and real budget." },
    ],
    levers: [{ l: "Upfront cost", n: 0, v: "$0" }, { l: "Your effort", n: 1, v: "One intro" }, { l: "Your risk", n: 0, v: "Zero" }, { l: "Your upside", n: 1, v: "10\u201320%/deal" }],
    calcFn: v => [
      { l: "You pay", v: "$0" },
      { l: "You earn", v: `$${Math.round(v * 0.015 / 1000)}K \u2013 $${Math.round(v * 0.03 / 1000)}K per deal` },
      { l: "Your job", v: "One introduction" },
      { l: "Our job", v: "Everything else" },
      { l: "Your risk", v: "Zero" },
      { l: "Commitment", v: "None" },
    ] },
];


// ─── Subcomponents ───────────────────────────────────────────────────────────

function Pips({ n, color }: { n: number; color: string }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} className="w-5 h-1.5 rounded-full" style={{ background: i < n ? color : "#e2e2ea" }} />
      ))}
    </div>
  );
}

function BrewSlider({ label, desc, value, onChange, labels, leftEnd, rightEnd }: {
  label: string; desc: string; value: number; onChange: (v: number) => void;
  labels: string[]; leftEnd: string; rightEnd: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[13px] font-semibold mb-1" style={{ color: "#1a1a2e" }}>
        <span>{label}</span>
        <span className="font-mono text-xs font-medium" style={{ color: COLORS.purp.main }}>{labels[value]}</span>
      </div>
      <div className="text-[11px] mb-2 leading-relaxed" style={{ color: "#9999ad" }}>{desc}</div>
      <input
        type="range" min={0} max={4} value={value}
        onChange={e => onChange(+e.target.value)}
        className="brew-slider w-full"
        style={{ appearance: "none", height: 6, borderRadius: 3, background: "#e2e2ea", outline: "none", cursor: "pointer" }}
      />
      <div className="flex justify-between text-[10px] mt-1" style={{ color: "#9999ad" }}>
        <span>{leftEnd}</span><span>{rightEnd}</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function WorkWithUsContent() {
  const [tab, setTab] = useState(0);
  const [ballpark, setBallpark] = useState(2);
  const [path, setPath] = useState<PathType | null>(null);
  const [brew, setBrew] = useState({ budget: 2, effort: 2, risk: 2, domain: 2 });
  const modelsRef = useRef<HTMLDivElement>(null);
  const modelCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const brewIdx = getBrewResult(brew.budget, brew.effort, brew.risk, brew.domain);
  const brewModel = BREW_MODELS[brewIdx];
  const bc = COLORS[brewModel.c];

  const fmt = (n: number) => "$" + Math.round(n).toLocaleString();
  const currentTier = BALLPARK_TIERS[ballpark];
  const p = path || "individual"; // default for display before selection

  return (
    <div className="max-w-[960px] mx-auto px-6 pb-24">

      {/* ── Hero ── */}
      <section className="text-center py-12 md:py-16">
        <ScrollReveal>
          <div className="font-mono text-[11px] text-gray-500 tracking-[2.5px] uppercase mb-3">
            Pandotic &middot; AI Product Studio
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
        <h1 className="font-black tracking-tight leading-tight" style={{ fontSize: "clamp(36px, 7vw, 56px)" }}>
          Five ways to{" "}
          <span style={{ background: "linear-gradient(135deg, #0d8a6a, #6c4fcf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            build with us
          </span>
        </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.4}>
        <p className="text-gray-400 text-[15px] mt-3.5 leading-relaxed max-w-[620px] mx-auto">
          We build AI-powered software products fast. We don&apos;t want to run your company &mdash; we want to build something great, get it into the world, and share the upside. The more you bring to the table, the less you pay upfront.
        </p>
        </ScrollReveal>
      </section>

      {/* ── Brew Finder ── */}
      <ScrollReveal>
      <div className="bg-white rounded-2xl p-7 md:p-8 mb-10" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)" }}>
        <h2 className="text-xl font-bold text-center mb-1" style={{ color: "#1a1a2e" }}>Find your engagement model</h2>
        <p className="text-[13px] text-center mb-6" style={{ color: "#6b6b82" }}>First, tell us what brings you here.</p>

        {/* Path selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
          {([
            { key: "individual" as PathType, icon: "\u{1F9D1}", title: "I want to build a company", sub: "You have expertise, capital, connections, or all three \u2014 and you want to turn that into a tech-enabled business." },
            { key: "company" as PathType, icon: "\u{1F3E2}", title: "My company needs to build something", sub: "You have a problem to solve, users waiting, and budget \u2014 you need a product built fast on a proven platform." },
          ]).map(opt => (
            <button key={opt.key} onClick={() => setPath(opt.key)}
              className="text-left p-5 rounded-xl cursor-pointer border-2 transition-all duration-200"
              style={{
                borderColor: path === opt.key ? COLORS.purp.main : "#e2e2ea",
                background: path === opt.key ? COLORS.purp.light : "#fff",
              }}>
              <div className="text-2xl mb-2">{opt.icon}</div>
              <div className="text-[15px] font-bold mb-1" style={{ color: path === opt.key ? COLORS.purp.main : "#1a1a2e" }}>{opt.title}</div>
              <div className="text-[12px] leading-relaxed" style={{ color: "#6b6b82" }}>{opt.sub}</div>
            </button>
          ))}
        </div>

        {/* Sliders — appear after path selection */}
        <div style={{ opacity: path ? 1 : 0.4, pointerEvents: path ? "auto" : "none", transition: "opacity 0.3s" }}>
          <p className="text-[13px] text-center mb-5" style={{ color: "#6b6b82" }}>Now adjust these four levers &mdash; the recommendation updates instantly.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-x-8 mb-7">
            <BrewSlider label={SLIDER_CONFIG[p].budget.label} desc={SLIDER_CONFIG[p].budget.desc} value={brew.budget} onChange={v => setBrew({ ...brew, budget: v })} labels={BREW_LABELS.budget} leftEnd={SLIDER_CONFIG[p].budget.left} rightEnd={SLIDER_CONFIG[p].budget.right} />
            <BrewSlider label={SLIDER_CONFIG[p].effort.label} desc={SLIDER_CONFIG[p].effort.desc} value={brew.effort} onChange={v => setBrew({ ...brew, effort: v })} labels={BREW_LABELS.effort} leftEnd={SLIDER_CONFIG[p].effort.left} rightEnd={SLIDER_CONFIG[p].effort.right} />
            <BrewSlider label={SLIDER_CONFIG[p].risk.label} desc={SLIDER_CONFIG[p].risk.desc} value={brew.risk} onChange={v => setBrew({ ...brew, risk: v })} labels={BREW_LABELS.risk} leftEnd={SLIDER_CONFIG[p].risk.left} rightEnd={SLIDER_CONFIG[p].risk.right} />
            <BrewSlider label={SLIDER_CONFIG[p].domain.label} desc={SLIDER_CONFIG[p].domain.desc} value={brew.domain} onChange={v => setBrew({ ...brew, domain: v })} labels={BREW_LABELS.domain} leftEnd={SLIDER_CONFIG[p].domain.left} rightEnd={SLIDER_CONFIG[p].domain.right} />
          </div>

          {/* Ballpark project size */}
          <div className="rounded-xl p-5 mb-7" style={{ background: "#f8f7ff" }}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[13px] font-semibold" style={{ color: "#1a1a2e" }}>Ballpark project size</span>
              <span className="font-mono text-lg font-bold" style={{ color: COLORS.purp.main }}>{fmt(currentTier.value)}</span>
            </div>
            <div className="text-[11px] mb-2 leading-relaxed" style={{ color: "#9999ad" }}>How big is the thing you want to build?</div>
            <input
              type="range" min={0} max={4} value={ballpark}
              onChange={e => setBallpark(+e.target.value)}
              className="brew-slider w-full mb-2"
              style={{ appearance: "none", height: 6, borderRadius: 3, background: "#e2e2ea", outline: "none", cursor: "pointer" }}
            />
            <div className="flex justify-between">
              {BALLPARK_TIERS.map((t, i) => (
                <button key={i} onClick={() => setBallpark(i)}
                  className="text-[10px] font-medium cursor-pointer border-none bg-transparent transition-colors"
                  style={{ color: i === ballpark ? COLORS.purp.main : "#9999ad" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-3 text-[12px] leading-relaxed rounded-lg p-3" style={{ background: "#fff", color: "#3d3d54" }}>
              {currentTier[p]}
            </div>
          </div>

          {/* Recommendation card */}
          <div className="p-6 rounded-xl text-center transition-all duration-300" style={{ border: `2px solid ${bc.mid}`, background: bc.light }}>
            <div className="text-[22px] font-bold mb-1" style={{ color: bc.main }}>{brewModel.name}</div>
            <div className="text-sm italic mb-3" style={{ color: bc.main }}>{BREW_TAGLINES[p][brewIdx]}</div>
            <div className="text-[13px] leading-relaxed max-w-[560px] mx-auto mb-4" style={{ color: "#3d3d54" }}>{brewModel.desc}</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {brewModel.eco.map((e, i) => (
                <div key={i} className="py-2.5 px-3.5 rounded-lg bg-white text-center min-w-[100px]">
                  <div className="text-[9px] uppercase tracking-wide mb-0.5 opacity-70" style={{ color: bc.main }}>{e.l}</div>
                  <div className="font-mono text-base font-bold" style={{ color: bc.main }}>{e.v}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-center mt-4" style={{ color: "#9999ad" }}>
            Keep reading for full details on each model, or{" "}
            <span
              className="underline cursor-pointer"
              style={{ color: bc.main }}
              onClick={() => { setTab(1); modelsRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            >
              jump to the ballpark economics
            </span>{" "}
            to see what your project could look like.
          </p>
        </div>
      </div>
      </ScrollReveal>

      {/* ── Tab Toggle ── */}
      <div ref={modelsRef} className="flex gap-1 p-1 rounded-[10px] mx-auto mb-6 max-w-[420px]" style={{ background: "#f0f0f4" }}>
        {["Engagement models", "Ballpark economics"].map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className="flex-1 py-2.5 px-4 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-all duration-200"
            style={{
              background: tab === i ? "#fff" : "transparent",
              color: tab === i ? "#1a1a2e" : "#9999ad",
              boxShadow: tab === i ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Engagement Models ── */}
      <div style={{ display: tab === 0 ? "block" : "none" }}>
        {/* Quick-nav pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {MODELS.map(m => {
            const mc = COLORS[m.c];
            return (
              <button
                key={m.id}
                onClick={() => modelCardRefs.current[m.id]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="py-2 px-4 rounded-full text-[12px] font-semibold cursor-pointer transition-all duration-200"
                style={{
                  border: `2px solid ${mc.mid}`,
                  background: mc.light,
                  color: mc.main,
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {MODELS.map((m, mi) => {
          const mc = COLORS[m.c];
          return (
            <ScrollReveal key={m.id} delay={mi * 0.08}>
            <div ref={el => { modelCardRefs.current[m.id] = el; }} className="bg-white rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)", borderTop: `5px solid ${mc.main}` }}>
              {/* Header */}
              <div className="p-7 pb-0 flex gap-4 items-start flex-wrap">
                <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center font-mono text-lg font-bold shrink-0" style={{ background: mc.light, color: mc.main }}>
                  {m.num}
                </div>
                <div className="flex-1 min-w-[240px]">
                  <h3 className="text-xl font-bold mb-0.5" style={{ color: mc.main }}>{m.name}</h3>
                  <div className="text-[13px] italic" style={{ color: "#6b6b82" }}>{m.tl}</div>
                  <p className="text-[13px] leading-relaxed mt-2.5" style={{ color: "#3d3d54" }}>{m.one}</p>
                </div>
              </div>

              {/* Gets / Needs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-7">
                <div>
                  <h4 className="text-[11px] font-bold tracking-wide uppercase mb-3 pb-2" style={{ color: mc.main, borderBottom: `2px solid ${mc.mid}` }}>What you get</h4>
                  {m.gets.map((g, i) => (
                    <div key={i} className="mb-3">
                      <b className="text-[13px] font-semibold block mb-0.5" style={{ color: "#1a1a2e" }}>{g.b}</b>
                      <p className="text-xs leading-relaxed" style={{ color: "#6b6b82" }}>{g.p}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold tracking-wide uppercase mb-3 pb-2" style={{ color: mc.main, borderBottom: `2px solid ${mc.mid}` }}>What we need from you</h4>
                  {m.needs.map((n, i) => (
                    <div key={i} className="mb-3">
                      <b className="text-[13px] font-semibold block mb-0.5" style={{ color: "#1a1a2e" }}>{n.b}</b>
                      <p className="text-xs leading-relaxed" style={{ color: "#6b6b82" }}>{n.p}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example */}
              <div className="mx-7 mb-5 p-4 rounded-xl text-[13px] leading-relaxed" style={{ background: mc.light, color: "#3d3d54" }}>
                <span className="font-mono text-[10px] font-semibold tracking-wide uppercase block mb-1.5" style={{ color: mc.main }}>Example</span>
                {MODEL_EXAMPLES[p][m.id]}
              </div>

              {/* Lever footer */}
              <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 1, background: "rgba(0,0,0,0.04)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                {m.levers.map((l, i) => (
                  <div key={i} className="bg-white py-3.5 px-4 text-center">
                    <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "#9999ad" }}>{l.l}</div>
                    <Pips n={l.n} color={mc.main} />
                    <div className="text-[11px] font-semibold mt-1" style={{ color: mc.main }}>{l.v}</div>
                  </div>
                ))}
              </div>
            </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* ── Tab 1: Ballpark Economics ── */}
      <div style={{ display: tab === 1 ? "block" : "none" }}>
        <p className="text-center max-w-[640px] mx-auto mb-6 text-sm leading-relaxed" style={{ color: "#6b6b82" }}>
          Slide to see <strong style={{ color: "#1a1a2e" }}>ballpark economics</strong> for different project sizes. These aren&apos;t quotes &mdash; just a feel for how each engagement model works at different scales.
        </p>

        {/* Ballpark slider */}
        <div className="bg-white rounded-xl p-6 mb-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[13px] font-semibold" style={{ color: "#1a1a2e" }}>Project size</span>
            <span className="font-mono text-lg font-bold" style={{ color: COLORS.purp.main }}>{fmt(currentTier.value)}</span>
          </div>
          <input
            type="range" min={0} max={4} value={ballpark}
            onChange={e => setBallpark(+e.target.value)}
            className="brew-slider w-full mb-2"
            style={{ appearance: "none", height: 6, borderRadius: 3, background: "#e2e2ea", outline: "none", cursor: "pointer" }}
          />
          <div className="flex justify-between">
            {BALLPARK_TIERS.map((t, i) => (
              <button key={i} onClick={() => setBallpark(i)}
                className="text-[10px] font-medium cursor-pointer border-none bg-transparent transition-colors"
                style={{ color: i === ballpark ? COLORS.purp.main : "#9999ad" }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-lg text-[13px] leading-relaxed" style={{ background: "#f8f7ff", color: "#3d3d54" }}>
            {currentTier[p]}
          </div>
        </div>

        {MODELS.map(m => {
          const mc = COLORS[m.c];
          const econ = m.calcFn(currentTier.value);
          return (
            <div key={m.id} className="bg-white rounded-xl overflow-hidden mb-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: `5px solid ${mc.main}` }}>
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
                <div className="p-5">
                  <h3 className="text-base font-bold mb-0.5" style={{ color: mc.main }}>{m.name}</h3>
                  <div className="text-xs italic mb-2.5" style={{ color: "#6b6b82" }}>{m.tl}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "#6b6b82" }}>
                    <strong style={{ color: "#3d3d54" }}>Best for:</strong> {BEST_FOR[p][m.id]}
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3 content-start" style={{ background: "#f0f0f4" }}>
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#9999ad" }}>Full build value</div>
                    <div className="font-mono text-xl font-bold" style={{ color: "#9999ad" }}>{fmt(currentTier.value)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#9999ad" }}>You pay</div>
                    <div className="font-mono text-xl font-bold" style={{ color: mc.main }}>{econ[0].v}</div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3.5 grid gap-2" style={{ borderTop: "1px solid rgba(0,0,0,0.04)", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                {econ.map((e, i) => (
                  <div key={i} className="text-[11px] leading-relaxed py-2 px-2.5 rounded-lg" style={{ color: "#6b6b82", background: "#f0f0f4" }}>
                    <b className="block text-xs font-semibold mb-0.5" style={{ color: "#3d3d54" }}>{e.l}</b>
                    {e.v}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CTA ── */}
      <ScrollReveal>
      <div className="mt-12 text-center p-9 bg-white rounded-2xl" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        <h2 className="text-[22px] font-bold mb-2" style={{ color: "#1a1a2e" }}>Ready to build something?</h2>
        <p className="text-sm leading-relaxed max-w-[480px] mx-auto mb-5" style={{ color: "#6b6b82" }}>
          Tell us what you&apos;re thinking. No pitch decks required &mdash; just a conversation about what you want to exist in the world.
        </p>
        <a
          href="mailto:hello@pandotic.ai"
          className="inline-block py-3.5 px-8 rounded-full text-[15px] font-semibold text-white no-underline"
          style={{ background: "linear-gradient(135deg, #0d8a6a, #6c4fcf)" }}
        >
          Let&apos;s talk
        </a>
      </div>
      </ScrollReveal>
    </div>
  );
}
