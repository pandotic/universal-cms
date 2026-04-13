import { useState, useRef } from "react";

const COLORS = {
  teal: { main: "#0d8a6a", light: "#e7f7f2", mid: "#b0e4d0", text: "#0d8a6a" },
  purp: { main: "#6c4fcf", light: "#eee8ff", mid: "#c7b5f5", text: "#6c4fcf" },
  coral: { main: "#c94420", light: "#fdeee8", mid: "#f5baa5", text: "#c94420" },
  amber: { main: "#9a6b0a", light: "#fef6e0", mid: "#f5dfa0", text: "#9a6b0a" },
  gray: { main: "#6b6b82", light: "#e8ecf4", mid: "#c4c4d0", text: "#6b6b82" },
};

const BREW_LABELS = {
  budget: ["$0", "$5–15K", "~$25K", "$25–50K", "$75K+"],
  effort: ["None", "Light", "Some", "Significant", "Full-time"],
  risk: ["Minimal", "Low", "Moderate", "High", "All-in"],
  domain: ["None", "Basic", "Some", "Deep", "Expert"],
};

const BREW_MODELS = [
  { name: "Just make introductions", tl: "Referral partner", c: "gray",
    desc: "You know people who need what we build. Make an intro, we handle everything else, you earn 10–20% per closed deal. Zero risk, zero commitment.",
    eco: [{ l: "You pay", v: "$0" }, { l: "You earn", v: "10–20%/deal" }, { l: "Your effort", v: "One email" }] },
  { name: "License our platform", tl: "Platform license", c: "teal",
    desc: "We've already built the hard parts. You license the platform, we customize it for your market, and you run with it. Fastest path from idea to product.",
    eco: [{ l: "You pay", v: "$25–50K" }, { l: "Timeline", v: "4–6 weeks" }, { l: "You own", v: "The business" }] },
  { name: "Sell our product together", tl: "Revenue share", c: "purp",
    desc: "You sell and support through your network. We build and maintain the tech. Revenue splits 50/50 to 70/30 in our favor. Built for industry connectors.",
    eco: [{ l: "You pay", v: "$5–15K" }, { l: "You keep", v: "30–50%" }, { l: "Your job", v: "Sell + support" }] },
  { name: "Fund the build, get it first", tl: "Funded development", c: "amber",
    desc: "You have budget and a specific problem. We build it on our platform at below-market cost. You get exclusivity in your market. We keep the platform for other verticals.",
    eco: [{ l: "You pay", v: "$25–50K" }, { l: "Exclusivity", v: "6–12 months" }, { l: "You save", v: "60–80%" }] },
  { name: "Be the founder", tl: "Domain expert co-founder", c: "coral",
    desc: "You've spent a career in your industry. Bring capital, credibility, and a sales network. We build you a company. You own 40–60% equity and run the business.",
    eco: [{ l: "You invest", v: "$25–75K" }, { l: "Your equity", v: "40–60%" }, { l: "Your role", v: "CEO" }] },
];

