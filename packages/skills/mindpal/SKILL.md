---
name: mindpal
version: "1.0.0"
description: Build AI agents and multi-agent workflows on MindPal.space. Use when creating agents, configuring system instructions, designing workflows, setting up knowledge sources, or troubleshooting MindPal builds. Covers agent configuration (system instructions, brand voice, tools, MCP), workflow nodes (Agent, Loop, Router, Evaluator-Optimizer, etc.), variables, chatbot publishing, and common issues.
---

# MindPal Builder

Build AI agents and multi-agent workflows on MindPal.space.

## Core Concepts

MindPal has two main building blocks:

1. **Agents** - Specialized AI assistants trained for specific tasks
2. **Workflows** - Multi-agent pipelines where agents collaborate step-by-step

Key principle: Give agents **specific, focused jobs**. Instead of one agent to "handle marketing", create separate agents for social media posts, email drafts, and ad copy.

## Agent Configuration

### System Instructions

System instructions = the system prompt. Two sections:

**Background** - Who the agent is:
- Role/identity: "You are an experienced content strategist"
- Behavioral guidelines: "Communicate in a friendly yet professional manner"
- Task parameters: "Always start by understanding the target audience"
- Knowledge boundaries: "Deep knowledge of SEO best practices"
- Tool usage: "Use both Tavily and Exa Search tools together"

**Desired Output Format** - How to structure responses:
- Response structure and required components
- Formatting preferences and templates
- Output constraints (length, format)

### Best Practices for Instructions

**Do:**
- Be specific and unambiguous
- Keep the agent's purpose narrow
- Include examples of desired responses
- Set clear boundaries on what NOT to do
- Update based on performance

**Don't:**
- Give conflicting instructions
- Be vague (leads to inconsistent results)
- Overload with too many instructions
- Assume the agent knows things - state explicitly

### Knowledge Sources

Location: Assets → Knowledge Sources

**Types:**
- File uploads (PDF, Word, PPT, Excel, CSV, audio, video)
- URLs (can fetch sub-pages with "List all sub pages")
- Notes (dynamic, editable within MindPal)

**How it works:**
1. Content is chunked and vectorized
2. Agent searches chunks via semantic similarity
3. Most relevant chunks inform responses

**Advanced settings:**
- Chunk Size: Max size of content segments
- Chunk Overlap: Context preservation between chunks
- Separators: Characters that guide splitting

**Assign to agents:** Agent Settings → select individual items or folders. Folder changes auto-apply to assigned agents.

### Brand Voice

Location: Assets → Brand Voices

Upload sample text or describe preferences. MindPal analyzes and creates guidelines. Assign different voices for different purposes (formal emails vs casual social posts).

### Tools

Location: Assets → Tools

Connect agents to external APIs. Configure:
- HTTP method and endpoint URL
- Headers, query params, request body
- Mark fields as "Determined by AI" or fixed values

After adding tools, guide usage in system instructions: "When searching, use multiple queries" or "Always use tool X before tool Y".

### MCP (Model Context Protocol)

Connect agents to external tools via a single URL. Supports Streamable HTTP and SSE servers.

Setup: Agent Settings → MCP Section → Add remote MCP server URL

Compatible providers: Composio, Zapier, Make.com, Pabbly Connect, n8n, and others.

## Workflow Nodes

### Variables

Two types flow between nodes:
1. **Human Input Variables** - Values from Human Input Nodes
2. **AI Step Output Variables** - Results from previous agent steps

Add variables: Press "Add" symbol → select input/output. **Must show purple highlight** to be configured correctly. Can only reference nodes that come BEFORE current step.

### Node Reference

