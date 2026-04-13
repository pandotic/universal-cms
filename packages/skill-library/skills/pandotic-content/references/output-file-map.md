# Output File Map

This defines how each output section maps to a file and where those files are saved.

## Output Locations

Every run produces files in **two places**:

1. **Local (in the project repo):** `pandotic-content-output/<project-slug>/`
2. **Website repo (`pandotic/pandotic_site`):** `docs/projects/<project-slug>/`

The local copy is the working draft. The website repo copy is the canonical source that the pandotic.ai CMS builds from.

## Directory Structure

```
<project-slug>/
  metadata.yaml
  case-study.md              # Section 3
  portfolio.md               # Section 4
  blurbs.md                  # Section 5
  video-script-long.md       # Section 6
  video-script-short.md      # Section 7
  features.md                # Section 8
  proof-points.md            # Section 11
  tech-differentiators.md    # Section 12
  screenshot-brief.md        # Section 13
  links.md                   # Section 14
  product-page.md            # Section 16
  internal/
    secret-sauce.md          # Section 9
    extensible.md            # Section 10
```

## Sections NOT Written to Files

| Section | Reason |
|---------|--------|
| 1. What I Believe This Project Is | Working alignment check — conversation only |
| 2. Current Code and Product-State Review | Working analysis — conversation only |
| 15. Missing Info / Follow-Up Gaps | Action items for the team — conversation only |
| Optional Extras | Ad hoc content — conversation only |

These sections are still produced in conversation but are not persisted as files.

## metadata.yaml Schema

Written at the root of each project's output directory:

```yaml
project_name: "<Human-readable project name>"
slug: "<project-slug>"
client: "<client name or 'internal'>"
generated: "<ISO 8601 date>"
generated_by: "pandotic-content skill v1.0.0"
status: "draft"

# URLs — set to null if not available
has_live_demo: true/false
demo_url: "<url or null>"
live_url: "<url or null>"
own_site_url: "<url or null>"
repo_url: "<url or null>"

# Hero asset
hero_screenshot: "screenshots/<recommended-hero-filename>"

# Video assets (produced from Sections 6 and 7)
video_long_id: "<project-slug>-long"
video_short_id: "<project-slug>-short"

# Content inventory
sections_included:
  - case-study
  - portfolio
  - blurbs
  - video-script-long
  - video-script-short
  - features
  - proof-points
  - tech-differentiators
  - screenshot-brief
  - links
  - product-page
  - internal/secret-sauce
  - internal/extensible

# Discovery
tags:
  - "<industry>"
  - "<technology>"
  - "<capability>"
```

## Per-File YAML Frontmatter

Every markdown output file includes this frontmatter block at the top so the CMS can ingest it:

```yaml
---
section: <section-number>
title: "<Section title>"
project: "<project-slug>"
status: draft
generated: "<ISO 8601 date>"
---
```

The `product-page.md` file (Section 16) has its own extended frontmatter — see the Section 16 spec in `output-sections.md`.

## Pushing to pandotic_site

The preferred workflow:

1. **If GitHub MCP tools are available:** Use `push_files` or `create_or_update_file` to write directly to `pandotic/pandotic_site` at `docs/projects/<project-slug>/`. Create a branch like `content/<project-slug>` and open a PR for review.

2. **If MCP tools are not available:** Write files locally to `pandotic-content-output/<project-slug>/` and instruct the user:
   ```
   Files saved to ./pandotic-content-output/<project-slug>/
   To publish: copy these files to docs/projects/<project-slug>/ in the pandotic_site repo and open a PR.
   ```

3. **If running inside the pandotic_site repo already:** Write directly to `docs/projects/<project-slug>/` — no copy step needed.

Always confirm with the user before pushing to the website repo.
