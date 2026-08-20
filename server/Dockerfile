# 100% Open-Source Production Dockerfile for VesperAero Server
# Node.js 20 Alpine Linux (Lightweight, Secure, Non-Root)

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Create persistent storage directory & configure permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-root secure user
USER node

# Expose API port
EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start VesperAero Server
CMD ["node", "index.js"]