function getBrewResult(b, e, r, d) {
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

const MODELS = [
  { id: "license", name: "License our platform", num: "01", c: "teal",
    tl: "You get a product. We customize it. You run with it.",
    one: "We've already built the hard parts — intelligent document analysis, AI-powered comparison engines, adaptive learning systems, interactive dashboards. Instead of starting from zero, you license our existing platform and we customize it for your market, your branding, your users.",
    gets: [
      { b: "Production-ready platform", p: "Working product with auth, dashboards, AI workflows, and admin controls already built and tested." },
      { b: "Your brand, your domain", p: "Custom branding, your URL, configured for your use case. Looks like your product from day one." },
      { b: "6-month maintenance", p: "Bug fixes and minor adjustments included. You're not alone the day we hand it over." },
    ],
    needs: [
      { b: "Clear use case", p: "Your users, their workflow, what 'done' looks like. A 30-minute call usually covers it." },
      { b: "48-hour feedback loops", p: "We move fast. Slow review cycles derail everything." },
      { b: "Your content and data", p: "Branding assets, sample data, user scenarios. We build the engine — you fuel it." },
    ],
    example: "An education company needed a testing and study platform. Instead of building from scratch ($200K+, 6 months), they licensed our learning platform — adaptive study guides, AI questions, knowledge graphs already built. Customized for their curriculum, launched in 6 weeks.",
    levers: [{ l: "Upfront cost", n: 3, v: "$25–50K" }, { l: "Your effort", n: 1, v: "Low" }, { l: "Your risk", n: 1, v: "Low" }, { l: "Your upside", n: 2, v: "Own the business" }],
    calcFn: v => [
      { l: "You pay", v: `$${Math.round(v * 0.15 / 1000)}K – $${Math.round(v * 0.2 / 1000)}K` },
      { l: "You save vs. scratch", v: `$${Math.round(v * 0.8 / 1000)}K – $${Math.round(v * 0.85 / 1000)}K` },
      { l: "IP", v: "You license, we own platform" },
      { l: "Timeline", v: "4–6 weeks" },
      { l: "Ongoing cost", v: "$2–5K/yr maintenance" },
      { l: "Your risk", v: "Low — working product day one" },
    ] },
  { id: "revshare", name: "Revenue share partner", num: "02", c: "purp",
    tl: "You bring the customers. We build the tech. Revenue flows to both.",
    one: "You have an established network and people who take your calls. We have the product. You sell and support through your relationships, keep 30–50% of every dollar, and never touch code.",
    gets: [
      { b: "Product to sell on day one", p: "Working product with your co-branding. Start selling into your network immediately." },
      { b: "30–50% of every sale", p: "Recurring revenue on every customer you bring and retain. Compounds over time." },
      { b: "We handle the tech", p: "Maintenance, bugs, features, hosting, security. You never worry about uptime." },
    ],
    needs: [
      { b: "Proven ability to close", p: "Past sales track record in your industry. Not just 'knowing people' — getting contracts signed." },
      { b: "Front-line support", p: "You handle customer questions (L1). We handle platform issues (L2)." },
      { b: "Skin in the game", p: "$5–15K upfront to co-fund customization. Aligns incentives from day one." },
    ],
    example: "A green building consultant with 15 years of industry relationships wanted to offer a compliance analysis tool. We'd already built the AI engine. He contributed $5K upfront plus $20K for customization, with a revenue split plus 50% of documented cost savings over three years.",
    levers: [{ l: "Upfront cost", n: 1, v: "$5–15K" }, { l: "Your effort", n: 4, v: "High — sell + support" }, { l: "Your risk", n: 2, v: "Moderate" }, { l: "Your upside", n: 4, v: "30–50% recurring" }],
    calcFn: v => [
      { l: "You pay upfront", v: `$${Math.round(v * 0.04 / 1000)}K – $${Math.round(v * 0.06 / 1000)}K` },
      { l: "You save vs. scratch", v: `$${Math.round(v * 0.94 / 1000)}K+` },
      { l: "Revenue split", v: "You keep 30–50% per sale" },
      { l: "Your job", v: "Sell, onboard, support customers" },
      { l: "Our job", v: "Build, maintain, improve the tech" },
      { l: "Your risk", v: "Moderate — income tied to sales" },
    ] },
  { id: "domain", name: "Be the founder", num: "03", c: "coral",
    tl: "You bring expertise, network, and capital. We build you a company.",
    one: "You've spent 10+ years in your industry. You know the pain, the buyers, and have the credibility. What you don't have is a product. We build it. You run the company. Think of it like a franchise — except you get a custom AI-powered business built on your expertise.",
    gets: [
      { b: "A company, not just a product", p: "Custom software, your branding, your GTM. You're the CEO. We're the tech partner." },
      { b: "40–60% equity", p: "Co-founding a business. Equity based on your capital, domain value, and sales commitment." },
      { b: "Ongoing development", p: "Not a one-time build. We continue developing and improving as the business grows." },
    ],
    needs: [
      { b: "Development capital ($25–75K)", p: "Your investment in a business you'll own. Seed money, not a vendor payment." },
      { b: "Deep domain expertise", p: "Regulations, workflows, buying triggers, industry language. You shape every feature." },
      { b: "You sell and service it", p: "Your network, credibility, and customer relationships. Everything customer-facing." },
    ],
    example: "Built for the former SPED director who knows every district in the state. The retired CFO who spent 15 years in procurement. The senior care consultant with assisted living relationships. You have expertise and capital from a career change. What you don't have is a tech team.",
    levers: [{ l: "Upfront cost", n: 4, v: "$25–75K" }, { l: "Your effort", n: 5, v: "You run the business" }, { l: "Your risk", n: 4, v: "High — co-founder" }, { l: "Your upside", n: 5, v: "40–60% equity" }],
    calcFn: v => [
      { l: "You invest", v: `$${Math.round(v * 0.1 / 1000)}K – $${Math.round(v * 0.3 / 1000)}K` },
      { l: "Your equity", v: "40–60% of the company" },
      { l: "Our equity", v: "40–60% of the company" },
      { l: "Your job", v: "CEO — sell, service, grow" },
      { l: "Our job", v: "CTO — build, maintain, scale" },
      { l: "Your risk", v: "High — you're a co-founder" },
    ] },
  { id: "funded", name: "Fund the build", num: "04", c: "amber",
    tl: "You pay for dev. You get it first. We keep the platform for other markets.",
    one: "You have budget and a specific problem. We build the solution customized for you at below-market cost, because we keep the underlying platform. You're funding creation of a tool you'll use, at a fraction of what scratch-build would cost.",
    gets: [
      { b: "Below-market cost", p: "We retain platform IP, so we're investing too. You benefit from shared motivation." },
      { b: "6–12 month exclusivity", p: "First-mover in your market. We won't license to direct competitors during the window." },
      { b: "Reference customer status", p: "We feature your success. We're invested in making you look great." },
    ],
    needs: [
      { b: "Budget ($25–50K)", p: "Milestone-based. 50% upfront typical. Covers customization + 6-month maintenance." },
      { b: "Clear requirements", p: "Paid discovery ($2.5–5K) if complex. Then decisions in days, not weeks." },
      { b: "Real users from day one", p: "Building something you'll use — not a prototype for a pitch deck." },
    ],
    example: "A tutoring company needed a standardized testing platform. Custom build quote: $200K+, 6 months. Our proposal: $50K on our existing platform, 6 weeks. They get the product for their curriculum. We keep the platform for SAT, ACT, GRE markets.",
    levers: [{ l: "Upfront cost", n: 3, v: "$25–50K" }, { l: "Your effort", n: 2, v: "Moderate" }, { l: "Your risk", n: 2, v: "Moderate" }, { l: "Your upside", n: 3, v: "First-mover + savings" }],
    calcFn: v => [
      { l: "You pay", v: `$${Math.round(v * 0.1 / 1000)}K – $${Math.round(v * 0.2 / 1000)}K` },
      { l: "You save vs. scratch", v: `$${Math.round(v * 0.8 / 1000)}K – $${Math.round(v * 0.9 / 1000)}K` },
      { l: "Why cheaper?", v: "We keep platform IP — shared investment" },
      { l: "Exclusivity", v: "6–12 months in your vertical" },
      { l: "Maintenance", v: "6 months included" },
      { l: "Your risk", v: "Moderate — shared IP model" },
    ] },
  { id: "referral", name: "Just make the intro", num: "05", c: "gray",
    tl: "Know someone who needs this? Point them our way. Get paid when they sign.",
    one: "You don't want to sell, support, or invest. You just know people. For every customer you introduce who signs, you earn 10–20% of the first year's value.",
    gets: [
      { b: "Get paid for introductions", p: "10–20% of first-year value or flat fee. Paid on close." },
      { b: "Zero commitment", p: "One email. We handle everything else." },
    ],
    needs: [
      { b: "A warm introduction", p: "Specific intro to someone with a real problem and real budget." },
    ],
    example: "Industry advisors, conference contacts, former colleagues — anyone who hears problems and thinks 'I know someone who could fix that.' Zero risk, real money.",
    levers: [{ l: "Upfront cost", n: 0, v: "$0" }, { l: "Your effort", n: 1, v: "One intro" }, { l: "Your risk", n: 0, v: "Zero" }, { l: "Your upside", n: 1, v: "10–20%/deal" }],
    calcFn: v => [
      { l: "You pay", v: "$0" },
      { l: "You earn", v: `$${Math.round(v * 0.015 / 1000)}K – $${Math.round(v * 0.03 / 1000)}K per deal` },
      { l: "Your job", v: "One introduction" },
      { l: "Our job", v: "Everything else" },
      { l: "Your risk", v: "Zero" },
      { l: "Commitment", v: "None" },
    ] },
];

function Pips({ n, color }) {
  return (
    <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} style={{ width: 20, height: 6, borderRadius: 3, background: i < n ? color : "#e2e2ea" }} />
      ))}
    </div>
  );
}

