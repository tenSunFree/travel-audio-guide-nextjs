# syntax=docker/dockerfile:1

# ---- base: shared across all three stages -----------------------------
# Node version matches CI (.github/workflows/ci.yml uses Node 22)
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: install dependencies only, leverage layer cache ------------
FROM base AS deps
COPY package.json package-lock.json ./
# --ignore-scripts: skip postinstall (scripts/check-hooks.sh is only used for local Git hooks;
# the container has no .git directory and does not need it)
RUN npm ci --ignore-scripts

# ---- builder: next build (generate standalone output) ------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal runtime environment -------------------------------
FROM base AS runner
ENV NODE_ENV=production
# Cloud Run injects PORT (default 8080); HOSTNAME must be 0.0.0.0 to accept external traffic
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# standalone output already includes server.js and a minimal set of node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Currently the project has no public/ directory. If added later, include:
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# JSON store writes to process.cwd()/data; non-root user needs write permissions
# (Note: Cloud Run filesystem is ephemeral; data will not persist across redeployments)
RUN mkdir -p data && chown nextjs:nodejs data

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]