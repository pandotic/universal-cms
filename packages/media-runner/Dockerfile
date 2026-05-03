# syntax=docker/dockerfile:1.7

# ─── Builder ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Workspace context — copy lockfile + workspace manifest first for cache
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/cms-core/package.json packages/cms-core/
COPY packages/skill-library/package.json packages/skill-library/
COPY packages/media-runner/package.json packages/media-runner/

RUN pnpm install --frozen-lockfile \
    --filter @pandotic/media-runner... \
    --prod=false

# Source — only what the runner needs
COPY packages/cms-core packages/cms-core
COPY packages/media-runner packages/media-runner

RUN pnpm --filter @pandotic/universal-cms build && \
    pnpm --filter @pandotic/media-runner build

# ─── Runtime ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/package.json ./
COPY --from=builder /app/packages/cms-core/package.json packages/cms-core/
COPY --from=builder /app/packages/cms-core/dist packages/cms-core/dist
COPY --from=builder /app/packages/media-runner/package.json packages/media-runner/
COPY --from=builder /app/packages/media-runner/dist packages/media-runner/dist

RUN pnpm install --frozen-lockfile \
    --filter @pandotic/media-runner... \
    --prod

WORKDIR /app/packages/media-runner

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
