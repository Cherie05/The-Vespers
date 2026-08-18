# Multi-Stage Production Dockerfile for VesperAero Platform
# Optimized for Railway, Render, Fly.io, and Local Docker

# --- Stage 1: Build Client Frontend Applications ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root and app package files
COPY package*.json ./
COPY apps/capture-client/package*.json ./apps/capture-client/
COPY apps/gov-dashboard/package*.json ./apps/gov-dashboard/
COPY server/package*.json ./server/

# Install dependencies
RUN npm run install:all

# Copy source files
COPY apps/ ./apps/
COPY data/ ./data/

# Build frontends to dist
RUN npm run build

# --- Stage 2: Production Server Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server code and data
COPY server/ ./server/
COPY data/ ./data/

# Create persistent data volume directory
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-root secure user
USER node

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server/index.js"]
