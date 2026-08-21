# syntax=docker/dockerfile:1

# --------------------------------------------------------------------------
# Build stage: compile the SPA and bundle the API server.
# --------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Install with the lockfile so the build is reproducible.
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# --------------------------------------------------------------------------
# Runtime stage: only production dependencies and the build output.
# --------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* bun.lock* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# Uploads live here; mount a volume at this path so files survive a redeploy.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node

EXPOSE 4000
ENV PORT=4000 HOST=0.0.0.0
CMD ["node", "dist-server/index.js"]
