# @pandotic/skill-library

## 0.2.0

### Minor Changes

- [#66](https://github.com/pandotic/universal-cms/pull/66) [`285813d`](https://github.com/pandotic/universal-cms/commit/285813d545b3ea2fbdb2a7af17b0d32ea3d912e7) Thanks [@dangolden](https://github.com/dangolden)! - Initial release of the Skill Library — marketing skill definitions, deployment adapters via GitHub PR, manifest sync, and scheduled fleet execution helpers.

  Entry points:

  - `./data/hub-skills`, `./data/hub-skill-deployments`, `./data/manifest-sync`, `./data/skill-upload`
  - `./deploy`, `./deploy/github-pr`
  - `./skills/marketing`
  - `./types`

  Consumers: internal Pandotic Hub + greenfield sites that want to deploy marketing skills against their properties. Published to GitHub Packages (`https://npm.pkg.github.com`).

### Patch Changes

- Updated dependencies [[`b8d0eaa`](https://github.com/pandotic/universal-cms/commit/b8d0eaa9d3881eba996e7f75237f9d648998cb29)]:
  - @pandotic/universal-cms@0.2.0