function Slider({ label, desc, value, onChange, labels, leftEnd, rightEnd }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500, color: COLORS.purp.main }}>{labels[value]}</span>
      </div>
      <div style={{ fontSize: 11, color: "#9999ad", marginBottom: 8, lineHeight: 1.5 }}>{desc}</div>
      <input type="range" min={0} max={4} value={value} onChange={e => onChange(+e.target.value)}
        style={{ width: "100%", appearance: "none", height: 6, borderRadius: 3, background: "#e2e2ea", outline: "none", cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9999ad", marginTop: 4 }}>
        <span>{leftEnd}</span><span>{rightEnd}</span>
      </div>
    </div>
  );
}

export default function DealCalculator() {
  const [tab, setTab] = useState(0);
  const [buildVal, setBuildVal] = useState(250000);
  const [brew, setBrew] = useState({ budget: 2, effort: 2, risk: 2, domain: 2 });
  const modelsRef = useRef(null);

  const brewIdx = getBrewResult(brew.budget, brew.effort, brew.risk, brew.domain);
  const brewModel = BREW_MODELS[brewIdx];
  const bc = COLORS[brewModel.c];

  const fmt = n => "$" + Math.round(n).toLocaleString();
  const parsedVal = buildVal || 250000;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 100px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "48px 0 16px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9999ad", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>
          Pandotic · AI Product Studio
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.15 }}>
          Five ways to{" "}
          <span style={{ background: "linear-gradient(135deg, #0d8a6a, #6c4fcf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            build with us
          </span>
        </h1>
        <p style={{ color: "#6b6b82", fontSize: 15, marginTop: 14, lineHeight: 1.75, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
          We build AI-powered software products fast. We don't want to run your company — we want to build something great, get it into the world, and share the upside. The more you bring to the table, the less you pay upfront.
        </p>
      </div>

      {/* ===== BREW SECTION ON TOP ===== */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)", padding: "32px 28px", marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 4 }}>Find your engagement model</h2>
        <p style={{ fontSize: 13, color: "#6b6b82", textAlign: "center", marginBottom: 28 }}>Adjust these four levers — the recommendation and economics update instantly.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px", marginBottom: 28 }}>
          <Slider label="Upfront budget" desc="How much capital are you ready to invest?" value={brew.budget} onChange={v => setBrew({ ...brew, budget: v })} labels={BREW_LABELS.budget} leftEnd="$0" rightEnd="$75K+" />
          <Slider label="Your involvement" desc="How hands-on will you be day-to-day?" value={brew.effort} onChange={v => setBrew({ ...brew, effort: v })} labels={BREW_LABELS.effort} leftEnd="Just invest" rightEnd="I'll run it" />
          <Slider label="Risk tolerance" desc="Predictable service or bet on upside?" value={brew.risk} onChange={v => setBrew({ ...brew, risk: v })} labels={BREW_LABELS.risk} leftEnd="Predictable" rightEnd="Bet big" />
          <Slider label="Domain expertise" desc="How deep is your industry knowledge?" value={brew.domain} onChange={v => setBrew({ ...brew, domain: v })} labels={BREW_LABELS.domain} leftEnd="I'm learning" rightEnd="15+ year vet" />
        </div>
        <div style={{ padding: 24, borderRadius: 12, textAlign: "center", border: `2px solid ${bc.mid}`, background: bc.light, transition: "all 0.3s" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: bc.main, marginBottom: 4 }}>{brewModel.name}</div>
          <div style={{ fontSize: 14, fontStyle: "italic", color: bc.main, marginBottom: 12 }}>{brewModel.tl}</div>
          <div style={{ fontSize: 13, color: "#3d3d54", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 16px" }}>{brewModel.desc}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {brewModel.eco.map((e, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fff", textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, color: bc.main, opacity: 0.7, marginBottom: 2 }}>{e.l}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: bc.main }}>{e.v}</div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#9999ad", textAlign: "center", marginTop: 16 }}>
          Keep reading for full details on each model, or{" "}
          <span style={{ color: bc.main, cursor: "pointer", textDecoration: "underline" }} onClick={() => { setTab(1); modelsRef.current?.scrollIntoView({ behavior: "smooth" }); }}>
            jump to the deal calculator
          </span>{" "}
          to see exact economics for your project.
        </p>
      </div>

      {/* Tabs for detail views */}
      <div ref={modelsRef} style={{ display: "flex", gap: 4, background: "#f0f0f4", padding: 4, borderRadius: 10, margin: "0 auto 24px", maxWidth: 420 }}>
        {["Engagement models", "Deal calculator"].map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex: 1, padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
              background: tab === i ? "#fff" : "none", color: tab === i ? "#1a1a2e" : "#9999ad",
              boxShadow: tab === i ? "0 1px 3px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* ===== TAB 0: ENGAGEMENT MODELS ===== */}
      {tab === 0 && (
        <div>
          {MODELS.map(m => {
            const mc = COLORS[m.c];
            return (
              <div key={m.id} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)", overflow: "hidden", marginBottom: 20, borderTop: `5px solid ${mc.main}` }}>
                <div style={{ padding: "28px 28px 0", display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: mc.light, color: mc.main, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{m.num}</div>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: mc.main, marginBottom: 2 }}>{m.name}</h3>
                    <div style={{ fontSize: 13, fontStyle: "italic", color: "#6b6b82" }}>{m.tl}</div>
                    <p style={{ fontSize: 13, color: "#3d3d54", lineHeight: 1.7, marginTop: 10 }}>{m.one}</p>
                  </div>
                </div>
                <div style={{ padding: "24px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: mc.main, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${mc.mid}` }}>What you get</h4>
                      {m.gets.map((g, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <b style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 2 }}>{g.b}</b>
                          <p style={{ fontSize: 12, color: "#6b6b82", lineHeight: 1.6 }}>{g.p}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: mc.main, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${mc.mid}` }}>What we need from you</h4>
                      {m.needs.map((n, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <b style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 2 }}>{n.b}</b>
                          <p style={{ fontSize: 12, color: "#6b6b82", lineHeight: 1.6 }}>{n.p}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ margin: "0 28px 20px", padding: "16px 20px", borderRadius: 12, background: mc.light, fontSize: 13, lineHeight: 1.7, color: "#3d3d54" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: mc.main, display: "block", marginBottom: 6 }}>Example</span>
                  {m.example}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(0,0,0,0.04)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  {m.levers.map((l, i) => (
                    <div key={i} style={{ background: "#fff", padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#9999ad", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{l.l}</div>
                      <Pips n={l.n} color={mc.main} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: mc.main, marginTop: 4 }}>{l.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== TAB 1: DEAL CALCULATOR ===== */}
      {tab === 1 && (
        <div>
          <p style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 24px", fontSize: 14, color: "#6b6b82", lineHeight: 1.7 }}>
            Enter the <strong style={{ color: "#1a1a2e" }}>full build value</strong> — what a traditional dev shop would quote. Then see how each engagement model changes the economics.
          </p>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Full build value:</label>
            <input
              type="text"
              value={`$${parsedVal.toLocaleString()}`}
              onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ""); setBuildVal(parseInt(raw) || 0); }}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 600, width: 160, padding: "8px 12px", border: "1.5px solid #e2e2ea", borderRadius: 8, color: "#1a1a2e", textAlign: "right", background: "#f0f0f4" }}
            />
            <span style={{ fontSize: 11, color: "#9999ad", marginLeft: "auto" }}>What a traditional shop would quote</span>
          </div>
          {MODELS.map(m => {
            const mc = COLORS[m.c];
            const econ = m.calcFn(parsedVal);
            return (
              <div key={m.id} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: 16, borderLeft: `5px solid ${mc.main}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 0 }}>
                  <div style={{ padding: "20px 24px" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: mc.main, marginBottom: 2 }}>{m.name}</h3>
                    <div style={{ fontSize: 12, fontStyle: "italic", color: "#6b6b82", marginBottom: 10 }}>{m.tl}</div>
                    <div style={{ fontSize: 12, color: "#6b6b82", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: `<strong style="color:#3d3d54">Best for:</strong> ${m.id === "license" ? "Organizations with budget who need a product fast." : m.id === "revshare" ? "Industry connectors with active networks who can close deals." : m.id === "domain" ? "Career-changers with deep expertise and capital." : m.id === "funded" ? "Companies with budget and a clear problem to solve." : "Connectors who hear problems and know the right people."}` }} />
                  </div>
                  <div style={{ padding: "20px 24px", background: "#f0f0f4", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#9999ad", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Full build value</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#9999ad" }}>{fmt(parsedVal)}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#9999ad", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>You pay</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: mc.main }}>{econ[0].v}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {econ.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#6b6b82", lineHeight: 1.5, padding: "8px 10px", borderRadius: 8, background: "#f0f0f4" }}>
                      <b style={{ display: "block", color: "#3d3d54", fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{e.l}</b>
                      {e.v}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 48, textAlign: "center", padding: "36px 24px", background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Ready to build something?</h2>
        <p style={{ fontSize: 14, color: "#6b6b82", lineHeight: 1.6, marginBottom: 20, maxWidth: 480, margin: "0 auto 20px" }}>
          Tell us what you're thinking. No pitch decks required — just a conversation about what you want to exist in the world.
        </p>
        <a href="mailto:hello@pandotic.ai" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 40, fontSize: 15, fontWeight: 600, color: "white", background: "linear-gradient(135deg, #0d8a6a, #6c4fcf)", textDecoration: "none" }}>
          Let's talk
        </a>
      </div>
    </div>
  );
}