| Node | Purpose | When to Use |
|------|---------|-------------|
| Human Input | Collect user input | Workflow triggers, decision points, feedback |
| Agent | Single task execution | Focused, single-purpose operations |
| Evaluator-Optimizer | Self-improve output iteratively | Quality control, refinement |
| Loop | Process list of items | Batch processing (e.g., posts for multiple products) |
| Orchestrator-Worker | AI plans and delegates subtasks | Complex tasks with unpredictable steps |
| Subflow | Run another workflow | Reusable process components |
| Chat | Back-and-forth conversation | Discovery sessions, clarifying input |
| Code | Execute Python/JavaScript | Deterministic logic, calculations |
| Router | Branch to different paths | Conditional processing by input type |
| Gate | Stop workflow on conditions | Quality checks, cost control |
| Webhook | Send results externally | Integration with Zapier, Make, backends |
| Payment | Trigger payment | Monetized workflows |

### Loop vs Orchestrator-Worker

**Loop Node:** Use when you know the list of items upfront. Same task repeated for each item.

**Orchestrator-Worker:** Use when the AI needs to figure out the subtasks. Autonomous planning for unpredictable processes.

### Router vs Gate

**Router:** Directs input to different paths (multiple branches continue)

**Gate:** Stops or continues workflow (binary pass/fail)

## Workflow Patterns

### Content Pipeline
```
Human Input (topic) → Research Agent → Writer Agent → Editor Agent → Final Output
```

### Feedback Loop
```
Human Input → Agent → Evaluator-Optimizer (refines until criteria met) → Output
```

### Batch Processing
```
Human Input (list) → Loop Node (processes each item) → Webhook (sends results)
```

### Conditional Routing
```
Human Input → Router → [Path A: Technical Agent] / [Path B: Creative Agent] → Output
```

## Publishing

### Chatbots

Turn agents into public-facing chat interfaces. One agent can power multiple chatbots.

Configure:
- Select agent (required)
- Interface customization
- User data collection fields
- Webhook integration for collected data
- Access restrictions

Deploy via: Public link, iframe embed, or chat bubble widget

### Workflow Forms

Publish workflows as forms anyone can use. Get shareable link or embed on website.

### Run Modes

- **Default:** Real-time, one input set at a time
- **Supervised:** Review/approve each step before proceeding
- **Background:** Process while doing other work
- **Bulk Run:** Upload batch inputs for parallel processing

## Troubleshooting

### Context Length Errors
**Problem:** Agent references too much data from previous steps or knowledge sources.
**Solution:** Use larger context models (Claude 3.7 Sonnet, Gemini 2.0).

### Poor Answer Quality
**Problem:** Responses are inconsistent or low quality.
**Solution:** Use high-quality models (o3, Claude 3.7 Sonnet). Refine system instructions.

### Agent Not Using Knowledge Sources
**Problem:** Agent ignores uploaded documents.
**Solution:** Explicitly prompt: "Use the content from the knowledge source to answer."

### Tools Not Working
**Problem:** Agent fails at tasks like web search, image generation.
**Solution:** Verify tools are assigned in agent settings. Check tool configuration.

### Variables Not Working
**Problem:** Step doesn't receive expected data.
**Solution:** Ensure variable shows purple highlight. Can only reference PRIOR steps.

## Home Services Intelligence Patterns

See references/home-services-intelligence.md for detailed implementations of:
- HVAC load calculators
- Incentive/rebate finders
- Property analysis workflows
- Solar estimation
- Insulation recommendations

## Quick Build Checklist

**Agent Setup:**
- [ ] Clear, specific system instructions (Background + Output Format)
- [ ] Appropriate model selected
- [ ] Knowledge sources uploaded and assigned
- [ ] Brand voice configured (if needed)
- [ ] Tools added and usage explained in instructions
- [ ] Test thoroughly before publishing

**Workflow Setup:**
- [ ] Human Input Node captures all needed data
- [ ] Variables properly linked (purple highlight)
- [ ] Each Agent Node has clear prompt with variable references
- [ ] Quality checks via Evaluator-Optimizer or Gate nodes
- [ ] Webhook configured if external integration needed
- [ ] Test in Supervised mode first
