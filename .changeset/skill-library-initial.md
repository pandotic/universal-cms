---
"@pandotic/skill-library": minor
---

Initial release of the Skill Library — marketing skill definitions, deployment adapters via GitHub PR, manifest sync, and scheduled fleet execution helpers.

Entry points:
- `./data/hub-skills`, `./data/hub-skill-deployments`, `./data/manifest-sync`, `./data/skill-upload`
- `./deploy`, `./deploy/github-pr`
- `./skills/marketing`
- `./types`

Consumers: internal Pandotic Hub + greenfield sites that want to deploy marketing skills against their properties. Published to GitHub Packages (`https://npm.pkg.github.com`).
